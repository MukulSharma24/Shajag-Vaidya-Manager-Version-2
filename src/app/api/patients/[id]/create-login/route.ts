// src/app/api/patients/[id]/create-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, hashPassword } from '@/lib/auth';
import { generatePatientPassword, formatPatientId } from '@/lib/patient-password';

// POST - Create login for existing patient
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: patientId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || !['OWNER', 'DOCTOR', 'STAFF'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Get patient
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: true },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        if (patient.userId && patient.user) {
            return NextResponse.json({ error: 'Patient already has login credentials', hasLogin: true }, { status: 400 });
        }

        if (!patient.email) {
            return NextResponse.json({ error: 'Patient email is required. Please update patient details first.' }, { status: 400 });
        }

        // Check if email already used
        const existingUser = await prisma.user.findUnique({
            where: { email: patient.email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'This email is already registered with another account' }, { status: 400 });
        }

        // Generate patient ID string and password
        const patientIdString = formatPatientId(patient.registrationId);
        const defaultPassword = generatePatientPassword(patient.phoneNumber, patientIdString);
        const hashedPassword = await hashPassword(defaultPassword);

        // Create user account
        const user = await prisma.user.create({
            data: {
                name: patient.fullName,
                email: patient.email.toLowerCase(),
                password: hashedPassword,
                role: 'PATIENT',
                isActive: true,
            },
        });

        // Link user to patient
        await prisma.patient.update({
            where: { id: patientId },
            data: { userId: user.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Login created successfully',
            loginInfo: {
                email: patient.email,
                phone: patient.phoneNumber,
                patientId: patientIdString,
                defaultPassword: defaultPassword,
            },
        }, { status: 201 });

    } catch (error) {
        console.error('Create patient login error:', error);
        return NextResponse.json({ error: 'Failed to create login' }, { status: 500 });
    }
}

// GET - Check login status
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: patientId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: { select: { id: true, email: true, isActive: true } } },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        const patientIdString = formatPatientId(patient.registrationId);
        const defaultPassword = generatePatientPassword(patient.phoneNumber, patientIdString);

        return NextResponse.json({
            hasLogin: !!patient.userId,
            isActive: patient.user?.isActive ?? false,
            loginInfo: patient.userId ? {
                email: patient.email,
                phone: patient.phoneNumber,
                patientId: patientIdString,
                defaultPassword: defaultPassword,
            } : null,
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }
}