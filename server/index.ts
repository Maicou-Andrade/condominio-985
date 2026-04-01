import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { runMigrations } from './db';
import { verifyGoogleToken, findCasaByEmail, generateSessionToken, verifySessionToken, ADMIN_EMAIL, impersonateCasa } from './auth';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ===== AUTH ROUTES =====
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credential required' });

    const googleUser = await verifyGoogleToken(credential);
    if (!googleUser) return res.status(401).json({ error: 'Invalid Google token' });

    const casa = await findCasaByEmail(googleUser.email);
    if (!casa) {
      return res.status(403).json({
        error: 'not_registered',
        message: 'E-mail não cadastrado em nenhuma casa',
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
    }

    const token = generateSessionToken(casa);
    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: casa, token });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = (req as any).cookies?.session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ user: null });
  const user = verifySessionToken(token);
  return res.json({ user });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('session');
  return res.json({ success: true });
});

app.post('/api/auth/impersonate', (req, res) => {
  const token = (req as any).cookies?.session || req.headers.authorization?.replace('Bearer ', '');
  const currentUser = token ? verifySessionToken(token) : null;
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { casaId } = req.body;
  if (!casaId) return res.status(400).json({ error: 'casaId required' });

  impersonateCasa(casaId).then(targetUser => {
    if (!targetUser) return res.status(404).json({ error: 'Casa não encontrada' });

    const newToken = generateSessionToken({
      ...targetUser,
      nome: `${targetUser.nome} (via Admin)`,
    });
    res.cookie('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ user: targetUser, token: newToken });
  }).catch(() => res.status(500).json({ error: 'Erro interno' }));
});

// ===== tRPC =====
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: ({ req }) => {
    const token = (req as any).cookies?.session || req.headers.authorization?.replace('Bearer ', '');
    const user = token ? verifySessionToken(token) : null;
    return { user };
  },
}));

// ===== Serve frontend =====
const clientDist = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/trpc') && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏠 Condomínio 985 running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
