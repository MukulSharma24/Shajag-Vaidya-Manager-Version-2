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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
                        <p className="text-gray-600">Review and manage staff leave requests</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="px-4 py-2.5 rounded-xl border">
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <select value={filter.leaveType} onChange={(e) => setFilter({ ...filter, leaveType: e.target.value })} className="px-4 py-2.5 rounded-xl border">
                            <option value="ALL">All Types</option>
                            <option value="SICK">Sick Leave</option>
                            <option value="CASUAL">Casual Leave</option>
                            <option value="EARNED">Earned Leave</option>
                            <option value="UNPAID">Unpaid Leave</option>
                        </select>
                    </div>
                </div>

                {/* Leaves Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Leave Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Days</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {leaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium">{leave.staff.firstName} {leave.staff.lastName}</p>
                                    <p className="text-sm text-gray-500">{leave.staff.employeeId}</p>
                                </td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{leave.leaveType}</span></td>
                                <td className="px-6 py-4 text-sm">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-semibold">{leave.totalDays}</td>
                                <td className="px-6 py-4 text-sm max-w-xs truncate">{leave.reason}</td>
                                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>{leave.status}</span></td>
                                <td className="px-6 py-4">
                                    {leave.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(leave.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">✓ Approve</button>
                                            <button onClick={() => handleAction(leave.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">✗ Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}