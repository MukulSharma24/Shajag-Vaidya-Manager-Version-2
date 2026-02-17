import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch individual staff member
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staff = await prisma.staff.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                leaveBalances: {
                    where: {
                        year: new Date().getFullYear()
                    },
                    take: 1
                },
                attendance: {
                    orderBy: {
                        attendanceDate: 'desc'
                    },
                    take: 10
                }
            },
        });

        if (!staff) {
            return NextResponse.json(
                { error: 'Staff not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ staff });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json(
            { error: 'Failed to fetch staff' },
            { status: 500 }
        );
    }
}

// PATCH - Update staff member
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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
            status,
        } = body;

        const updated = await prisma.staff.update({
            where: { id: params.id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                alternatePhone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
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
                joiningDate: joiningDate ? new Date(joiningDate) : undefined,
                employmentType,
                qualification,
                specialization,
                experienceYears,
                licenseNumber,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
                basicSalary,
                allowances,
                hra,
                otherAllowances,
                bankName,
                accountNumber,
                ifscCode,
                accountHolderName,
                status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                }
            }
        });

        return NextResponse.json({ staff: updated });
    } catch (error) {
        console.error('Error updating staff:', error);
        return NextResponse.json(
            { error: 'Failed to update staff' },
            { status: 500 }
        );
    }
}

// DELETE - Remove staff member
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staff = await prisma.staff.findUnique({
            where: { id: params.id },
            include: { user: true }
        });

        if (!staff) {
            return NextResponse.json(
                { error: 'Staff not found' },
                { status: 404 }
            );
        }

        // Delete related records
        await prisma.staffAttendance.deleteMany({ where: { staffId: params.id } });
        await prisma.staffLeave.deleteMany({ where: { staffId: params.id } });
        await prisma.leaveBalance.deleteMany({ where: { staffId: params.id } });
        await prisma.payroll.deleteMany({ where: { staffId: params.id } });
        await prisma.staffPerformance.deleteMany({ where: { staffId: params.id } });
        await prisma.staffDocument.deleteMany({ where: { staffId: params.id } });

        // Delete staff
        await prisma.staff.delete({ where: { id: params.id } });

        // Delete user if no longer used
        if (staff.userId) {
            const userStaffCount = await prisma.staff.count({
                where: { userId: staff.userId }
            });

            if (userStaffCount === 0) {
                await prisma.user.delete({ where: { id: staff.userId } });
            }
        }

        return NextResponse.json({
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        return NextResponse.json(
            { error: 'Failed to delete staff' },
            { status: 500 }
        );
    }
}