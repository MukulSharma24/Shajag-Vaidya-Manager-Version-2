'use client';

import { useState, useEffect } from 'react';

interface PLData {
    period: { type: string; startDate: string; endDate: string };
    summary: {
        revenue: { total: number; billCount: number; pending: number };
        expenses: { total: number; count: number; pending: number };
        profit: { gross: number; margin: number; isProfit: boolean };
    };
    breakdown: {
        revenueByCategory: Array<{ category: string; amount: number; percentage: number }>;
        expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
    };
    trends: { monthly: Array<{ month: string; revenue: number; expense: number; profit: number }> };
}

export default function ProfitLossPage() {
    const [data, setData] = useState<PLData | null>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/billing/profit-loss?period=${period}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    if (loading || !data) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profit & Loss Report</h1>
                        <p className="text-gray-600">Financial overview and analytics</p>
                    </div>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500">
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                        <p className="text-green-100 text-sm mb-2">Total Revenue</p>
                        <p className="text-4xl font-bold mb-1">{formatCurrency(data.summary.revenue.total)}</p>
                        <p className="text-green-100 text-sm">{data.summary.revenue.billCount} bills</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <p className="text-red-100 text-sm mb-2">Total Expenses</p>
                        <p className="text-4xl font-bold mb-1">{formatCurrency(data.summary.expenses.total)}</p>
                        <p className="text-red-100 text-sm">{data.summary.expenses.count} expenses</p>
                    </div>
                    <div className={`bg-gradient-to-br ${data.summary.profit.isProfit ? 'from-teal-500 to-teal-600' : 'from-orange-500 to-orange-600'} rounded-2xl p-6 text-white shadow-lg`}>
                        <p className="text-white/80 text-sm mb-2">{data.summary.profit.isProfit ? 'Net Profit' : 'Net Loss'}</p>
                        <p className="text-4xl font-bold mb-1">{formatCurrency(Math.abs(data.summary.profit.gross))}</p>
                        <p className="text-white/80 text-sm">Margin: {data.summary.profit.margin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
                        <div className="space-y-3">
                            {data.breakdown.revenueByCategory.map((cat) => (
                                <div key={cat.category} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                            <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Breakdown</h2>
                        <div className="space-y-3">
                            {data.breakdown.expensesByCategory.map((cat) => (
                                <div key={cat.category} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                            <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">6-Month Trend</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Month</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Revenue</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Expenses</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Profit/Loss</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {data.trends.monthly.map((item) => (
                                <tr key={item.month}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.month}</td>
                                    <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">{formatCurrency(item.revenue)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">{formatCurrency(item.expense)}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-bold ${item.profit >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>{formatCurrency(Math.abs(item.profit))}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}