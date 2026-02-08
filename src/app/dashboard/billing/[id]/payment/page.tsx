'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Bill {
    id: string;
    billNumber: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
}

export default function RecordPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        paymentMethod: 'CASH',
        transactionId: '',
        referenceNumber: '',
        notes: '',
    });

    useEffect(() => {
        if (params.id) {
            fetchBill();
        }
    }, [params.id]);

    const fetchBill = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/billing/bills/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setBill(data.bill);
                setPaymentData({ ...paymentData, amount: data.bill.balanceAmount });
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentData.amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (bill && paymentData.amount > bill.balanceAmount) {
            alert('Payment amount cannot exceed balance due');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/billing/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    billId: params.id,
                    ...paymentData,
                }),
            });

            if (res.ok) {
                alert('Payment recorded successfully!');
                router.push(`/dashboard/billing/${params.id}`);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to record payment');
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 text-lg">Bill not found</p>
                    <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (bill.status === 'PAID') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">Bill Already Paid</p>
                    <p className="text-gray-600 mb-4">This bill has been fully paid</p>
                    <button
                        onClick={() => router.push(`/dashboard/billing/${params.id}`)}
                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all"
                    >
                        View Bill
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[800px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Record Payment</h1>
                        <p className="text-gray-600">Record payment for invoice {bill.billNumber}</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                    >
                        ← Back
                    </button>
                </div>

                {/* Bill Summary */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl shadow-sm border border-teal-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Patient</p>
                            <p className="text-xl font-bold text-gray-900">
                                {bill.patient.firstName} {bill.patient.lastName}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Invoice</p>
                            <p className="text-lg font-semibold text-gray-900">{bill.billNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-teal-200">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Paid</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(bill.paidAmount)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Balance Due</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(bill.balanceAmount)}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Amount (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0.01"
                                max={bill.balanceAmount}
                                step="0.01"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg font-semibold"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Maximum: {formatCurrency(bill.balanceAmount)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'].map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentData({ ...paymentData, paymentMethod: method })}
                                        className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${
                                            paymentData.paymentMethod === method
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-teal-300'
                                        }`}
                                    >
                                        {method.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentData.paymentMethod !== 'CASH' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentData.transactionId}
                                        onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                        placeholder="e.g., TXN123456789"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentData.referenceNumber}
                                        onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                                        placeholder="e.g., Cheque number, UTR, etc."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                placeholder="Any additional notes..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-sm transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Recording...' : `Record Payment of ${formatCurrency(paymentData.amount)}`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Payment Recording Tips</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Partial payments are allowed - you can record multiple payments</li>
                                <li>• Always record transaction IDs for digital payments</li>
                                <li>• Receipt will be auto-generated after payment recording</li>
                                <li>• Patient ledger will be updated automatically</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}