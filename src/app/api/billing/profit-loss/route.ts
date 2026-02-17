import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'month';
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        let startDate: Date;
        let endDate: Date = new Date();

        if (period === 'custom' && fromDate && toDate) {
            startDate = new Date(fromDate);
            endDate = new Date(toDate);
        } else if (period === 'year') {
            startDate = new Date(endDate.getFullYear(), 0, 1);
        } else if (period === 'quarter') {
            const q = Math.floor(endDate.getMonth() / 3);
            startDate = new Date(endDate.getFullYear(), q * 3, 1);
        } else {
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        }

        // ── BILL REVENUE ────────────────────────────────────────────────────
        const paidBills = await prisma.bill.findMany({
            where: {
                status: { in: ['PAID', 'PARTIAL'] },
                createdAt: { gte: startDate, lte: endDate },
            },
            include: { billItems: { select: { itemType: true, totalAmount: true } } },
        });

        const billRevenue = paidBills.reduce((sum, b) => sum + Number(b.paidAmount), 0);

        // Revenue by item category (from bills)
        const revCategoryMap: Record<string, number> = {};
        for (const bill of paidBills) {
            for (const item of bill.billItems) {
                const cat = item.itemType || 'OTHER';
                revCategoryMap[cat] = (revCategoryMap[cat] || 0) + Number(item.totalAmount);
            }
        }

        // ── QUICK INCOME REVENUE ─────────────────────────────────────────────
        // Check if QuickIncome model exists before querying
        let quickIncomeRevenue = 0;
        let quickIncomeEntries: any[] = [];
        try {
            quickIncomeEntries = await (prisma as any).quickIncome.findMany({
                where: { receivedDate: { gte: startDate, lte: endDate } },
                select: { amount: true, category: true, receivedDate: true },
            });
            quickIncomeRevenue = quickIncomeEntries.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

            // Add quick income to category map
            for (const entry of quickIncomeEntries) {
                const cat = `Direct: ${entry.category || 'PAYMENT'}`;
                revCategoryMap[cat] = (revCategoryMap[cat] || 0) + Number(entry.amount);
            }
        } catch {
            // QuickIncome table may not exist yet — silently skip
        }

        const totalRevenue = billRevenue + quickIncomeRevenue;

        // Pending revenue
        const pendingBills = await prisma.bill.aggregate({
            where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
            _sum: { balanceAmount: true },
            _count: true,
        });

        // ── EXPENSES ────────────────────────────────────────────────────────
        const paidExpenses = await prisma.expense.findMany({
            where: {
                paymentStatus: 'PAID',
                expenseDate: { gte: startDate, lte: endDate },
            },
            select: { category: true, amount: true, expenseDate: true },
        });

        const totalExpenses = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const expCategoryMap: Record<string, number> = {};
        for (const exp of paidExpenses) {
            expCategoryMap[exp.category] = (expCategoryMap[exp.category] || 0) + Number(exp.amount);
        }

        const pendingExpenses = await prisma.expense.aggregate({
            where: { paymentStatus: 'PENDING' },
            _sum: { amount: true },
            _count: true,
        });

        // ── PROFIT ──────────────────────────────────────────────────────────
        const grossProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // ── MONTHLY TREND (last 6 months) ────────────────────────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentBills = await prisma.bill.findMany({
            where: { status: { in: ['PAID', 'PARTIAL'] }, createdAt: { gte: sixMonthsAgo } },
            select: { paidAmount: true, createdAt: true },
        });

        const recentExpenses = await prisma.expense.findMany({
            where: { paymentStatus: 'PAID', expenseDate: { gte: sixMonthsAgo } },
            select: { amount: true, expenseDate: true },
        });

        // Quick income for trend
        let recentQuickIncome: any[] = [];
        try {
            recentQuickIncome = await (prisma as any).quickIncome.findMany({
                where: { receivedDate: { gte: sixMonthsAgo } },
                select: { amount: true, receivedDate: true },
            });
        } catch { /* table may not exist yet */ }

        const monthlyMap: Record<string, { revenue: number; expense: number }> = {};

        for (const bill of recentBills) {
            const key = new Date(bill.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expense: 0 };
            monthlyMap[key].revenue += Number(bill.paidAmount);
        }

        for (const inc of recentQuickIncome) {
            const key = new Date(inc.receivedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expense: 0 };
            monthlyMap[key].revenue += Number(inc.amount);
        }

        for (const exp of recentExpenses) {
            const key = new Date(exp.expenseDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expense: 0 };
            monthlyMap[key].expense += Number(exp.amount);
        }

        const monthlyTrend = Object.entries(monthlyMap)
            .map(([month, vals]) => ({ month, revenue: vals.revenue, expense: vals.expense, profit: vals.revenue - vals.expense }))
            .sort((a, b) => new Date('01 ' + a.month).getTime() - new Date('01 ' + b.month).getTime());

        // ── BREAKDOWNS ──────────────────────────────────────────────────────
        const revenueByCategory = Object.entries(revCategoryMap)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        const expensesByCategory = Object.entries(expCategoryMap)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        return NextResponse.json({
            period: { type: period, startDate, endDate },
            summary: {
                revenue: {
                    total: totalRevenue,
                    billRevenue,
                    quickIncomeRevenue,
                    billCount: paidBills.length,
                    pending: Number(pendingBills._sum.balanceAmount || 0),
                },
                expenses: {
                    total: totalExpenses,
                    count: paidExpenses.length,
                    pending: Number(pendingExpenses._sum.amount || 0),
                },
                profit: {
                    gross: grossProfit,
                    margin: profitMargin,
                    isProfit: grossProfit >= 0,
                },
            },
            breakdown: { revenueByCategory, expensesByCategory },
            trends: { monthly: monthlyTrend },
        });
    } catch (error) {
        console.error('Error generating P&L report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}