import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getPool } from './db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'condominio985-secret-2026';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface AuthUser {
  casaId: number;
  casaNumero: string;
  nome: string;
  email: string;
}

export async function verifyGoogleToken(credential: string): Promise<{ email: string; name: string; picture: string } | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return null;
    return {
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture || '',
    };
  } catch (e) {
    console.error('Google token verification failed:', e);
    return null;
  }
}

export function generateSessionToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

export function verifySessionToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function findCasaByEmail(email: string): Promise<AuthUser | null> {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, numero, nome_morador, email FROM casas WHERE email = ?',
    [email]
  ) as any;
  if (rows.length === 0) return null;
  const casa = rows[0];
  return {
    casaId: casa.id,
    casaNumero: casa.numero,
    nome: casa.nome_morador,
    email: casa.email,
  };
}

export const ADMIN_EMAIL = 'maicouandrade@msconsultoria.net.br';

export async function impersonateCasa(casaId: number): Promise<AuthUser | null> {
  const pool = (await import('./db')).getPool();
  const [rows] = await pool.query(
    'SELECT id, numero, nome_morador, email FROM casas WHERE id = ?',
    [casaId]
  ) as any;
  if (rows.length === 0) return null;
  const casa = rows[0];
  return {
    casaId: casa.id,
    casaNumero: casa.numero,
    nome: casa.nome_morador,
    email: casa.email,
  };
}
