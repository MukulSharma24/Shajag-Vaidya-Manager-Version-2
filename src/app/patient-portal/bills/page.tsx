// src/app/patient-portal/bills/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientBillsPage() {
    const { user } = useAuth();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

    useEffect(() => {
        fetchBills();
    }, [user?.patientId]);

    const fetchBills = async () => {
        try {
            if (!user?.patientId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/billing/bills?patientId=${user.patientId}`);
            if (res.ok) {
                const data = await res.json();
                setBills(data.bills || []);
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
            case 'UNPAID': return 'bg-red-100 text-red-800';
            case 'DRAFT': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredBills = bills.filter(bill => {
        if (filter === 'pending') return ['UNPAID', 'PARTIAL'].includes(bill.status.toUpperCase());
        if (filter === 'paid') return bill.status.toUpperCase() === 'PAID';
        return true;
    });

    const totalPending = bills
        .filter(b => ['UNPAID', 'PARTIAL'].includes(b.status.toUpperCase()))
        .reduce((sum, b) => sum + (parseFloat(b.balanceAmount) || 0), 0);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Bills</h1>
                <p className="text-gray-600">View and pay your bills</p>
            </div>

            {/* Summary Card */}
            {totalPending > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-5 text-white mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-red-100 text-sm">Total Pending Amount</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalPending)}</p>
                        </div>
                        <button className="px-6 py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors">
                            Pay Now
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'paid'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                            filter === f
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Bills List */}
            {filteredBills.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {filter === 'pending'
                            ? 'No pending bills'
                            : filter === 'paid'
                                ? 'No paid bills'
                                : 'No bills yet'}
                    </h3>
                    <p className="text-gray-600">
                        {filter === 'pending'
                            ? 'Great! You have no outstanding payments.'
                            : 'Your bills will appear here after your appointments.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBills.map((bill) => (
                        <div
                            key={bill.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            ['UNPAID', 'PARTIAL'].includes(bill.status.toUpperCase())
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-green-100 text-green-600'
                                        }`}>
                                            <span className="text-xl">
                                                {['UNPAID', 'PARTIAL'].includes(bill.status.toUpperCase()) ? '💳' : '✓'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    Bill #{bill.billNumber}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                                                    {bill.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(bill.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {formatCurrency(parseFloat(bill.totalAmount))}
                                        </p>
                                        {parseFloat(bill.balanceAmount) > 0 && (
                                            <p className="text-sm text-red-600">
                                                Due: {formatCurrency(parseFloat(bill.balanceAmount))}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Bill Items Preview */}
                                {bill.billItems && bill.billItems.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="space-y-2">
                                            {bill.billItems.slice(0, 3).map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{item.itemName}</span>
                                                    <span className="text-gray-900">{formatCurrency(parseFloat(item.totalAmount))}</span>
                                                </div>
                                            ))}
                                            {bill.billItems.length > 3 && (
                                                <p className="text-xs text-gray-500">
                                                    +{bill.billItems.length - 3} more items
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                    <button className="px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg font-medium transition-colors">
                                        View Details
                                    </button>
                                    <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                        Download PDF
                                    </button>
                                    {['UNPAID', 'PARTIAL'].includes(bill.status.toUpperCase()) && (
                                        <button className="ml-auto px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                                            Pay {formatCurrency(parseFloat(bill.balanceAmount))}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}