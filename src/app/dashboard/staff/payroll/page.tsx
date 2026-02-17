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
    allowances: number;
    hra: number;
    otherAllowances: number;
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

    // Auto-calculation for preview
    const selectedStaff = staff.find(s => s.id === generateForm.staffId);
    const previewCalc = selectedStaff ? {
        basicSalary: Number(selectedStaff.basicSalary || 0),
        allowances: Number(selectedStaff.allowances || 0),
        hra: Number(selectedStaff.hra || 0),
        otherAllowances: Number(selectedStaff.otherAllowances || 0),
        get grossSalary() {
            return this.basicSalary + this.allowances + this.hra + this.otherAllowances;
        },
        get perDaySalary() {
            return this.grossSalary / (generateForm.totalWorkingDays || 1);
        },
        get absenceDeduction() {
            return this.perDaySalary * generateForm.daysAbsent;
        },
        get totalDeductions() {
            return this.absenceDeduction + (generateForm.otherDeductions || 0);
        },
        get netSalary() {
            return this.grossSalary - this.totalDeductions;
        },
    } : null;

    useEffect(() => {
        fetchPayrolls();
        fetchStaff();
    }, [filter]);

    // Helper functions for attendance calculation
    const handleDaysPresentChange = (value: number) => {
        const total = generateForm.totalWorkingDays;
        const present = Math.max(0, Math.min(value, total));
        const absent = total - present;
        setGenerateForm(prev => ({ ...prev, daysPresent: present, daysAbsent: absent }));
    };

    const handleDaysAbsentChange = (value: number) => {
        const total = generateForm.totalWorkingDays;
        const absent = Math.max(0, Math.min(value, total));
        const present = total - absent;
        setGenerateForm(prev => ({ ...prev, daysPresent: present, daysAbsent: absent }));
    };

    const handleTotalDaysChange = (value: number) => {
        const total = Math.max(1, Math.min(value, 31)); // Max 31 days
        const present = Math.min(generateForm.daysPresent, total);
        const absent = total - present;
        setGenerateForm(prev => ({ ...prev, totalWorkingDays: total, daysPresent: present, daysAbsent: absent }));
    };

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
                alert('✅ Payroll generated successfully!');
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
                alert('❌ ' + (error.error || 'Failed to generate payroll'));
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            alert('❌ Failed to generate payroll');
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
                alert('✅ Payroll marked as paid!');
                fetchPayrolls();
            } else {
                alert('❌ Failed to update payroll');
            }
        } catch (error) {
            console.error('Error updating payroll:', error);
            alert('❌ Failed to update payroll');
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

                {/* ✨ ENHANCED Generate Payroll Modal */}
                {showGenerateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 p-6 rounded-t-3xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Generate Payroll</h2>
                                        <p className="text-teal-100 text-sm mt-1">Calculate and generate staff salary for the period</p>
                                    </div>
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleGeneratePayroll} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left: Form Inputs */}
                                    <div className="lg:col-span-2 space-y-5">
                                        {/* Staff Selection */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Staff Member <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={generateForm.staffId}
                                                onChange={(e) => setGenerateForm({ ...generateForm, staffId: e.target.value })}
                                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                                                required
                                            >
                                                <option value="">Select employee...</option>
                                                {staff.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.firstName} {member.lastName} ({member.role}) - {formatCurrency(member.basicSalary)}/mo
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Period */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                                                <select
                                                    value={generateForm.month}
                                                    onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                                                <select
                                                    value={generateForm.year}
                                                    onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                                                >
                                                    {Array.from({ length: 3 }, (_, i) => {
                                                        const year = new Date().getFullYear() - i;
                                                        return <option key={year} value={year}>{year}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Attendance */}
                                        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                                            <p className="text-sm font-semibold text-blue-900 mb-3">Attendance</p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-blue-700 mb-1.5">Days Present</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={generateForm.totalWorkingDays}
                                                        value={generateForm.daysPresent}
                                                        onChange={(e) => handleDaysPresentChange(parseInt(e.target.value) || 0)}
                                                        className="w-full px-3 py-2.5 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-blue-700 mb-1.5">Days Absent</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={generateForm.totalWorkingDays}
                                                        value={generateForm.daysAbsent}
                                                        onChange={(e) => handleDaysAbsentChange(parseInt(e.target.value) || 0)}
                                                        className="w-full px-3 py-2.5 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-blue-700 mb-1.5">Total Days</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        value={generateForm.totalWorkingDays}
                                                        onChange={(e) => handleTotalDaysChange(parseInt(e.target.value) || 26)}
                                                        className="w-full px-3 py-2.5 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Other Deductions (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={generateForm.otherDeductions}
                                                onChange={(e) => setGenerateForm({ ...generateForm, otherDeductions: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                                            <textarea
                                                value={generateForm.notes}
                                                onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all resize-none"
                                                placeholder="Add any notes about this payroll..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Live Preview */}
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Salary Breakdown</p>

                                            {previewCalc ? (
                                                <div className="space-y-3">
                                                    {/* Earnings */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Basic Salary</span>
                                                            <span className="font-semibold text-gray-900">{formatCurrency(previewCalc.basicSalary)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">HRA</span>
                                                            <span className="font-semibold text-gray-900">{formatCurrency(previewCalc.hra)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Allowances</span>
                                                            <span className="font-semibold text-gray-900">{formatCurrency(previewCalc.allowances + previewCalc.otherAllowances)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="border-t-2 border-dashed border-gray-300 pt-3">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-semibold text-gray-700">Gross Salary</span>
                                                            <span className="font-bold text-teal-600">{formatCurrency(previewCalc.grossSalary)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Deductions */}
                                                    <div className="space-y-2 pt-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-red-600">Absence ({generateForm.daysAbsent}d)</span>
                                                            <span className="font-semibold text-red-600">-{formatCurrency(previewCalc.absenceDeduction)}</span>
                                                        </div>
                                                        {generateForm.otherDeductions > 0 && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-red-600">Other</span>
                                                                <span className="font-semibold text-red-600">-{formatCurrency(generateForm.otherDeductions)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Net */}
                                                    <div className="border-t-2 border-gray-300 pt-3 mt-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold text-gray-900">Net Salary</span>
                                                            <span className="text-xl font-black text-teal-600">{formatCurrency(previewCalc.netSalary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm text-gray-500">Select an employee to preview</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-6 mt-6 border-t-2 border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenerateModal(false)}
                                        className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !generateForm.staffId}
                                        className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Generating...
                                            </span>
                                        ) : (
                                            'Generate Payroll'
                                        )}
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