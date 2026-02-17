// src/app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user, roleLabel } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validate
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
                {[
                    { id: 'profile', label: 'Profile' },
                    { id: 'password', label: 'Change Password' },
                    { id: 'preferences', label: 'Preferences' },
                ].map((tab) => (
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

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>

                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-teal-600">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                            <p className="text-gray-600">{user?.email}</p>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user?.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                                    user?.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                                        user?.role === 'STAFF' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                            }`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                disabled
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={user?.role || ''}
                                disabled
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                            <input
                                type="text"
                                value={user?.id || ''}
                                disabled
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 text-xs"
                            />
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-500">
                        Contact the administrator to update your profile information.
                    </p>
                </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

                    {passwordMessage && (
                        <div className={`mb-4 p-4 rounded-lg ${
                            passwordMessage.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {passwordMessage.text}
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Minimum 8 characters"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Dark Mode</p>
                                <p className="text-sm text-gray-500">Use dark theme for the interface</p>
                            </div>
                            <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded-lg">
                                Coming Soon
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive email notifications for appointments</p>
                            </div>
                            <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded-lg">
                                Coming Soon
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900">Language</p>
                                <p className="text-sm text-gray-500">Choose your preferred language</p>
                            </div>
                            <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                                <option>English</option>
                                <option>हिंदी</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}