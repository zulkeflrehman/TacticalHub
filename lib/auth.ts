import * as bcrypt from 'bcrypt';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'tecticalhub_super_secret_jwt_key_1234567890_change_me_in_prod';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'tecticalhub_session';

export interface SessionUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  name?: string;
  phone?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  const jwt = await new jose.SignJWT({ 
    id: user.id, 
    email: user.email, 
    role: user.role,
    name: user.name,
    phone: user.phone
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  return jwt;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jose.jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'CUSTOMER' | 'ADMIN',
      name: payload.name as string,
      phone: payload.phone as string
    };
  } catch (err) {
    return null;
  }
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'CUSTOMER' | 'ADMIN',
      name: payload.name as string,
      phone: payload.phone as string
    };
  } catch (err) {
    return null;
  }
}

export async function verifyFirebaseIdToken(token: string) {
  try {
    const { adminAuth } = await import('./firebase-admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    console.error("Firebase ID Token verification error:", err);
    return null;
  }
}

