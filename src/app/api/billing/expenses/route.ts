import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
                    addedByUser: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    approvedByUser: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    expenseDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.expense.count({ where }),
        ]);

        // Summary stats
        const stats = await prisma.expense.aggregate({
            where: {},
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const paidStats = await prisma.expense.aggregate({
            where: {
                paymentStatus: 'PAID',
            },
            _sum: {
                amount: true,
            },
        });

        const pendingStats = await prisma.expense.aggregate({
            where: {
                paymentStatus: 'PENDING',
            },
            _sum: {
                amount: true,
            },
        });

        return NextResponse.json({
            expenses,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
            stats: {
                totalExpenses: stats._count,
                totalAmount: stats._sum.amount || 0,
                paidAmount: paidStats._sum.amount || 0,
                pendingAmount: pendingStats._sum.amount || 0,
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
            clinicId, // You'll need to pass this from the frontend now
            addedBy, // You'll need to pass userId from the frontend
        } = body;

        // Validate required fields
        if (!category || !amount || !expenseDate) {
            return NextResponse.json(
                { error: 'Category, amount, and expense date are required' },
                { status: 400 }
            );
        }

        // Generate expense number
        const lastExpense = await prisma.expense.findFirst({
            where: clinicId ? { clinicId } : {},
            orderBy: { createdAt: 'desc' },
            select: { expenseNumber: true },
        });

        const expenseNumber = generateExpenseNumber(lastExpense?.expenseNumber);

        // Build expense data
        const expenseData: any = {
            expenseNumber,
            category,
            subcategory,
            amount,
            description,
            vendorName,
            paymentMethod,
            expenseDate: new Date(expenseDate),
            paymentStatus,
            receiptUrl,
        };

        // Add optional fields if provided
        if (clinicId) expenseData.clinicId = clinicId;
        if (addedBy) {
            expenseData.addedBy = addedBy;
            expenseData.approvedBy = addedBy; // Auto-approve for now
        }

        const expense = await prisma.expense.create({
            data: expenseData,
            include: {
                addedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ expense }, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}

// Helper function
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