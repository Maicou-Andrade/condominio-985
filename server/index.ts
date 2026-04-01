import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { runMigrations } from './db';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// tRPC
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Serve frontend in production
const clientDist = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/trpc')) {
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
