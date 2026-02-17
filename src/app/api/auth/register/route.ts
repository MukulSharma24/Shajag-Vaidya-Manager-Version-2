// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            email,
            password,
            fullName,
            dateOfBirth,
            gender,
            phoneNumber,
            bloodGroup,
            addressLine1,
            city,
            state,
            postalCode,
        } = body;

        // ── Validate required fields ──
        if (!email || !password || !fullName || !dateOfBirth || !gender || !phoneNumber) {
            return NextResponse.json(
                { error: 'Please fill in all required fields' },
                { status: 400 }
            );
        }

        // ── Validate email format ──
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // ── Validate password strength ──
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // ── Check if email already exists ──
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            );
        }

        // ── Hash password ──
        const hashedPassword = await hashPassword(password);

        // ── Calculate age from date of birth ──
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        // ── Create patient and user in transaction ──
        const result = await prisma.$transaction(async (tx) => {
            // Create patient record first
            const patient = await tx.patient.create({
                data: {
                    fullName: fullName.trim(),
                    dateOfBirth: dob,
                    age,
                    gender,
                    phoneNumber: phoneNumber.trim(),
                    email: email.toLowerCase().trim(),
                    bloodGroup: bloodGroup || null,
                    addressLine1: addressLine1 || null,
                    city: city || null,
                    state: state || null,
                    postalCode: postalCode || null,
                    constitutionType: 'Not assessed yet',
                }
            });

            // Create user account linked to patient
            const user = await tx.user.create({
                data: {
                    name: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: 'PATIENT',
                    isActive: true,
                    patient: {
                        connect: { id: patient.id }
                    }
                }
            });

            // Update patient with userId
            await tx.patient.update({
                where: { id: patient.id },
                data: { userId: user.id }
            });

            return { user, patient };
        });

        return NextResponse.json({
            success: true,
            message: 'Registration successful! You can now login.',
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed. Please try again.' },
            { status: 500 }
        );
    }
}