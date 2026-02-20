export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/billing/reports?type=pl&startDate=...&endDate=...&clinicId=...
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reportType = searchParams.get('type') || 'pl'; // pl = Profit & Loss
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const clinicId = searchParams.get('clinicId');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        const where: any = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };

        if (clinicId) {
            where.clinicId = clinicId;
        }

        if (reportType === 'pl') {
            // Profit & Loss Report

            // Get all bills (revenue)
            const bills = await prisma.bill.findMany({
                where: {
                    ...where,
                    status: { in: ['PAID', 'PARTIAL'] },
                },
                select: {
                    totalAmount: true,
                    paidAmount: true,
                    status: true,
                    createdAt: true,
                },
            });

            // Get all expenses
            const expenseWhere: any = {
                expenseDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            };
            if (clinicId) expenseWhere.clinicId = clinicId;

            const expenses = await prisma.expense.findMany({
                where: expenseWhere,
                select: {
                    amount: true,
                    category: true,
                    expenseDate: true,
                },
            });

            // Calculate totals
            const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.paidAmount), 0);
            const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
            const netProfit = totalRevenue - totalExpenses;

            // Expenses by category
            const expensesByCategory: Record<string, number> = {};
            expenses.forEach(exp => {
                if (!expensesByCategory[exp.category]) {
                    expensesByCategory[exp.category] = 0;
                }
                expensesByCategory[exp.category] += Number(exp.amount);
            });

            return NextResponse.json({
                reportType: 'Profit & Loss',
                period: { startDate, endDate },
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
                },
                revenue: {
                    totalBills: bills.length,
                    totalAmount: totalRevenue,
                    byMonth: groupByMonth(bills, 'paidAmount'),
                },
                expenses: {
                    totalExpenses: expenses.length,
                    totalAmount: totalExpenses,
                    byCategory: expensesByCategory,
                    byMonth: groupByMonth(expenses, 'amount'),
                },
            });
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

// Helper function to group data by month
function groupByMonth(items: any[], amountField: string) {
    const grouped: Record<string, number> = {};

    items.forEach(item => {
        const date = item.createdAt || item.expenseDate;
        if (!date) return;

        const monthKey = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });

        if (!grouped[monthKey]) {
            grouped[monthKey] = 0;
        }
        grouped[monthKey] += Number(item[amountField]);
    });

    return grouped;
}