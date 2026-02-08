'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ExpensesPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filter, setFilter] = useState({ category: 'ALL', status: 'ALL', fromDate: '', toDate: '' });

    const [formData, setFormData] = useState({
        category: 'RENT',
        subcategory: '',
        amount: 0,
        description: '',
        vendorName: '',
        paymentMethod: 'CASH',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentStatus: 'PAID',
    });

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
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/billing/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert('Expense added!');
                setShowAddModal(false);
                fetchExpenses();
            }
        } catch (error) {
            alert('Failed to add expense');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
                        <p className="text-gray-600">Track and manage clinic expenses</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm">+ Add Expense</button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500">
                            <option value="ALL">All Categories</option>
                            <option value="SALARY">Salary</option>
                            <option value="RENT">Rent</option>
                            <option value="UTILITIES">Utilities</option>
                            <option value="MEDICINE_PURCHASE">Medicine Purchase</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <input type="date" value={filter.fromDate} onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-300" />
                        <input type="date" value={filter.toDate} onChange={(e) => setFilter({ ...filter, toDate: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-300" />
                        <button onClick={() => setFilter({ category: 'ALL', status: 'ALL', fromDate: '', toDate: '' })} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200">Clear</button>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expense #</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{exp.expenseNumber}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{exp.category}</span>
                                </td>
                                <td className="px-6 py-4 text-sm">{exp.description}</td>
                                <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                                <td className="px-6 py-4 text-sm">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${exp.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{exp.paymentStatus}</span></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b"><h2 className="text-2xl font-bold">Add Expense</h2></div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="px-4 py-3 rounded-xl border" required>
                                        <option value="RENT">Rent</option>
                                        <option value="SALARY">Salary</option>
                                        <option value="UTILITIES">Utilities</option>
                                        <option value="MEDICINE_PURCHASE">Medicine Purchase</option>
                                        <option value="EQUIPMENT">Equipment</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                        <option value="MARKETING">Marketing</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="px-4 py-3 rounded-xl border" required />
                                </div>
                                <input type="text" placeholder="Vendor Name" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} className="w-full px-4 py-3 rounded-xl border" />
                                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                                    <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="px-4 py-3 rounded-xl border">
                                        <option value="CASH">Cash</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="CARD">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white">Add Expense</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}