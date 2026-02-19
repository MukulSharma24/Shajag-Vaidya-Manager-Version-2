// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// ============================================
// GET single patient — scoped to clinic
// ============================================
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const patient = await prisma.patient.findFirst({
            where: {
                id: params.id,
                clinicId: payload.clinicId, // ✅ Ensures patient belongs to this clinic
            },
            include: {
                appointments: {
                    orderBy: { appointmentDate: 'desc' },
                    take: 5,
                },
                Prescription: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
    }
}

// ============================================
// PATCH — Update patient
// ============================================
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // ✅ Verify patient belongs to this clinic before updating
        const existing = await prisma.patient.findFirst({
            where: { id: params.id, clinicId: payload.clinicId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Check if phone number already exists for another patient in same clinic
        if (body.phoneNumber) {
            const existingPatient = await prisma.patient.findFirst({
                where: {
                    phoneNumber: body.phoneNumber,
                    clinicId: payload.clinicId, // ✅ Scoped to clinic
                    NOT: { id: params.id },
                },
            });

            if (existingPatient) {
                return NextResponse.json(
                    { error: 'Phone number already registered' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};

        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.age !== undefined) updateData.age = body.age;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.city !== undefined) updateData.city = body.city;
        if (body.state !== undefined) updateData.state = body.state;
        if (body.pincode !== undefined) updateData.pincode = body.pincode;
        if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
        if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
        if (body.allergies !== undefined) updateData.allergies = body.allergies;
        if (body.chronicDiseases !== undefined) updateData.chronicDiseases = body.chronicDiseases;
        if (body.currentMedications !== undefined) updateData.currentMedications = body.currentMedications;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const patient = await prisma.patient.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(patient);
    } catch (error) {
        console.error('Error updating patient:', error);
        return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
    }
}

// ============================================
// DELETE patient
// ============================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // ✅ Verify patient belongs to this clinic before deleting
        const existing = await prisma.patient.findFirst({
            where: { id: params.id, clinicId: payload.clinicId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        await prisma.patient.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting patient:', error);
        return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
    }
}