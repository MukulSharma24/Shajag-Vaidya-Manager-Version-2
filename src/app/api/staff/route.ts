// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Fetch all staff with filters
export async function GET(req: NextRequest) {
    try {
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // ✅ Always from JWT — ignore any clinicId from query params
        const clinicId = payload.clinicId;

        const where: any = { clinicId };

        if (role && role !== 'ALL') where.role = role;
        if (status && status !== 'ALL') where.status = status;

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
                    user: { select: { id: true, email: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.staff.count({ where }),
        ]);

        const stats = await prisma.staff.groupBy({
            by: ['status'],
            where: { clinicId },
            _count: true,
        });

        const roleStats = await prisma.staff.groupBy({
            by: ['role'],
            where: { clinicId, status: 'ACTIVE' },
            _count: true,
        });

        const totalSalary = await prisma.staff.aggregate({
            where: { clinicId, status: 'ACTIVE' },
            _sum: { basicSalary: true, allowances: true },
        });

        return NextResponse.json({
            staff,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            stats: {
                byStatus: stats.map(s => ({ status: s.status, count: s._count })),
                byRole: roleStats.map(r => ({ role: r.role, count: r._count })),
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
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const {
            firstName, lastName, email, phone, alternatePhone,
            dateOfBirth, gender, bloodGroup,
            addressLine1, addressLine2, city, state, pincode,
            aadhaarNumber, panNumber,
            emergencyContactName, emergencyContactPhone, emergencyContactRelation,
            role, department, designation,
            joiningDate, employmentType,
            qualification, specialization, experienceYears,
            licenseNumber, licenseExpiry,
            basicSalary, allowances, hra, otherAllowances,
            bankName, accountNumber, ifscCode, accountHolderName,
            canLogin = false, userPassword,
        } = body;

        // ✅ clinicId always from JWT
        const clinicId = payload.clinicId;

        const missingFields = [];
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        if (!role) missingFields.push('role');
        if (!joiningDate) missingFields.push('joiningDate');
        if (basicSalary === undefined || basicSalary === null || basicSalary === '') missingFields.push('basicSalary');

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        if (canLogin && (!userPassword || userPassword.length < 6)) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters when login is enabled' },
                { status: 400 }
            );
        }

        const existingStaffEmail = await prisma.staff.findFirst({
            where: { email: email.toLowerCase().trim(), clinicId },
        });

        if (existingStaffEmail) {
            return NextResponse.json(
                { error: 'A staff member with this email already exists' },
                { status: 400 }
            );
        }

        const lastStaff = await prisma.staff.findFirst({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
            select: { employeeId: true },
        });

        const employeeId = generateEmployeeId(lastStaff?.employeeId, role);

        let userId = null;
        if (canLogin && userPassword) {
            const normalizedEmail = email.toLowerCase().trim();
            const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

            if (existingUser) {
                userId = existingUser.id;
            } else {
                const hashedPassword = await bcrypt.hash(userPassword, 10);
                const userRole = role === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
                const user = await prisma.user.create({
                    data: {
                        email: normalizedEmail,
                        name: `${firstName} ${lastName}`.trim(),
                        password: hashedPassword,
                        role: userRole,
                        isActive: true,
                        clinicId, // ✅ New user also gets clinicId
                    },
                });
                userId = user.id;
            }
        }

        const staff = await prisma.staff.create({
            data: {
                employeeId,
                firstName, lastName,
                email: email.toLowerCase().trim(),
                phone, alternatePhone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender, bloodGroup,
                addressLine1, addressLine2, city, state, pincode,
                aadhaarNumber, panNumber,
                emergencyContactName, emergencyContactPhone, emergencyContactRelation,
                role, department, designation,
                joiningDate: new Date(joiningDate),
                employmentType,
                qualification, specialization,
                experienceYears: parseInt(experienceYears?.toString()) || 0,
                licenseNumber,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
                basicSalary: parseFloat(basicSalary?.toString()) || 0,
                allowances: parseFloat(allowances?.toString()) || 0,
                hra: parseFloat(hra?.toString()) || 0,
                otherAllowances: parseFloat(otherAllowances?.toString()) || 0,
                bankName, accountNumber, ifscCode, accountHolderName,
                userId,
                canLogin: canLogin && !!userId,
                status: 'ACTIVE',
                clinicId, // ✅ Always from JWT
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        });

        const currentYear = new Date().getFullYear();
        await prisma.leaveBalance.create({
            data: { staffId: staff.id, year: currentYear, clinicId },
        });

        return NextResponse.json({ staff }, { status: 201 });
    } catch (error) {
        console.error('Error creating staff:', error);
        return NextResponse.json({
            error: 'Failed to create staff member',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// DELETE - Remove staff member
export async function DELETE(req: NextRequest) {
    try {
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });

        // ✅ Verify staff belongs to this clinic before deleting
        const staff = await prisma.staff.findFirst({
            where: { id, clinicId: payload.clinicId },
            include: { user: true },
        });

        if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

        await prisma.staffAttendance.deleteMany({ where: { staffId: id } });
        await prisma.staffLeave.deleteMany({ where: { staffId: id } });
        await prisma.leaveBalance.deleteMany({ where: { staffId: id } });
        await prisma.payroll.deleteMany({ where: { staffId: id } });
        await prisma.staffPerformance.deleteMany({ where: { staffId: id } });
        await prisma.staffDocument.deleteMany({ where: { staffId: id } });
        await prisma.staff.delete({ where: { id } });

        if (staff.userId) {
            const userStaffCount = await prisma.staff.count({ where: { userId: staff.userId } });
            if (userStaffCount === 0) {
                await prisma.user.delete({ where: { id: staff.userId } });
            }
        }

        return NextResponse.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
    }
}

function generateEmployeeId(lastEmployeeId?: string, role?: string): string {
    const rolePrefix: Record<string, string> = {
        DOCTOR: 'DOC', RECEPTIONIST: 'REC', THERAPIST: 'THR',
        PHARMACIST: 'PHR', LAB_TECHNICIAN: 'LAB', NURSE: 'NUR',
        MANAGER: 'MGR', OTHER: 'EMP',
    };
    const prefix = role ? rolePrefix[role] || 'EMP' : 'EMP';
    const year = new Date().getFullYear().toString().slice(-2);
    if (!lastEmployeeId) return `${prefix}${year}0001`;
    const lastNumber = parseInt(lastEmployeeId.slice(-4)) || 0;
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}${year}${newNumber}`;
}