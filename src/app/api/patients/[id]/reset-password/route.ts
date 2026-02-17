// src/app/api/patients/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, hashPassword } from '@/lib/auth';
import { generatePatientPassword, formatPatientId } from '@/lib/patient-password';

// POST - Reset patient password to default
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

        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: true },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        if (!patient.userId || !patient.user) {
            return NextResponse.json({ error: 'Patient does not have login. Create login first.' }, { status: 400 });
        }

        const patientIdString = formatPatientId(patient.registrationId);
        const defaultPassword = generatePatientPassword(patient.phoneNumber, patientIdString);
        const hashedPassword = await hashPassword(defaultPassword);

        await prisma.user.update({
            where: { id: patient.userId },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset to default',
            loginInfo: {
                email: patient.email,
                phone: patient.phoneNumber,
                patientId: patientIdString,
                defaultPassword: defaultPassword,
            },
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}