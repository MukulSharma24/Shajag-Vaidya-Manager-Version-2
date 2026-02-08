import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Profit & Loss Report (Owner/Admin only)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'month'; // month, quarter, year, custom
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const clinicId = searchParams.get('clinicId'); // You'll need to pass this from frontend

        // Note: Role-based access control removed. You may want to implement this on the frontend
        // or pass a userId and validate it here if needed

        let startDate: Date;
        let endDate: Date = new Date();

        // Calculate date range based on period
        if (period === 'custom' && fromDate && toDate) {
            startDate = new Date(fromDate);
            endDate = new Date(toDate);
        } else if (period === 'year') {
            startDate = new Date(endDate.getFullYear(), 0, 1);
        } else if (period === 'quarter') {
            const currentQuarter = Math.floor(endDate.getMonth() / 3);
            startDate = new Date(endDate.getFullYear(), currentQuarter * 3, 1);
        } else {
            // Default to current month
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        }

        // Build where clause
        const billWhere: any = {
            status: {
                in: ['PAID', 'PARTIAL'],
            },
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

        const expenseWhere: any = {
            expenseDate: {
                gte: startDate,
                lte: endDate,
            },
            paymentStatus: 'PAID',
        };

        if (clinicId) {
            billWhere.clinicId = clinicId;
            expenseWhere.clinicId = clinicId;
        }

        // REVENUE CALCULATION
        // 1. Total bills (paid + partial)
        const revenueData = await prisma.bill.aggregate({
            where: billWhere,
            _sum: {
                paidAmount: true,
                totalAmount: true,
            },
            _count: true,
        });

        const totalRevenue = Number(revenueData._sum.paidAmount || 0);
        const totalBills = revenueData._count;

        // Revenue by category
        const revenueByCategory = await prisma.$queryRaw<any[]>`
            SELECT 
                bi.item_type as category,
                SUM(bi.total_amount) as amount,
                COUNT(DISTINCT b.id) as count
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.status IN ('PAID', 'PARTIAL')
            AND b.created_at >= ${startDate}
            AND b.created_at <= ${endDate}
            ${clinicId ? prisma.$queryRaw`AND b.clinic_id = ${clinicId}` : prisma.$queryRaw``}
            GROUP BY bi.item_type
        `;

        // EXPENSES CALCULATION
        const expensesData = await prisma.expense.aggregate({
            where: expenseWhere,
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const totalExpenses = Number(expensesData._sum.amount || 0);
        const totalExpenseCount = expensesData._count;

        // Expenses by category
        const expensesByCategory = await prisma.expense.groupBy({
            by: ['category'],
            where: expenseWhere,
            _sum: {
                amount: true,
            },
            _count: true,
        });

        // PROFIT/LOSS CALCULATION
        const grossProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // PENDING AMOUNTS
        const pendingBillsWhere: any = {
            status: {
                in: ['PENDING', 'PARTIAL', 'OVERDUE'],
            },
        };

        const pendingExpensesWhere: any = {
            paymentStatus: 'PENDING',
        };

        if (clinicId) {
            pendingBillsWhere.clinicId = clinicId;
            pendingExpensesWhere.clinicId = clinicId;
        }

        const pendingBills = await prisma.bill.aggregate({
            where: pendingBillsWhere,
            _sum: {
                balanceAmount: true,
            },
            _count: true,
        });

        const pendingRevenue = Number(pendingBills._sum.balanceAmount || 0);

        const pendingExpenses = await prisma.expense.aggregate({
            where: pendingExpensesWhere,
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const pendingExpenseAmount = Number(pendingExpenses._sum.amount || 0);

        // MONTHLY TREND (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenueWhere: any = {
            status: ['PAID', 'PARTIAL'],
            createdAt: sixMonthsAgo,
        };

        const monthlyExpenseWhere: any = {
            paymentStatus: 'PAID',
            expenseDate: sixMonthsAgo,
        };

        if (clinicId) {
            monthlyRevenueWhere.clinicId = clinicId;
            monthlyExpenseWhere.clinicId = clinicId;
        }

        const monthlyRevenue = await prisma.$queryRaw<any[]>`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(paid_amount) as revenue
            FROM bills
            WHERE status IN ('PAID', 'PARTIAL')
              AND created_at >= ${sixMonthsAgo}
                ${clinicId ? prisma.$queryRaw`AND clinic_id = ${clinicId}` : prisma.$queryRaw``}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `;

        const monthlyExpenses = await prisma.$queryRaw<any[]>`
            SELECT
                DATE_FORMAT(expense_date, '%Y-%m') as month,
                SUM(amount) as expense
            FROM expenses
            WHERE payment_status = 'PAID'
              AND expense_date >= ${sixMonthsAgo}
                ${clinicId ? prisma.$queryRaw`AND clinic_id = ${clinicId}` : prisma.$queryRaw``}
            GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
            ORDER BY month ASC
        `;

        // Merge monthly data
        const monthlyTrend = mergeMonthlyData(monthlyRevenue, monthlyExpenses);

        // TOP EXPENSE CATEGORIES
        const topExpenses = expensesByCategory
            .sort((a, b) => Number(b._sum.amount || 0) - Number(a._sum.amount || 0))
            .slice(0, 5)
            .map(e => ({
                category: e.category,
                amount: Number(e._sum.amount || 0),
                count: e._count,
                percentage: totalExpenses > 0 ? (Number(e._sum.amount || 0) / totalExpenses) * 100 : 0,
            }));

        return NextResponse.json({
            period: {
                type: period,
                startDate,
                endDate,
            },
            summary: {
                revenue: {
                    total: totalRevenue,
                    billCount: totalBills,
                    pending: pendingRevenue,
                    pendingCount: pendingBills._count,
                },
                expenses: {
                    total: totalExpenses,
                    count: totalExpenseCount,
                    pending: pendingExpenseAmount,
                    pendingCount: pendingExpenses._count,
                },
                profit: {
                    gross: grossProfit,
                    margin: profitMargin,
                    isProfit: grossProfit >= 0,
                },
            },
            breakdown: {
                revenueByCategory: revenueByCategory.map((r: any) => ({
                    category: r.category,
                    amount: parseFloat(r.amount),
                    count: r.count,
                    percentage: totalRevenue > 0 ? (parseFloat(r.amount) / totalRevenue) * 100 : 0,
                })),
                expensesByCategory: topExpenses,
            },
            trends: {
                monthly: monthlyTrend,
            },
        });
    } catch (error) {
        console.error('Error generating P&L report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}

// Helper function to merge monthly revenue and expenses
function mergeMonthlyData(revenue: any[], expenses: any[]) {
    const map = new Map();

    revenue.forEach(r => {
        map.set(r.month, {
            month: r.month,
            revenue: parseFloat(r.revenue) || 0,
            expense: 0,
            profit: 0,
        });
    });

    expenses.forEach(e => {
        const existing = map.get(e.month) || {
            month: e.month,
            revenue: 0,
            expense: 0,
            profit: 0,
        };
        existing.expense = parseFloat(e.expense) || 0;
        map.set(e.month, existing);
    });

    const result = Array.from(map.values()).map(item => ({
        ...item,
        profit: item.revenue - item.expense,
    }));

    return result.sort((a, b) => a.month.localeCompare(b.month));
}