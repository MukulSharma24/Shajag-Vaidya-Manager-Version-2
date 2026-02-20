// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// Helper to get clinicId
async function getClinicId(payload: any): Promise<string | null> {
    if (payload?.clinicId) return payload.clinicId;

    if (payload?.userId) {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                clinicId: true,
                staff: { select: { clinicId: true } },
                patient: { select: { clinicId: true } },
            },
        });

        if (user?.clinicId) return user.clinicId;
        if (user?.staff?.clinicId) return user.staff.clinicId;
        if (user?.patient?.clinicId) return user.patient.clinicId;
    }

    const defaultClinic = await prisma.clinic.findFirst({ select: { id: true } });
    return defaultClinic?.id || null;
}

// GET /api/patients/[id] - Get single patient
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getUserFromToken(token);
        const clinicId = await getClinicId(payload);

        const patient = await prisma.patient.findFirst({
            where: {
                id: params.id,
                ...(clinicId && { clinicId }),
            },
            include: {
                appointments: {
                    orderBy: { appointmentDate: 'desc' },
                    take: 10,
                },
                Prescription: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                bills: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                TherapyPlan: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                DietPlan: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patient' },
            { status: 500 }
        );
    }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getUserFromToken(token);
        const clinicId = await getClinicId(payload);

        // Verify patient exists and belongs to clinic
        const existing = await prisma.patient.findFirst({
            where: {
                id: params.id,
                ...(clinicId && { clinicId }),
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Calculate age if date of birth changed
        let age = body.age;
        if (body.dateOfBirth) {
            const dob = new Date(body.dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
        }

        const patient = await prisma.patient.update({
            where: { id: params.id },
            data: {
                fullName: body.fullName,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                age: age,
                gender: body.gender,
                phoneNumber: body.phoneNumber,
                email: body.email || null,
                bloodGroup: body.bloodGroup || null,
                addressLine1: body.addressLine1 || null,
                addressLine2: body.addressLine2 || null,
                city: body.city || null,
                state: body.state || null,
                postalCode: body.postalCode || null,
                constitutionType: body.constitutionType,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(patient);
    } catch (error) {
        console.error('Error updating patient:', error);
        return NextResponse.json(
            { error: 'Failed to update patient' },
            { status: 500 }
        );
    }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getUserFromToken(token);
        const clinicId = await getClinicId(payload);

        // Verify patient exists and belongs to clinic
        const existing = await prisma.patient.findFirst({
            where: {
                id: params.id,
                ...(clinicId && { clinicId }),
            },
            include: {
                _count: {
                    select: {
                        Prescription: true,
                        bills: true,
                        appointments: true,
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        // Use transaction to delete related records first, then patient
        await prisma.$transaction(async (tx) => {
            // Delete prescriptions and their medicines
            const prescriptions = await tx.prescription.findMany({
                where: { patientId: params.id },
                select: { id: true },
            });

            for (const rx of prescriptions) {
                await tx.prescriptionMedicine.deleteMany({
                    where: { prescriptionId: rx.id },
                });
            }

            await tx.prescription.deleteMany({
                where: { patientId: params.id },
            });

            // Delete therapy sessions and plans
            const therapyPlans = await tx.therapyPlan.findMany({
                where: { patientId: params.id },
                select: { id: true },
            });

            for (const plan of therapyPlans) {
                await tx.therapySession.deleteMany({
                    where: { planId: plan.id },
                });
            }

            await tx.therapyPlan.deleteMany({
                where: { patientId: params.id },
            });

            // Delete diet plans
            await tx.dietPlan.deleteMany({
                where: { patientId: params.id },
            });

            // Delete payments
            await tx.payment.deleteMany({
                where: { patientId: params.id },
            });

            // Delete bill items and bills
            const bills = await tx.bill.findMany({
                where: { patientId: params.id },
                select: { id: true },
            });

            for (const bill of bills) {
                await tx.billItem.deleteMany({
                    where: { billId: bill.id },
                });
            }

            await tx.bill.deleteMany({
                where: { patientId: params.id },
            });

            // Delete patient ledger entries
            await tx.patientLedger.deleteMany({
                where: { patientId: params.id },
            });

            // Delete payment confirmations
            await tx.paymentConfirmation.deleteMany({
                where: { patientId: params.id },
            });

            // Delete appointments
            await tx.appointment.deleteMany({
                where: { patientId: params.id },
            });

            // Finally delete the patient
            await tx.patient.delete({
                where: { id: params.id },
            });
        });

        return NextResponse.json({
            message: 'Patient and all related records deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete patient',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}