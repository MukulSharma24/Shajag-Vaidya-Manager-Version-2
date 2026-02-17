// src/components/staff/CreateLoginButton.tsx
'use client';

import { useState } from 'react';

interface CreateLoginButtonProps {
    staffId: string;
    staffName: string;
    staffEmail: string;
    hasLogin: boolean;
    onSuccess?: () => void;
}

export default function CreateLoginButton({
                                              staffId,
                                              staffName,
                                              staffEmail,
                                              hasLogin,
                                              onSuccess
                                          }: CreateLoginButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/staff/${staffId}/create-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create login');
            }

            setSuccess(`Login credentials created! Email: ${staffEmail}`);
            setPassword('');
            setConfirmPassword('');

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
                onSuccess?.();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (hasLogin) {
        return (
            <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Login Enabled</span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Create Login
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Create Login Credentials</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Create login access for <strong>{staffName}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Login Email:</strong> {staffEmail}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Minimum 8 characters"
                                    required
                                    disabled={loading || !!success}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Re-enter password"
                                    required
                                    disabled={loading || !!success}
                                />
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    ⚠️ Please share these credentials securely with {staffName}.
                                    They will use this email and password to log in.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError('');
                                        setPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !!success}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Login'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}