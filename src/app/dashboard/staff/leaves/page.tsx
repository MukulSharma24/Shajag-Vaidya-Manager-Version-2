'use client';

import { useState, useEffect } from 'react';

interface Leave {
    id: string;
    staff: { firstName: string; lastName: string; employeeId: string };
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
}

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ status: 'PENDING', leaveType: 'ALL' });

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.status !== 'ALL') params.append('status', filter.status);
            if (filter.leaveType !== 'ALL') params.append('leaveType', filter.leaveType);
            const res = await fetch(`/api/staff/leaves?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.leaves || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`${action === 'APPROVED' ? 'Approve' : 'Reject'} this leave?`)) return;
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaveId, action }),
            });
            if (res.ok) {
                alert(`Leave ${action.toLowerCase()}!`);
                fetchLeaves();
            }
        } catch (error) {
            alert('Failed to update leave');
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

    const getLeaveTypeLabel = (type: string) => {
        if (type === 'SICK') return 'EMERGENCY';
        return type;
    };

    const getLeaveTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            SICK: 'bg-red-100 text-red-700',
            CASUAL: 'bg-blue-100 text-blue-700',
            EARNED: 'bg-green-100 text-green-700',
            UNPAID: 'bg-gray-100 text-gray-700',
        };
        return colors[type] || 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Leave Management</h1>
                        <p className="text-sm text-gray-500">Review and manage staff leave requests</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <select
                            value={filter.leaveType}
                            onChange={(e) => setFilter({ ...filter, leaveType: e.target.value })}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        >
                            <option value="ALL">All Types</option>
                            <option value="SICK">Emergency Leave</option>
                            <option value="CASUAL">Casual Leave</option>
                            <option value="EARNED">Earned Leave</option>
                            <option value="UNPAID">Unpaid Leave</option>
                        </select>
                    </div>
                </div>

                {/* Leaves Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-8 w-8 border-2 border-teal-200 border-t-teal-600 rounded-full" />
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-base font-medium text-gray-700 mb-1">No leave requests found</p>
                            <p className="text-sm text-gray-400">Leave requests from staff will appear here</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Leave Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {leaves.map((leave) => (
                                <tr key={leave.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">{leave.staff.firstName} {leave.staff.lastName}</p>
                                        <p className="text-xs text-gray-500">{leave.staff.employeeId}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                                                {getLeaveTypeLabel(leave.leaveType)}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{leave.totalDays}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{leave.reason || '—'}</td>
                                    <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(leave.status)}`}>
                                                {leave.status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {leave.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(leave.id, 'APPROVED')}
                                                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(leave.id, 'REJECTED')}
                                                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}