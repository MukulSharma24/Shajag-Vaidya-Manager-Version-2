'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Bill {
    id: string;
    billNumber: string;
    patient: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    status: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    createdAt: string;
    billItems: Array<{
        itemName: string;
        itemType: string;
        quantity: number;
        unitPrice: number;
        taxPercentage: number;
        totalAmount: number;
        description?: string;
    }>;
    payments: Array<{
        id: string;
        paymentNumber: string;
        amount: number;
        paymentMethod: string;
        paymentDate: string;
        receivedByUser?: {
            name: string;
        };
    }>;
    notes?: string;
}

export default function ViewBillPage() {
    const router = useRouter();
    const params = useParams();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: 'bg-gray-100 text-gray-700',
            PENDING: 'bg-yellow-100 text-yellow-700',
            PARTIAL: 'bg-blue-100 text-blue-700',
            PAID: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
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
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-xl"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1000px] mx-auto px-6 py-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                    >
                        ← Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                        >
                            🖨️ Print
                        </button>
                        {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                            <>
                                <button
                                    onClick={() => router.push(`/dashboard/billing/${bill.id}/edit`)}
                                    className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/billing/${bill.id}/payment`)}
                                    className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm transition-all"
                                >
                                    💰 Record Payment
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Bill Document */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                                <p className="text-teal-100">Your Clinic Name</p>
                                <p className="text-sm text-teal-100">123 Clinic Address, City - 123456</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{bill.billNumber}</p>
                                <p className="text-sm text-teal-100 mt-1">
                                    Date: {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                                </p>
                                <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(bill.status)}`}>
                                    {bill.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="px-8 py-6 border-b border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">Bill To:</h2>
                        <div>
                            <p className="text-xl font-bold text-gray-900">
                                {bill.patient.firstName} {bill.patient.lastName}
                            </p>
                            <p className="text-gray-600 mt-1">📞 {bill.patient.phone}</p>
                            {bill.patient.email && <p className="text-gray-600">✉️ {bill.patient.email}</p>}
                        </div>
                    </div>

                    {/* Bill Items */}
                    <div className="px-8 py-6">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase">Item</th>
                                <th className="text-center py-3 text-sm font-semibold text-gray-600 uppercase">Qty</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Rate</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Tax</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Amount</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bill.billItems.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-4">
                                        <p className="font-medium text-gray-900">{item.itemName}</p>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                        )}
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                {item.itemType}
                                            </span>
                                    </td>
                                    <td className="text-center py-4 text-gray-900">{item.quantity}</td>
                                    <td className="text-right py-4 text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                    <td className="text-right py-4 text-gray-600 text-sm">{item.taxPercentage}%</td>
                                    <td className="text-right py-4 font-semibold text-gray-900">
                                        {formatCurrency(item.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="px-8 py-6 bg-gray-50">
                        <div className="max-w-md ml-auto space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal:</span>
                                <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Tax:</span>
                                <span className="font-medium">{formatCurrency(bill.taxAmount)}</span>
                            </div>
                            {bill.discountAmount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">-{formatCurrency(bill.discountAmount)}</span>
                                </div>
                            )}
                            <div className="border-t-2 border-gray-300 pt-3 flex justify-between">
                                <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                                <span className="text-2xl font-bold text-teal-600">
                                    {formatCurrency(bill.totalAmount)}
                                </span>
                            </div>
                            {bill.paidAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-green-600">
                                        <span className="font-semibold">Paid:</span>
                                        <span className="font-semibold">{formatCurrency(bill.paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-yellow-600">
                                        <span className="font-bold">Balance Due:</span>
                                        <span className="font-bold">{formatCurrency(bill.balanceAmount)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {bill.notes && (
                        <div className="px-8 py-4 bg-blue-50 border-t border-blue-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                            <p className="text-sm text-gray-600">{bill.notes}</p>
                        </div>
                    )}
                </div>

                {/* Payment History */}
                {bill.payments.length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 print:hidden">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
                        <div className="space-y-3">
                            {bill.payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">{payment.paymentNumber}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                                        </p>
                                        {payment.receivedByUser && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Received by: {payment.receivedByUser.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}