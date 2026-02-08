// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/patients
// Search patients with proper error handling
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        console.log('🔍 Patient API - Search query:', search);

        // Build where clause
        const where: any = {};

        if (search && search.length >= 1) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        console.log('📋 Where clause:', JSON.stringify(where));

        // Fetch patients
        const patients = await prisma.patient.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                dateOfBirth: true,
                age: true,
                gender: true,
                phoneNumber: true,
                email: true,
                bloodGroup: true,
                constitutionType: true,
            },
            orderBy: {
                fullName: 'asc',
            },
            take: 50, // Limit results
        });

        console.log('✅ Found patients:', patients.length);

        return NextResponse.json({
            patients,
            count: patients.length
        });

    } catch (error: any) {
        console.error('❌ Patient API Error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });

        return NextResponse.json(
            {
                message: 'Failed to fetch patients',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/patients
// Create new patient
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('📝 Creating patient:', body.fullName);

        // Validate required fields
        if (!body.fullName || !body.phoneNumber) {
            return NextResponse.json(
                { error: 'Name and phone number are required' },
                { status: 400 }
            );
        }

        // Create the patient
        const patient = await prisma.patient.create({
            data: {
                fullName: body.fullName,
                dateOfBirth: new Date(body.dateOfBirth),
                age: parseInt(body.age),
                gender: body.gender,
                phoneNumber: body.phoneNumber,
                email: body.email || null,
                bloodGroup: body.bloodGroup || null,
                addressLine1: body.addressLine1 || null,
                addressLine2: body.addressLine2 || null,
                postalCode: body.postalCode || null,
                city: body.city || null,
                state: body.state || null,
                constitutionType: body.constitutionType,
                notes: body.notes || null,
            },
        });

        console.log('✅ Patient created:', patient.id);

        return NextResponse.json(patient, { status: 201 });

    } catch (error: any) {
        console.error('❌ Error creating patient:', error);

        return NextResponse.json(
            {
                error: 'Failed to create patient',
                message: error.message
            },
            { status: 500 }
        );
    }
}