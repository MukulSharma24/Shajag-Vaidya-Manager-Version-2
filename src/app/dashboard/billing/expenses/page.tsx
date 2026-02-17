'use client';

import { useState, useEffect } from 'react';

interface Expense {
    id: string;
    expenseNumber: string;
    category: string;
    subcategory?: string;
    amount: number;
    description?: string;
    vendorName?: string;
    paymentMethod?: string;
    expenseDate: string;
    paymentStatus: string;
    addedByUser?: { name: string };
}

interface Stats {
    totalExpenses: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
}

const CATEGORIES = [
    { value: 'RENT', label: 'Rent' },
    { value: 'SALARY', label: 'Salary' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'MEDICINE_PURCHASE', label: 'Medicine Purchase' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' },
];

const EMPTY_FORM = {
    category: 'RENT',
    customCategory: '',
    subcategory: '',
    amount: '',
    description: '',
    vendorName: '',
    paymentMethod: 'CASH',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'PAID',
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [filter, setFilter] = useState({ category: 'ALL', status: 'ALL', fromDate: '', toDate: '' });
    const [formData, setFormData] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

    useEffect(() => {
        fetchExpenses();
    }, [filter]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.category !== 'ALL') params.append('category', filter.category);
            if (filter.status !== 'ALL') params.append('status', filter.status);
            if (filter.fromDate) params.append('fromDate', filter.fromDate);
            if (filter.toDate) params.append('toDate', filter.toDate);

            const res = await fetch(`/api/billing/expenses?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setSubmitError('Please enter a valid amount greater than 0');
            return;
        }

        // Validate custom category if "Other" is selected
        if (formData.category === 'OTHER' && !formData.customCategory.trim()) {
            setSubmitError('Please enter a custom category name');
            return;
        }

        try {
            setSubmitting(true);

            // Use custom category if "Other" is selected, otherwise use selected category
            const categoryToSend = formData.category === 'OTHER'
                ? formData.customCategory.trim().toUpperCase().replace(/\s+/g, '_')
                : formData.category;

            const res = await fetch('/api/billing/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    category: categoryToSend,
                    amount: parseFloat(formData.amount),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setFormData({ ...EMPTY_FORM });
                setSubmitError(null);
                fetchExpenses();
            } else {
                // Show the actual server error so it's debuggable
                setSubmitError(data.details || data.error || 'Failed to add expense');
                console.error('Expense creation failed:', data);
            }
        } catch (error: any) {
            setSubmitError('Network error — please try again');
            console.error('Expense submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = () => {
        setFormData({ ...EMPTY_FORM });
        setSubmitError(null);
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setSubmitError(null);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

    // Helper to get category display label
    const getCategoryLabel = (categoryValue: string) => {
        const found = CATEGORIES.find(c => c.value === categoryValue);
        if (found) return found.label;
        // For custom categories, convert back from UPPER_SNAKE to Title Case
        return categoryValue
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Track and manage clinic expenses</p>
                    </div>
                    <button
                        onClick={openModal}
                        className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                    >
                        + Add Expense
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalAmount)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-gray-700">{formatCurrency(stats.paidAmount)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <input
                            type="date"
                            value={filter.fromDate}
                            onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                        <input
                            type="date"
                            value={filter.toDate}
                            onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                        <button
                            onClick={() => setFilter({ category: 'ALL', status: 'ALL', fromDate: '', toDate: '' })}
                            className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-8 w-8 border-2 border-teal-200 border-t-teal-600 rounded-full" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-base font-medium text-gray-700 mb-1">No expenses recorded</p>
                            <p className="text-sm text-gray-400">Add your first expense to track clinic spending</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expense #</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor / Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {expenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{exp.expenseNumber}</td>
                                        <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                                                    {getCategoryLabel(exp.category)}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {exp.vendorName && <p className="text-sm font-medium text-gray-800">{exp.vendorName}</p>}
                                            {exp.description && <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>}
                                            {!exp.vendorName && !exp.description && <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-red-500">{formatCurrency(exp.amount)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{exp.paymentMethod || '—'}</td>
                                        <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    exp.paymentStatus === 'PAID'
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                }`}>
                                                    {exp.paymentStatus}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-base font-semibold text-gray-900">Add Expense</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Error banner */}
                            {submitError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700 font-medium">Failed to save expense</p>
                                    <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-400">*</span></label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                        required
                                    >
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Custom Category Input - Only shown when "Other" is selected */}
                            {formData.category === 'OTHER' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Custom Category Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Travel, Insurance, Training"
                                        value={formData.customCategory}
                                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Enter a name for the new expense category</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. BSES, Amazon, Dr. Kumar"
                                    value={formData.vendorName}
                                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <textarea
                                    placeholder="Brief description of the expense..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-400">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.expenseDate}
                                        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                                <div className="flex gap-2">
                                    {['PAID', 'PENDING'].map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentStatus: status })}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                                formData.paymentStatus === status
                                                    ? 'bg-teal-600 text-white border-teal-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? 'Saving...' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}