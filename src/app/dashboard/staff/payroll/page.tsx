'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Payroll {
    id: string;
    payrollNumber: string;
    staff: {
        id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
        role: string;
    };
    month: number;
    year: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    paymentStatus: string;
    daysPresent: number;
    daysAbsent: number;
    totalWorkingDays: number;
}

interface Staff {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    role: string;
    basicSalary: number;
}

export default function PayrollPage() {
    const router = useRouter();
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: 'ALL',
    });

    const [generateForm, setGenerateForm] = useState({
        staffId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        daysPresent: 26,
        daysAbsent: 0,
        totalWorkingDays: 26,
        otherDeductions: 0,
        notes: '',
    });

    useEffect(() => {
        fetchPayrolls();
        fetchStaff();
    }, [filter]);

    const fetchPayrolls = async () => {
        try {
            const params = new URLSearchParams();
            params.append('month', filter.month.toString());
            params.append('year', filter.year.toString());
            if (filter.status !== 'ALL') params.append('status', filter.status);

            const res = await fetch(`/api/staff/payroll?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPayrolls(data.payrolls || []);
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/staff?status=ACTIVE');
            if (res.ok) {
                const data = await res.json();
                setStaff(data.staff || []);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleGeneratePayroll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!generateForm.staffId) {
            alert('Please select a staff member');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/staff/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generateForm),
            });

            if (res.ok) {
                alert('Payroll generated successfully!');
                setShowGenerateModal(false);
                fetchPayrolls();
                // Reset form
                setGenerateForm({
                    staffId: '',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    daysPresent: 26,
                    daysAbsent: 0,
                    totalWorkingDays: 26,
                    otherDeductions: 0,
                    notes: '',
                });
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to generate payroll');
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            alert('Failed to generate payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (payrollId: string) => {
        if (!confirm('Mark this payroll as paid?')) return;

        try {
            const res = await fetch('/api/staff/payroll', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payrollId,
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'BANK_TRANSFER',
                }),
            });

            if (res.ok) {
                alert('Payroll marked as paid!');
                fetchPayrolls();
            } else {
                alert('Failed to update payroll');
            }
        } catch (error) {
            console.error('Error updating payroll:', error);
            alert('Failed to update payroll');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const getStatusColor = (status: string) => {
        return status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
                        <p className="text-gray-600">Generate and manage staff salaries</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={() => setShowGenerateModal(true)}
                            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-sm transition-all"
                        >
                            + Generate Payroll
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                            <select
                                value={filter.month}
                                onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                            <select
                                value={filter.year}
                                onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="ALL">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {payrolls.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600 text-lg font-medium mb-2">No payroll records found</p>
                            <p className="text-gray-500 text-sm">Generate payroll for staff members</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payroll #</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Attendance</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Gross</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Deductions</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Net Salary</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {payrolls.map((payroll) => (
                                    <tr key={payroll.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">{payroll.payrollNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {payroll.staff.firstName} {payroll.staff.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">{payroll.staff.employeeId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {getMonthName(payroll.month)} {payroll.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div>
                                                <p className="text-green-600">Present: {payroll.daysPresent}</p>
                                                <p className="text-red-600">Absent: {payroll.daysAbsent}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {formatCurrency(payroll.grossSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                            {formatCurrency(payroll.totalDeductions)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-teal-600">
                                            {formatCurrency(payroll.netSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payroll.paymentStatus)}`}>
                                                    {payroll.paymentStatus}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {payroll.paymentStatus === 'PENDING' && (
                                                <button
                                                    onClick={() => handleMarkPaid(payroll.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Generate Payroll Modal */}
                {showGenerateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900">Generate Payroll</h2>
                            </div>

                            <form onSubmit={handleGeneratePayroll} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Staff Member <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={generateForm.staffId}
                                            onChange={(e) => setGenerateForm({ ...generateForm, staffId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                            required
                                        >
                                            <option value="">Select staff...</option>
                                            {staff.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName} - {member.role} ({formatCurrency(member.basicSalary)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                                        <select
                                            value={generateForm.month}
                                            onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                        <select
                                            value={generateForm.year}
                                            onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        >
                                            {Array.from({ length: 3 }, (_, i) => {
                                                const year = new Date().getFullYear() - i;
                                                return <option key={year} value={year}>{year}</option>;
                                            })}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Days Present</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={generateForm.daysPresent}
                                            onChange={(e) => setGenerateForm({
                                                ...generateForm,
                                                daysPresent: parseInt(e.target.value),
                                                daysAbsent: generateForm.totalWorkingDays - parseInt(e.target.value)
                                            })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Days Absent</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={generateForm.daysAbsent}
                                            onChange={(e) => setGenerateForm({
                                                ...generateForm,
                                                daysAbsent: parseInt(e.target.value),
                                                daysPresent: generateForm.totalWorkingDays - parseInt(e.target.value)
                                            })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Working Days</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={generateForm.totalWorkingDays}
                                            onChange={(e) => setGenerateForm({ ...generateForm, totalWorkingDays: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Deductions (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={generateForm.otherDeductions}
                                            onChange={(e) => setGenerateForm({ ...generateForm, otherDeductions: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <textarea
                                            value={generateForm.notes}
                                            onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenerateModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Generating...' : 'Generate Payroll'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}