// src/lib/get-current-user.ts
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export interface CurrentUser {
    userId: string;
    email: string;
    name: string;
    role: string;
    patientId?: string;
    staffId?: string;
}

/**
 * Get the current authenticated user from the request
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        const payload = await getUserFromToken(token);
        if (!payload) {
            return null;
        }

        return {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            patientId: payload.patientId,
        };
    } catch {
        return null;
    }
}

/**
 * Get the current patient ID for patient-portal APIs
 * Returns the patientId from JWT or fetches from database
 * Throws error if not a patient or not authenticated
 */
export async function getCurrentPatientId(): Promise<string> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    if (user.role !== 'PATIENT') {
        throw new Error('Access denied. Patients only.');
    }

    // Try to get from JWT first
    if (user.patientId) {
        return user.patientId;
    }

    // Fallback: fetch from database
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { patient: { select: { id: true } } },
    });

    if (!dbUser?.patient?.id) {
        throw new Error('Patient record not found');
    }

    return dbUser.patient.id;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Not authenticated');
    }
    return user;
}

/**
 * Require specific role - throws if not authorized
 */
export async function requireRole(allowedRoles: string[]): Promise<CurrentUser> {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        throw new Error('Access denied');
    }
    return user;
}