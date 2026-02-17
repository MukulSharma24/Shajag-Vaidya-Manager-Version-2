// src/lib/auth.ts
import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

// ============================================
// JWT CONFIGURATION - PRODUCTION READY
// ============================================

// Validate JWT_SECRET exists in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('❌ JWT_SECRET environment variable is required in production!');
}

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'
);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================
// TYPES
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: string;
    patientId?: string; // Include patientId in JWT for patient users
}

// ============================================
// PASSWORD FUNCTIONS
// ============================================

/**
 * Hash a password using bcrypt (10 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// JWT FUNCTIONS
// ============================================

/**
 * Sign a JWT token with user payload
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload } as JoseJWTPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        if (
            payload &&
            typeof payload.userId === 'string' &&
            typeof payload.email === 'string' &&
            typeof payload.name === 'string' &&
            typeof payload.role === 'string'
        ) {
            return {
                userId: payload.userId,
                email: payload.email,
                name: payload.name,
                role: payload.role,
                patientId: typeof payload.patientId === 'string' ? payload.patientId : undefined,
            };
        }
        return null;
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

/**
 * Get user from token (alias for verifyJWT)
 */
export async function getUserFromToken(token: string): Promise<JWTPayload | null> {
    return verifyJWT(token);
}

/**
 * Get token from cookie string (for middleware)
 */
export function getTokenFromCookieString(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth-token='));

    if (!authCookie) return null;
    return authCookie.split('=')[1];
}