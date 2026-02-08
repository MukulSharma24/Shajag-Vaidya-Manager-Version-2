import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Fetch all staff with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const clinicId = searchParams.get('clinicId');

        const where: any = {};

        if (clinicId) {
            where.clinicId = clinicId;
        }

        if (role && role !== 'ALL') {
            where.role = role;
        }

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { employeeId: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [staff, total] = await Promise.all([
            prisma.staff.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.staff.count({ where }),
        ]);

        // Summary stats
        const statsWhere: any = {};
        if (clinicId) statsWhere.clinicId = clinicId;

        const stats = await prisma.staff.groupBy({
            by: ['status'],
            where: statsWhere,
            _count: true,
        });

        const roleStatsWhere: any = { status: 'ACTIVE' };
        if (clinicId) roleStatsWhere.clinicId = clinicId;

        const roleStats = await prisma.staff.groupBy({
            by: ['role'],
            where: roleStatsWhere,
            _count: true,
        });

        const totalSalaryWhere: any = {
            status: 'ACTIVE',
        };
        if (clinicId) totalSalaryWhere.clinicId = clinicId;

        const totalSalary = await prisma.staff.aggregate({
            where: totalSalaryWhere,
            _sum: {
                basicSalary: true,
                allowances: true,
            },
        });

        return NextResponse.json({
            staff,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
            stats: {
                byStatus: stats.map(s => ({
                    status: s.status,
                    count: s._count,
                })),
                byRole: roleStats.map(r => ({
                    role: r.role,
                    count: r._count,
                })),
                totalSalary: Number(totalSalary._sum.basicSalary || 0) + Number(totalSalary._sum.allowances || 0),
            },
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}

// POST - Create new staff member
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            firstName,
            lastName,
            email,
            phone,
            alternatePhone,
            dateOfBirth,
            gender,
            bloodGroup,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            aadhaarNumber,
            panNumber,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelation,
            role,
            department,
            designation,
            joiningDate,
            employmentType,
            qualification,
            specialization,
            experienceYears,
            licenseNumber,
            licenseExpiry,
            basicSalary,
            allowances,
            hra,
            otherAllowances,
            bankName,
            accountNumber,
            ifscCode,
            accountHolderName,
            canLogin = false,
            userPassword,
            clinicId,
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !role || !joiningDate || !basicSalary) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!clinicId) {
            return NextResponse.json(
                { error: 'Clinic ID is required' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = await prisma.staff.findFirst({
            where: {
                email,
                clinicId,
            },
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        // Generate employee ID
        const lastStaff = await prisma.staff.findFirst({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
            select: { employeeId: true },
        });

        const employeeId = generateEmployeeId(lastStaff?.employeeId, role);

        // Create user account if canLogin is true
        let userId = null;
        if (canLogin && userPassword) {
            const hashedPassword = await bcrypt.hash(userPassword, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                },
            });

            userId = user.id;
        }

        // Create staff member
        const staff = await prisma.staff.create({
            data: {
                employeeId,
                firstName,
                lastName,
                email,
                phone,
                alternatePhone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender,
                bloodGroup,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
                aadhaarNumber,
                panNumber,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelation,
                role,
                department,
                designation,
                joiningDate: new Date(joiningDate),
                employmentType,
                qualification,
                specialization,
                experienceYears: experienceYears || 0,
                licenseNumber,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
                basicSalary,
                allowances: allowances || 0,
                hra: hra || 0,
                otherAllowances: otherAllowances || 0,
                bankName,
                accountNumber,
                ifscCode,
                accountHolderName,
                userId,
                canLogin,
                status: 'ACTIVE',
                clinicId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        // Initialize leave balance for the current year
        const currentYear = new Date().getFullYear();
        await prisma.leaveBalance.create({
            data: {
                staffId: staff.id,
                year: currentYear,
                clinicId,
            },
        });

        return NextResponse.json({ staff }, { status: 201 });
    } catch (error) {
        console.error('Error creating staff:', error);
        return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
    }
}

// Helper functions
function generateEmployeeId(lastEmployeeId?: string, role?: string): string {
    const rolePrefix: Record<string, string> = {
        DOCTOR: 'DOC',
        RECEPTIONIST: 'REC',
        THERAPIST: 'THR',
        PHARMACIST: 'PHR',
        LAB_TECHNICIAN: 'LAB',
        NURSE: 'NUR',
        MANAGER: 'MGR',
        OTHER: 'EMP',
    };

    const prefix = role ? rolePrefix[role] || 'EMP' : 'EMP';
    const year = new Date().getFullYear().toString().slice(-2);

    if (!lastEmployeeId) {
        return `${prefix}${year}0001`;
    }

    const lastNumber = parseInt(lastEmployeeId.slice(-4)) || 0;
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${year}${newNumber}`;
}