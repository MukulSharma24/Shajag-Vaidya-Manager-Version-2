// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // ── Validate input ──
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // ── Find user with related data ──
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
                patient: { select: { id: true } },
                staff: { select: { id: true, employeeId: true } },
            },
        });

        // ── User not found or no password ──
        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // ── Account deactivated ──
        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Your account has been deactivated. Please contact the clinic.' },
                { status: 403 }
            );
        }

        // ── Verify password ──
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // ── Create JWT with patientId for patient users ──
        // This is CRITICAL for patient data isolation
        const token = await signJWT({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            // Include patientId in JWT so patient APIs can filter data
            patientId: user.patient?.id,
        });

        // ── Build response payload ──
        const userPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            patientId: user.patient?.id ?? null,
            staffId: user.staff?.id ?? null,
            employeeId: user.staff?.employeeId ?? null,
        };

        // ── Determine redirect ──
        const redirectTo = user.role === 'PATIENT' ? '/patient-portal' : '/dashboard';

        const response = NextResponse.json({
            success: true,
            user: userPayload,
            redirectTo,
        });

        // ── Set HTTP-only secure cookie ──
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}