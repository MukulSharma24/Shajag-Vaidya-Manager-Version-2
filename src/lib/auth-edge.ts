// src/lib/auth-edge.ts
import { jwtVerify } from 'jose';

// ============================================
// JWT CONFIGURATION FOR EDGE RUNTIME
// ============================================

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'
);

// ============================================
// TYPES
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: string;
    patientId?: string;
}

// ============================================
// JWT FUNCTIONS
// ============================================

/**
 * Verify JWT in Edge runtime
 */
export async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
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
 * Get token from cookie string
 */
export function getTokenFromCookieString(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth-token='));

    if (!authCookie) return null;
    return authCookie.split('=')[1];
}