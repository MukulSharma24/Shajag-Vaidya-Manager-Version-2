import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch payroll records
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const staffId = searchParams.get('staffId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const status = searchParams.get('status');

        const where: any = {
            clinicId: 'default-clinic', // ✅ Always filter by clinic
        };

        if (staffId) where.staffId = staffId;
        if (month) where.month = parseInt(month);
        if (year) where.year = parseInt(year);
        if (status && status !== 'ALL') where.paymentStatus = status;

        const payrolls = await prisma.payroll.findMany({
            where,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        role: true,
                    },
                },
                generatedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                paidByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
        });

        // Summary stats
        const stats = await prisma.payroll.aggregate({
            where: { clinicId: 'default-clinic' },
            _sum: {
                grossSalary: true,
                netSalary: true,
                totalDeductions: true,
            },
            _count: true,
        });

        const pendingStats = await prisma.payroll.aggregate({
            where: {
                clinicId: 'default-clinic',
                paymentStatus: 'PENDING',
            },
            _sum: {
                netSalary: true,
            },
            _count: true,
        });

        return NextResponse.json({
            payrolls,
            stats: {
                total: stats._count,
                totalGross: stats._sum.grossSalary || 0,
                totalNet: stats._sum.netSalary || 0,
                totalDeductions: stats._sum.totalDeductions || 0,
                pendingAmount: pendingStats._sum.netSalary || 0,
                pendingCount: pendingStats._count,
            },
        });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
    }
}

// POST - Generate payroll for staff
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            staffId,
            month,
            year,
            daysPresent,
            daysAbsent,
            totalWorkingDays,
            otherDeductions,
            notes,
        } = body;

        if (!staffId || !month || !year) {
            return NextResponse.json(
                { error: 'Staff ID, month, and year are required' },
                { status: 400 }
            );
        }

        // Check if payroll already exists
        const existing = await prisma.payroll.findFirst({
            where: {
                staffId,
                month,
                year,
                clinicId: 'default-clinic', // ✅ Include clinic in check
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Payroll already exists for this month' },
                { status: 400 }
            );
        }

        // Fetch staff details
        const staffData = await prisma.staff.findUnique({
            where: { id: staffId },
            select: {
                basicSalary: true,
                allowances: true,
                hra: true,
                otherAllowances: true,
            },
        });

        if (!staffData) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
        }

        // Calculate salary components
        const salary = Number(staffData.basicSalary || 0);
        const allowancesAmt = Number(staffData.allowances || 0);
        const hraAmt = Number(staffData.hra || 0);
        const otherAllowancesAmt = Number(staffData.otherAllowances || 0);

        const grossSalary = salary + allowancesAmt + hraAmt + otherAllowancesAmt;

        // Calculate deductions
        const perDaySalary = grossSalary / (totalWorkingDays || 30);
        const absenceDeduction = perDaySalary * (daysAbsent || 0);
        const totalDeductions = absenceDeduction + (otherDeductions || 0);

        const netSalary = grossSalary - totalDeductions;

        // Generate payroll number
        const lastPayroll = await prisma.payroll.findFirst({
            where: { clinicId: 'default-clinic' },
            orderBy: { createdAt: 'desc' },
            select: { payrollNumber: true },
        });

        const payrollNumber = generatePayrollNumber(lastPayroll?.payrollNumber);

        // Create payroll
        const payroll = await prisma.payroll.create({
            data: {
                payrollNumber,
                staffId,
                month,
                year,

                basicSalary: salary,
                allowances: allowancesAmt,
                hra: hraAmt,
                otherAllowances: otherAllowancesAmt,

                daysPresent: daysPresent || 0,
                daysAbsent: daysAbsent || 0,
                totalWorkingDays: totalWorkingDays || 30,

                absenceDeduction,
                otherDeductions: otherDeductions || 0,

                grossSalary,
                totalDeductions,
                netSalary,

                paymentStatus: 'PENDING',
                notes,

                clinicId: 'default-clinic', // ✅ CRITICAL FIX: Always provide clinicId
            },
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json({ payroll }, { status: 201 });
    } catch (error) {
        console.error('Error generating payroll:', error);
        return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
    }
}

// PATCH - Mark payroll as paid
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { payrollId, paymentDate, paymentMethod, paymentReference } = body;

        if (!payrollId) {
            return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
        }

        const payroll = await prisma.payroll.findUnique({
            where: { id: payrollId },
            include: { staff: true },
        });

        if (!payroll) {
            return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
        }

        if (payroll.paymentStatus === 'PAID') {
            return NextResponse.json(
                { error: 'Payroll already paid' },
                { status: 400 }
            );
        }

        // Update payroll status
        const updated = await prisma.payroll.update({
            where: { id: payrollId },
            data: {
                paymentStatus: 'PAID',
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                paymentMethod: paymentMethod || 'BANK_TRANSFER',
                paymentReference,
            },
            include: {
                staff: true,
                paidByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Create expense record for salary
        await prisma.expense.create({
            data: {
                expenseNumber: `SAL-${updated.payrollNumber}`,
                category: 'SALARY',
                subcategory: `${payroll.staff.role} Salary`,
                amount: Number(updated.netSalary),
                description: `Salary for ${payroll.staff.firstName} ${payroll.staff.lastName} - ${getMonthName(updated.month)} ${updated.year}`,
                vendorName: `${payroll.staff.firstName} ${payroll.staff.lastName}`,
                paymentMethod: updated.paymentMethod || 'BANK_TRANSFER',
                expenseDate: updated.paymentDate || new Date(),
                paymentStatus: 'PAID',
                clinicId: 'default-clinic', // ✅ Include clinic
            },
        });

        return NextResponse.json({
            payroll: updated,
            message: 'Payroll marked as paid successfully',
        });
    } catch (error) {
        console.error('Error updating payroll:', error);
        return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
    }
}

// Helper functions
function generatePayrollNumber(lastPayrollNumber?: string): string {
    const prefix = 'PAY';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (!lastPayrollNumber) {
        return `${prefix}${year}${month}-0001`;
    }

    const parts = lastPayrollNumber.split('-');
    const lastNumber = parseInt(parts[1] || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}-${newNumber}`;
}

function getMonthName(month: number): string {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
}