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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/billing/profit-loss?period=${period}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${res.status}`);
            }
            const result = await res.json();
            setData(result);
        } catch (err: any) {
            console.error('P&L fetch error:', err);
            setError(err.message || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500">Generating report...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-base font-semibold text-gray-800 mb-1">Failed to load report</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button onClick={fetchData} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Retry
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    const { summary, breakdown, trends } = data;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Profit & Loss Report</h1>
                        <p className="text-sm text-gray-500 mt-1">Financial overview and analytics</p>
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.revenue.total)}</p>
                        <p className="text-xs text-gray-400 mt-1">{summary.revenue.billCount} bills collected</p>
                        {summary.revenue.pending > 0 && (
                            <p className="text-xs text-yellow-600 mt-0.5">+ {formatCurrency(summary.revenue.pending)} pending</p>
                        )}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.expenses.total)}</p>
                        <p className="text-xs text-gray-400 mt-1">{summary.expenses.count} expense entries</p>
                        {summary.expenses.pending > 0 && (
                            <p className="text-xs text-yellow-600 mt-0.5">+ {formatCurrency(summary.expenses.pending)} pending</p>
                        )}
                    </div>
                    <div className={`bg-white rounded-xl border p-5 ${summary.profit.isProfit ? 'border-teal-200' : 'border-orange-200'}`}>
                        <p className="text-xs text-gray-500 mb-1">{summary.profit.isProfit ? 'Net Profit' : 'Net Loss'}</p>
                        <p className={`text-2xl font-bold ${summary.profit.isProfit ? 'text-teal-600' : 'text-orange-500'}`}>
                            {summary.profit.isProfit ? '' : '-'}{formatCurrency(Math.abs(summary.profit.gross))}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Margin: {summary.profit.margin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Revenue by Category */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</h2>
                        {breakdown.revenueByCategory.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No revenue data for this period</p>
                        ) : (
                            <div className="space-y-3">
                                {breakdown.revenueByCategory.map((cat) => (
                                    <div key={cat.category}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600">{cat.category}</span>
                                            <span className="font-semibold text-gray-800">{formatCurrency(cat.amount)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${cat.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Expenses by Category */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</h2>
                        {breakdown.expensesByCategory.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No expense data for this period</p>
                        ) : (
                            <div className="space-y-3">
                                {breakdown.expensesByCategory.map((cat) => (
                                    <div key={cat.category}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600">{cat.category}</span>
                                            <span className="font-semibold text-gray-800">{formatCurrency(cat.amount)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${cat.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Trend Table */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h2>
                    {trends.monthly.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No monthly data available</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left pb-2 text-xs font-semibold text-gray-500">Month</th>
                                    <th className="text-right pb-2 text-xs font-semibold text-gray-500">Revenue</th>
                                    <th className="text-right pb-2 text-xs font-semibold text-gray-500">Expenses</th>
                                    <th className="text-right pb-2 text-xs font-semibold text-gray-500">Profit/Loss</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                {trends.monthly.map((item) => (
                                    <tr key={item.month}>
                                        <td className="py-2.5 text-sm font-medium text-gray-800">{item.month}</td>
                                        <td className="py-2.5 text-sm text-right text-green-600 font-medium">{formatCurrency(item.revenue)}</td>
                                        <td className="py-2.5 text-sm text-right text-red-500 font-medium">{formatCurrency(item.expense)}</td>
                                        <td className={`py-2.5 text-sm text-right font-semibold ${item.profit >= 0 ? 'text-teal-600' : 'text-orange-500'}`}>
                                            {item.profit >= 0 ? '' : '-'}{formatCurrency(Math.abs(item.profit))}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}