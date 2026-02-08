'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Staff {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    designation: string;
    status: string;
    basicSalary: number;
    joiningDate: string;
    profilePicture?: string;
}

interface Stats {
    byStatus: { status: string; count: number }[];
    byRole: { role: string; count: number }[];
    totalSalary: number;
}

export default function StaffManagementPage() {
    const router = useRouter();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        role: 'ALL',
        status: 'ACTIVE',
        search: '',
    });

    useEffect(() => {
        fetchStaff();
    }, [filter]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.role !== 'ALL') params.append('role', filter.role);
            if (filter.status !== 'ALL') params.append('status', filter.status);
            if (filter.search) params.append('search', filter.search);

            const res = await fetch(`/api/staff?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStaff(data.staff || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (role: string) => {
        const icons: Record<string, string> = {
            DOCTOR: '👨‍⚕️',
            RECEPTIONIST: '👩‍💼',
            THERAPIST: '🧘',
            PHARMACIST: '💊',
            LAB_TECHNICIAN: '🔬',
            NURSE: '👩‍⚕️',
            MANAGER: '👔',
            OTHER: '👤',
        };
        return icons[role] || '👤';
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            DOCTOR: 'from-blue-500 to-blue-600',
            RECEPTIONIST: 'from-pink-500 to-pink-600',
            THERAPIST: 'from-purple-500 to-purple-600',
            PHARMACIST: 'from-green-500 to-green-600',
            LAB_TECHNICIAN: 'from-yellow-500 to-yellow-600',
            NURSE: 'from-red-500 to-red-600',
            MANAGER: 'from-gray-700 to-gray-800',
            OTHER: 'from-gray-500 to-gray-600',
        };
        return colors[role] || 'from-gray-500 to-gray-600';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-700',
            INACTIVE: 'bg-gray-100 text-gray-700',
            ON_LEAVE: 'bg-yellow-100 text-yellow-700',
            TERMINATED: 'bg-red-100 text-red-700',
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
                        <p className="text-gray-600">Manage your clinic team and personnel</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/dashboard/staff/attendance')}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                        >
                            Attendance
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/staff/leaves')}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                        >
                            Leaves
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/staff/payroll')}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition-all"
                        >
                            Payroll
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/staff/create')}
                            className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-sm transition-all"
                        >
                            + Add Staff
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.byStatus.reduce((sum, s) => sum + s.count, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Staff</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.byStatus.find(s => s.status === 'ACTIVE')?.count || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Departments</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.byRole.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Monthly Payroll</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats.totalSalary)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select
                                value={filter.role}
                                onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                                <option value="THERAPIST">Therapist</option>
                                <option value="PHARMACIST">Pharmacist</option>
                                <option value="NURSE">Nurse</option>
                                <option value="LAB_TECHNICIAN">Lab Technician</option>
                                <option value="MANAGER">Manager</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="ON_LEAVE">On Leave</option>
                                <option value="TERMINATED">Terminated</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                placeholder="Name, email, phone..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilter({ role: 'ALL', status: 'ACTIVE', search: '' })}
                                className="w-full px-4 py-2.5 rounded-xl font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Staff Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-20 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-600 text-lg font-medium mb-2">No staff members found</p>
                        <p className="text-gray-500 text-sm">Add your first staff member to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {staff.map((member) => (
                            <div
                                key={member.id}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-teal-300 overflow-hidden cursor-pointer"
                                onClick={() => router.push(`/dashboard/staff/${member.id}`)}
                            >
                                {/* Header with Role Badge */}
                                <div className={`h-24 bg-gradient-to-br ${getRoleColor(member.role)} flex items-center justify-between px-6 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/5"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg">
                                            {getRoleIcon(member.role)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{member.role}</h3>
                                            <p className="text-white/90 text-sm">{member.employeeId}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)} relative z-10`}>
                                        {member.status}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                                        {member.firstName} {member.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">{member.designation}</p>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{member.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Joined {new Date(member.joiningDate).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
                                        <p className="text-lg font-bold text-teal-600">{formatCurrency(member.basicSalary)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}