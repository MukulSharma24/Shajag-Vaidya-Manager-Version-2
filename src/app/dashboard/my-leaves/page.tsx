'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveBalance {
    sickLeaveTotal: number;
    sickLeaveUsed: number;
    sickLeaveBalance: number;
    casualLeaveTotal: number;
    casualLeaveUsed: number;
    casualLeaveBalance: number;
    earnedLeaveTotal: number;
    earnedLeaveUsed: number;
    earnedLeaveBalance: number;
}

interface Leave {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
    appliedDate: string;
    reviewedDate?: string;
    reviewNotes?: string;
    reviewedByUser?: { name: string };
}

interface StaffProfile {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    designation?: string;
}

const LEAVE_TYPES = [
    { value: 'EMERGENCY', label: 'Emergency Leave', color: 'bg-red-100 text-red-700', autoApprove: true },
    { value: 'CASUAL', label: 'Casual Leave', color: 'bg-blue-100 text-blue-700', autoApprove: false },
    { value: 'EARNED', label: 'Earned Leave', color: 'bg-green-100 text-green-700', autoApprove: false },
    { value: 'UNPAID', label: 'Unpaid Leave', color: 'bg-gray-100 text-gray-700', autoApprove: false },
];

export default function MyLeavesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [staff, setStaff] = useState<StaffProfile | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('ALL');

    const [formData, setFormData] = useState({
        leaveType: 'CASUAL',
        startDate: '',
        endDate: '',
        reason: '',
    });

    useEffect(() => {
        if (user && !['DOCTOR', 'STAFF'].includes(user.role)) {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [user, router]);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const profileRes = await fetch('/api/staff/my-profile');
            if (!profileRes.ok) {
                const data = await profileRes.json();
                if (data.notLinked) {
                    setError('Your account is not linked to a staff profile. Please contact admin.');
                }
                return;
            }
            const profileData = await profileRes.json();
            setStaff(profileData.staff);
            setLeaveBalance(profileData.leaveBalance);
            await fetchLeaves();
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.append('status', filter);
            const res = await fetch(`/api/staff/my-leaves?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.leaves || []);
                if (data.leaveBalance) {
                    setLeaveBalance(data.leaveBalance);
                }
            }
        } catch (err) {
            console.error('Error fetching leaves:', err);
        }
    };

    useEffect(() => {
        if (staff) {
            fetchLeaves();
        }
    }, [filter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/staff/my-leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit leave request');
            }

            const isEmergency = formData.leaveType === 'EMERGENCY';
            setSuccess(isEmergency
                ? 'Emergency leave approved automatically!'
                : 'Leave request submitted! Will auto-approve in 24 hours if not reviewed.'
            );
            setShowModal(false);
            setFormData({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
            fetchLeaves();

            const profileRes = await fetch('/api/staff/my-profile');
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setLeaveBalance(profileData.leaveBalance);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-700',
            APPROVED: 'bg-green-100 text-green-700',
            REJECTED: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getLeaveTypeColor = (type: string) => {
        if (type === 'SICK') return 'bg-red-100 text-red-700';
        const found = LEAVE_TYPES.find(t => t.value === type);
        return found?.color || 'bg-gray-100 text-gray-700';
    };

    const getLeaveTypeLabel = (type: string) => {
        if (type === 'SICK') return 'Emergency Leave';
        const found = LEAVE_TYPES.find(t => t.value === type);
        return found?.label || type;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (start > end) return 0;
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    const selectedDays = calculateDays();
    const isEmergencyLeave = formData.leaveType === 'EMERGENCY';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Linked</h2>
                    <p className="text-sm text-gray-600">Your account is not linked to a staff profile. Please contact your administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Leaves</h1>
                        <p className="text-sm text-gray-500">
                            {staff.firstName} {staff.lastName} ({staff.employeeId})
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Apply for Leave
                    </button>
                </div>

                {/* Messages */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Leave Balance Cards */}
                {leaveBalance && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Emergency</p>
                                    <p className="text-xl font-bold text-gray-900">{leaveBalance.sickLeaveBalance}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Used: {leaveBalance.sickLeaveUsed} / {leaveBalance.sickLeaveTotal}</div>
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(leaveBalance.sickLeaveUsed / leaveBalance.sickLeaveTotal) * 100}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Casual</p>
                                    <p className="text-xl font-bold text-gray-900">{leaveBalance.casualLeaveBalance}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Used: {leaveBalance.casualLeaveUsed} / {leaveBalance.casualLeaveTotal}</div>
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(leaveBalance.casualLeaveUsed / leaveBalance.casualLeaveTotal) * 100}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Earned</p>
                                    <p className="text-xl font-bold text-gray-900">{leaveBalance.earnedLeaveBalance}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Used: {leaveBalance.earnedLeaveUsed} / {leaveBalance.earnedLeaveTotal}</div>
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(leaveBalance.earnedLeaveUsed / leaveBalance.earnedLeaveTotal) * 100}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Available</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {leaveBalance.sickLeaveBalance + leaveBalance.casualLeaveBalance + leaveBalance.earnedLeaveBalance}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Total: {leaveBalance.sickLeaveTotal + leaveBalance.casualLeaveTotal + leaveBalance.earnedLeaveTotal} days/year</div>
                        </div>
                    </div>
                )}

                {/* Filter */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Filter:</span>
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                filter === status
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Leaves Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {leaves.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-1">No leave requests</p>
                            <p className="text-sm text-gray-400">Click "Apply for Leave" to submit your first request</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applied On</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                                                    {getLeaveTypeLabel(leave.leaveType)}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{leave.totalDays}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{leave.reason || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(leave.appliedDate)}</td>
                                        <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            {leave.reviewedByUser && leave.status !== 'PENDING' && (
                                                <p className="text-xs text-gray-400 mt-0.5">by {leave.reviewedByUser.name}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Apply Leave Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Apply for Leave</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Leave Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {LEAVE_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, leaveType: type.value })}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                                    formData.leaveType === type.value
                                                        ? 'bg-teal-600 text-white border-teal-600'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                    {leaveBalance && formData.leaveType !== 'UNPAID' && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Available: {
                                            formData.leaveType === 'EMERGENCY' ? leaveBalance.sickLeaveBalance :
                                                formData.leaveType === 'CASUAL' ? leaveBalance.casualLeaveBalance :
                                                    leaveBalance.earnedLeaveBalance
                                        } days
                                        </p>
                                    )}
                                </div>

                                {/* Auto-approve notice */}
                                {isEmergencyLeave ? (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs text-red-800 font-medium">⚡ Emergency leave will be approved immediately</p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs text-blue-800">Will auto-approve in 24 hours if admin doesn't respond</p>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {selectedDays > 0 && (
                                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                                        <span className="text-sm font-semibold text-gray-900">{selectedDays} day{selectedDays > 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                {/* Reason */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                        placeholder="Reason for leave..."
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || selectedDays === 0}
                                        className="flex-1 px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit'}
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