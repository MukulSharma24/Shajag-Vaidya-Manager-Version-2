// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, hashPassword } from '@/lib/auth';

// GET - List all users (Owner only)
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const includePatients = searchParams.get('includePatients') === 'true';

        const whereClause = includePatients
            ? {}
            : { role: { in: ['OWNER', 'DOCTOR', 'STAFF'] } };

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                patient: {
                    select: { id: true, phoneNumber: true, registrationId: true }
                },
                staff: {
                    select: { id: true, employeeId: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST - Create new user (Owner only)
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owners can create new users' }, { status: 403 });
        }

        const body = await req.json();
        const {
            name,
            email,
            password,
            role,
            phone,
            dateOfBirth,
            gender,
            bloodGroup,
        } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Name, email, password, and role are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Allow creating OWNER, DOCTOR, STAFF, PATIENT
        if (!['OWNER', 'DOCTOR', 'STAFF', 'PATIENT'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // For PATIENT, require additional fields
        if (role === 'PATIENT' && (!dateOfBirth || !gender)) {
            return NextResponse.json(
                { error: 'Date of birth and gender are required for patients' },
                { status: 400 }
            );
        }

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Handle PATIENT creation
        if (role === 'PATIENT') {
            const dob = new Date(dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            const result = await prisma.$transaction(async (tx) => {
                const patient = await tx.patient.create({
                    data: {
                        fullName: name.trim(),
                        dateOfBirth: dob,
                        age,
                        gender,
                        phoneNumber: phone || '',
                        email: email.toLowerCase().trim(),
                        bloodGroup: bloodGroup || null,
                        constitutionType: 'Not assessed yet',
                    }
                });

                const user = await tx.user.create({
                    data: {
                        name: name.trim(),
                        email: email.toLowerCase().trim(),
                        password: hashedPassword,
                        role: 'PATIENT',
                        isActive: true,
                        patient: { connect: { id: patient.id } }
                    }
                });

                await tx.patient.update({
                    where: { id: patient.id },
                    data: { userId: user.id }
                });

                return { user, patient };
            });

            return NextResponse.json({
                message: 'Patient account created successfully',
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                }
            }, { status: 201 });
        }

        // Handle OWNER, DOCTOR, STAFF creation
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role,
                isActive: true,
            }
        });

        // Create staff record for DOCTOR/STAFF (optional, if phone provided)
        if ((role === 'DOCTOR' || role === 'STAFF') && phone) {
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || name;
            const lastName = nameParts.slice(1).join(' ') || '';

            await prisma.staff.create({
                data: {
                    employeeId: `EMP-${Date.now().toString().slice(-6)}`,
                    firstName,
                    lastName,
                    email: email.toLowerCase().trim(),
                    phone,
                    role,
                    joiningDate: new Date(),
                    basicSalary: 0,
                    clinicId: 'default-clinic',
                    userId: user.id,
                    canLogin: true,
                }
            });
        }

        return NextResponse.json({
            message: `${role} account created successfully`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}