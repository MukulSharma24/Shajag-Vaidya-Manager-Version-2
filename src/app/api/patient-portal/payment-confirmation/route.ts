import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        // Get JWT from cookie
        const token = req.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || payload.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get patient record
        const patient = await prisma.patient.findUnique({
            where: { userId: payload.userId },
            select: { id: true },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }

        const body = await req.json();
        const { name, email, phone, amount } = body;

        // Validate required fields
        if (!name || !email || !phone || !amount) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Generate confirmation number
        const confirmationNumber = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Create payment confirmation record
        const paymentConfirmation = await prisma.paymentConfirmation.create({
            data: {
                confirmationNumber,
                patientId: patient.id,
                patientName: name,
                patientEmail: email,
                patientPhone: phone,
                amount: parseFloat(amount),
                status: 'PENDING_VERIFICATION',
                clinicId: 'default-clinic', // Assuming single clinic
            },
        });

        return NextResponse.json({
            message: 'Payment confirmation submitted successfully',
            confirmationNumber: paymentConfirmation.confirmationNumber,
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        return NextResponse.json(
            { error: 'Failed to submit payment confirmation' },
            { status: 500 }
        );
    }
}