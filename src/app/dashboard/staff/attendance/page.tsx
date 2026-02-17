'use client';

import { useState, useEffect } from 'react';

interface Staff {
    id: string;
    employeeId: string;
    fullName: string;
    role: string;
    department: string;
}

interface AttendanceRecord {
    staffId: string;
    date: string;
    status: string;
    clockIn: string;
    clockOut: string;
}

export default function AttendancePage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (staff.length > 0) {
            fetchAttendance();
        }
    }, [date, staff]);

    const fetchStaff = async () => {
        try {
            const clinicId = localStorage.getItem('clinicId') || 'default-clinic';
            const res = await fetch(`/api/staff?status=ACTIVE&clinicId=${clinicId}`);
            const data = await res.json();

            // ✅ FIX: Map staff with fullName
            const mappedStaff = (data.staff || []).map((s: any) => ({
                id: s.id,
                employeeId: s.employeeId,
                fullName: `${s.firstName} ${s.lastName}`,
                role: s.role,
                department: s.department || s.designation || 'N/A'
            }));

            setStaff(mappedStaff);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const clinicId = localStorage.getItem('clinicId') || 'default-clinic';
            const res = await fetch(`/api/staff/attendance?date=${date}&clinicId=${clinicId}`);
            const data = await res.json();

            const attendanceMap = new Map<string, any>(
                (data.attendance || []).map((att: any) => [att.staffId, att])
            );

            const updated: AttendanceRecord[] = staff.map(s => {
                const att = attendanceMap.get(s.id);
                if (att) {
                    return {
                        staffId: s.id,
                        date: att.attendanceDate,
                        status: att.status,
                        clockIn: att.clockIn || '09:00',
                        clockOut: att.clockOut || '18:00',
                    };
                }
                return {
                    staffId: s.id,
                    date: date,
                    status: 'PRESENT',
                    clockIn: '09:00',
                    clockOut: '18:00',
                };
            });
            setAttendanceRecords(updated);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const updateAttendance = (staffId: string, field: keyof AttendanceRecord, value: string) => {
        setAttendanceRecords(prev =>
            prev.map(record =>
                record.staffId === staffId
                    ? { ...record, [field]: value }
                    : record
            )
        );
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const clinicId = localStorage.getItem('clinicId') || 'default-clinic';

            const res = await fetch('/api/staff/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    attendanceRecords,
                    clinicId
                }),
            });

            if (res.ok) {
                alert('Attendance saved successfully!');
            } else {
                alert('Failed to save attendance');
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PRESENT: 'bg-green-100 text-green-800 border-green-300',
            ABSENT: 'bg-red-100 text-red-800 border-red-300',
            HALF_DAY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            LEAVE: 'bg-blue-100 text-blue-800 border-blue-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Attendance</h1>
                    <p className="text-gray-600">Mark daily attendance for all staff members</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                        >
                            {loading ? '⏳ Saving...' : '✓ Save Attendance'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Clock In</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Clock Out</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {staff.map((member) => {
                                const record = attendanceRecords.find(r => r.staffId === member.id);
                                if (!record) return null;

                                return (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {member.employeeId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                                                <div className="text-xs text-gray-500">{member.department}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {member.role}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={record.status}
                                                onChange={(e) => updateAttendance(member.id, 'status', e.target.value)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 focus:ring-2 focus:ring-teal-500 ${getStatusColor(record.status)}`}
                                            >
                                                <option value="PRESENT">Present</option>
                                                <option value="ABSENT">Absent</option>
                                                <option value="HALF_DAY">Half Day</option>
                                                <option value="LEAVE">Leave</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="time"
                                                value={record.clockIn}
                                                onChange={(e) => updateAttendance(member.id, 'clockIn', e.target.value)}
                                                disabled={record.status === 'ABSENT'}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="time"
                                                value={record.clockOut}
                                                onChange={(e) => updateAttendance(member.id, 'clockOut', e.target.value)}
                                                disabled={record.status === 'ABSENT'}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(status => {
                        const count = attendanceRecords.filter(r => r.status === status).length;
                        return (
                            <div key={status} className={`p-4 rounded-xl border-2 ${getStatusColor(status)}`}>
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-sm font-medium">{status.replace('_', ' ')}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}