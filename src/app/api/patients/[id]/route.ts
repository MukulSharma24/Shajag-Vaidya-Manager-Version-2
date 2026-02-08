// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET single patient
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id: params.id },
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

// UPDATE patient
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Check if phone number already exists (for another patient)
        if (body.phoneNumber) {
            const existingPatient = await prisma.patient.findFirst({
                where: {
                    phoneNumber: body.phoneNumber,
                    NOT: {
                        id: params.id
                    }
                },
            });

            if (existingPatient) {
                return NextResponse.json(
                    { error: 'Phone number already registered' },
                    { status: 400 }
                );
            }
        }

        // Build update data object dynamically
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
        return NextResponse.json(
            { error: 'Failed to update patient' },
            { status: 500 }
        );
    }
}

// DELETE patient
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.patient.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting patient:', error);
        return NextResponse.json(
            { error: 'Failed to delete patient' },
            { status: 500 }
        );
    }
}