// src/app/dashboard/staff/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    patient?: {
        id: string;
        phoneNumber: string;
        registrationId: number;
    };
    staff?: {
        id: string;
        employeeId: string;
        phone: string;
    };
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'patients'>('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STAFF',
        phone: '',
        // Patient-specific fields
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
    });
    const [newPassword, setNewPassword] = useState('');

    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (currentUser?.role !== 'OWNER') {
            router.push('/dashboard');
            return;
        }
        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users?includePatients=true');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFormLoading(true);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(`${formData.role} account created successfully!`);
            setShowAddModal(false);
            resetForm();
            fetchUsers();

            // Clear success after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setError('');
        setFormLoading(true);

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
            };

            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess('User updated successfully!');
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setError('');
        setFormLoading(true);

        try {
            if (newPassword.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }

            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(`Password reset for ${selectedUser.name}!`);
            setShowResetPasswordModal(false);
            setSelectedUser(null);
            setNewPassword('');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive }),
            });

            if (res.ok) {
                fetchUsers();
                setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.staff?.phone || user.patient?.phoneNumber || '',
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
        });
        setShowEditModal(true);
        setError('');
    };

    const openResetPasswordModal = (user: User) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowResetPasswordModal(true);
        setError('');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'STAFF',
            phone: '',
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
        });
        setError('');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'OWNER': return 'bg-purple-100 text-purple-800';
            case 'DOCTOR': return 'bg-blue-100 text-blue-800';
            case 'STAFF': return 'bg-green-100 text-green-800';
            case 'PATIENT': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'OWNER': return '👑';
            case 'DOCTOR': return '🩺';
            case 'STAFF': return '👤';
            case 'PATIENT': return '🏥';
            default: return '👤';
        }
    };

    // Filter users based on active tab
    const filteredUsers = users.filter(user => {
        if (activeTab === 'staff') return ['OWNER', 'DOCTOR', 'STAFF'].includes(user.role);
        if (activeTab === 'patients') return user.role === 'PATIENT';
        return true;
    });

    if (currentUser?.role !== 'OWNER') {
        return null;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Create and manage all user accounts</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {success}
                    </span>
                    <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">×</button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Users', count: users.length, icon: '👥', color: 'bg-blue-50 border-blue-200' },
                    { label: 'Doctors', count: users.filter(u => u.role === 'DOCTOR').length, icon: '🩺', color: 'bg-indigo-50 border-indigo-200' },
                    { label: 'Staff', count: users.filter(u => u.role === 'STAFF').length, icon: '👤', color: 'bg-green-50 border-green-200' },
                    { label: 'Patients', count: users.filter(u => u.role === 'PATIENT').length, icon: '🏥', color: 'bg-orange-50 border-orange-200' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.color} border rounded-xl p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                            </div>
                            <span className="text-2xl">{stat.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                {[
                    { id: 'all', label: 'All Users' },
                    { id: 'staff', label: 'Staff & Doctors' },
                    { id: 'patients', label: 'Patients' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.id
                                ? 'border-teal-600 text-teal-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12">
                    <svg className="animate-spin h-10 w-10 text-teal-600 mx-auto" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                                user.role === 'PATIENT' ? 'bg-orange-100' :
                                                    user.role === 'DOCTOR' ? 'bg-blue-100' :
                                                        user.role === 'OWNER' ? 'bg-purple-100' : 'bg-green-100'
                                            }`}>
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                {user.patient && (
                                                    <p className="text-xs text-orange-600">Patient ID: #{user.patient.registrationId}</p>
                                                )}
                                                {user.staff && (
                                                    <p className="text-xs text-blue-600">Employee: {user.staff.employeeId}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-teal-600 hover:text-teal-800 text-sm font-medium px-2 py-1 rounded hover:bg-teal-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openResetPasswordModal(user)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Reset Password
                                            </button>
                                            {user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`text-sm font-medium px-2 py-1 rounded ${
                                                        user.isActive
                                                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                    }`}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                            <p className="text-sm text-gray-600 mt-1">Create a new account for staff, doctor, or patient</p>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'STAFF', label: 'Staff', icon: '👤' },
                                        { value: 'DOCTOR', label: 'Doctor', icon: '🩺' },
                                        { value: 'PATIENT', label: 'Patient', icon: '🏥' },
                                    ].map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.value })}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                formData.role === role.value
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="text-2xl">{role.icon}</span>
                                            <p className="text-sm font-medium mt-1">{role.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>

                            {/* Patient-specific fields */}
                            {formData.role === 'PATIENT' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                            <input
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                        <select
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        >
                                            <option value="">Select (Optional)</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setError(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {formLoading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    disabled={selectedUser.id === currentUser?.id}
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="PATIENT">Patient</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedUser(null); setError(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {formLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Set a new password for <strong>{selectedUser.name}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    ⚠️ The user will need to use this new password on their next login.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setError(''); setNewPassword(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {formLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}