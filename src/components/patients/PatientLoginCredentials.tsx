// src/components/patients/PatientLoginCredentials.tsx
'use client';

import { useState, useEffect } from 'react';

interface Props {
    patientId: string;
    patientName: string;
    onLoginCreated?: () => void;
}

export default function PatientLoginCredentials({ patientId, patientName, onLoginCreated }: Props) {
    const [hasLogin, setHasLogin] = useState(false);
    const [loginInfo, setLoginInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { fetchStatus(); }, [patientId]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/patients/${patientId}/create-login`);
            if (res.ok) {
                const data = await res.json();
                setHasLogin(data.hasLogin);
                setLoginInfo(data.loginInfo);
            }
        } catch {}
        finally { setLoading(false); }
    };

    const handleCreateLogin = async () => {
        setError('');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/patients/${patientId}/create-login`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setHasLogin(true);
            setLoginInfo(data.loginInfo);
            setShowDetails(true);
            setSuccess('Login created!');
            onLoginCreated?.();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    const handleResetPassword = async () => {
        if (!confirm('Reset password to default?')) return;
        setError('');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/patients/${patientId}/reset-password`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setLoginInfo(data.loginInfo);
            setShowDetails(true);
            setSuccess('Password reset!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setSuccess(`${label} copied!`);
        setTimeout(() => setSuccess(''), 2000);
    };

    if (loading) return <div className="p-4 bg-gray-50 rounded-xl animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2"></div></div>;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    <h3 className="font-semibold text-gray-900">Portal Login</h3>
                </div>
                {hasLogin ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">✓ Active</span>
                ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Not Created</span>
                )}
            </div>

            <div className="p-4">
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">✓ {success}</div>}

                {!hasLogin ? (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-4">{patientName} doesn't have portal access.</p>
                        <button onClick={handleCreateLogin} disabled={actionLoading}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {actionLoading ? 'Creating...' : '+ Create Portal Login'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button onClick={() => setShowDetails(!showDetails)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{showDetails ? 'Hide' : 'Show'} Login Details</span>
                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDetails && loginInfo && (
                            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-sm font-medium text-blue-800 mb-3">📋 Share with patient:</p>

                                {[
                                    { label: 'Email', value: loginInfo.email },
                                    { label: 'Phone', value: loginInfo.phone },
                                    { label: 'Patient ID', value: loginInfo.patientId },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500">{item.label}</p>
                                            <p className="font-mono text-sm font-medium">{item.value}</p>
                                        </div>
                                        <button onClick={() => copy(item.value, item.label)} className="p-1.5 hover:bg-gray-100 rounded">📋</button>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500">Password</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm font-bold">{showPassword ? loginInfo.defaultPassword : '••••••••••'}</p>
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500">{showPassword ? '🙈' : '👁️'}</button>
                                        </div>
                                    </div>
                                    <button onClick={() => copy(loginInfo.defaultPassword, 'Password')} className="p-1.5 hover:bg-gray-100 rounded">📋</button>
                                </div>

                                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800"><strong>Pattern:</strong> Last 4 of phone + Patient ID</p>
                                </div>
                            </div>
                        )}

                        <button onClick={handleResetPassword} disabled={actionLoading}
                                className="w-full px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium disabled:opacity-50">
                            🔄 Reset Password to Default
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}