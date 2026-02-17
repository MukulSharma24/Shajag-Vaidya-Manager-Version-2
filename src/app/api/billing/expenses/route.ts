import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: always resolve a valid clinicId without requiring it from the frontend
async function resolveClinicId(providedClinicId?: string): Promise<string | null> {
    if (providedClinicId) return providedClinicId;

    try {
        const clinic = await prisma.clinic.findFirst({ select: { id: true } });
        return clinic?.id ?? null;
    } catch {
        return null;
    }
}

// GET - Fetch all expenses
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

        if (category && category !== 'ALL') {
            where.category = category;
        }

        if (status && status !== 'ALL') {
            where.paymentStatus = status;
        }

        if (fromDate || toDate) {
            where.expenseDate = {};
            if (fromDate) where.expenseDate.gte = new Date(fromDate);
            if (toDate) where.expenseDate.lte = new Date(toDate);
        }

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                include: {
                    addedByUser: { select: { id: true, name: true } },
                    approvedByUser: { select: { id: true, name: true } },
                },
                orderBy: { expenseDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.expense.count({ where }),
        ]);

        const [allStats, paidStats, pendingStats] = await Promise.all([
            prisma.expense.aggregate({ where: {}, _sum: { amount: true }, _count: true }),
            prisma.expense.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { amount: true } }),
            prisma.expense.aggregate({ where: { paymentStatus: 'PENDING' }, _sum: { amount: true } }),
        ]);

        return NextResponse.json({
            expenses,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            stats: {
                totalExpenses: allStats._count,
                totalAmount: Number(allStats._sum.amount || 0),
                paidAmount: Number(paidStats._sum.amount || 0),
                pendingAmount: Number(pendingStats._sum.amount || 0),
            },
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

// POST - Create new expense
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            category,
            subcategory,
            amount,
            description,
            vendorName,
            paymentMethod,
            expenseDate,
            paymentStatus = 'PAID',
            receiptUrl,
            clinicId: providedClinicId,
            addedBy,
        } = body;

        // Validate required fields
        if (!category || !amount || !expenseDate) {
            return NextResponse.json(
                { error: 'Category, amount, and expense date are required' },
                { status: 400 }
            );
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            );
        }

        // Auto-resolve clinicId — don't require frontend to send it
        const clinicId = await resolveClinicId(providedClinicId);

        // Generate expense number
        const lastExpense = await prisma.expense.findFirst({
            where: clinicId ? { clinicId } : {},
            orderBy: { createdAt: 'desc' },
            select: { expenseNumber: true },
        });

        const expenseNumber = generateExpenseNumber(lastExpense?.expenseNumber);

        // Build expense data — only include optional fields if they have values
        const expenseData: any = {
            expenseNumber,
            category,
            amount: parseFloat(amount),
            expenseDate: new Date(expenseDate),
            paymentStatus,
        };

        // Add optional string fields only if non-empty
        if (subcategory?.trim()) expenseData.subcategory = subcategory.trim();
        if (description?.trim()) expenseData.description = description.trim();
        if (vendorName?.trim()) expenseData.vendorName = vendorName.trim();
        if (paymentMethod) expenseData.paymentMethod = paymentMethod;
        if (receiptUrl?.trim()) expenseData.receiptUrl = receiptUrl.trim();

        // Only include DB relations if IDs are valid
        if (clinicId) expenseData.clinicId = clinicId;
        if (addedBy) {
            expenseData.addedBy = addedBy;
            expenseData.approvedBy = addedBy;
        }

        console.log('Creating expense:', expenseNumber, category, amount, expenseDate);

        const expense = await prisma.expense.create({
            data: expenseData,
            include: {
                addedByUser: { select: { id: true, name: true } },
            },
        });

        console.log('Expense created:', expense.id);

        return NextResponse.json({ expense }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating expense:', error);

        // Return the actual Prisma error so we can debug from the UI
        return NextResponse.json(
            {
                error: 'Failed to create expense',
                details: error?.message ?? 'Unknown error',
            },
            { status: 500 }
        );
    }
}

function generateExpenseNumber(lastExpenseNumber?: string): string {
    const prefix = 'EXP';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (!lastExpenseNumber) {
        return `${prefix}${year}${month}-0001`;
    }

    const parts = lastExpenseNumber.split('-');
    const lastNumber = parseInt(parts[1] || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}-${newNumber}`;
}