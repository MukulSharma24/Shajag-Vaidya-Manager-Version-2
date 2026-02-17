// src/app/api/auth/patient-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signJWT } from '@/lib/auth';
import { formatPatientId } from '@/lib/patient-password';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { loginMethod, email, phone, patientId, password } = body;

        // Validate input
        if (loginMethod === 'email') {
            if (!email || !password) {
                return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
            }
        } else if (loginMethod === 'phone') {
            if (!phone || !patientId || !password) {
                return NextResponse.json({ error: 'Phone, Patient ID, and password are required' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid login method' }, { status: 400 });
        }

        let user;
        let patient;

        if (loginMethod === 'email') {
            // Email login
            user = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() },
                include: { patient: true },
            });

            if (!user) {
                return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
            }
            patient = user.patient;

        } else {
            // Phone + Patient ID login
            // Extract registration number from patient ID (P000001 → 1)
            const cleanPatientId = patientId.toString().toUpperCase().replace(/^P/, '');
            const registrationId = parseInt(cleanPatientId, 10);

            if (isNaN(registrationId)) {
                return NextResponse.json({ error: 'Invalid Patient ID format' }, { status: 400 });
            }

            // Clean phone
            const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '');

            // Find patient
            patient = await prisma.patient.findFirst({
                where: { registrationId },
                include: { user: true },
            });

            // Verify phone matches
            if (patient) {
                const patientPhone = patient.phoneNumber.replace(/[\s\-]/g, '').replace(/^\+91/, '');
                if (cleanPhone.slice(-10) !== patientPhone.slice(-10)) {
                    patient = null;
                }
            }

            if (!patient) {
                return NextResponse.json({ error: 'Invalid phone number or Patient ID' }, { status: 401 });
            }

            if (!patient.user) {
                return NextResponse.json({ error: 'No login account found. Please contact the clinic.' }, { status: 401 });
            }

            user = patient.user;
        }

        // Verify user and password
        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.role !== 'PATIENT') {
            return NextResponse.json({ error: 'This login is for patients only.' }, { status: 403 });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account deactivated. Please contact the clinic.' }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Get patient if not loaded
        if (!patient) {
            patient = await prisma.patient.findFirst({ where: { userId: user.id } });
        }

        if (!patient) {
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }

        // Create JWT
        const token = await signJWT({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            patientId: patient.id,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                patientId: patient.id,
                registrationId: patient.registrationId,
                patientIdString: formatPatientId(patient.registrationId),
            },
            redirectTo: '/patient-portal',
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Patient login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}