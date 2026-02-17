'use client';

// src/app/login/page.tsx

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_CREDENTIALS = [
    { role: 'OWNER',   label: 'Admin / Owner',   email: 'admin@clinic.com',   color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { role: 'DOCTOR',  label: 'Doctor',           email: 'doctor@clinic.com',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { role: 'STAFF',   label: 'Staff',            email: 'staff@clinic.com',   color: 'bg-green-100 text-green-800 border-green-200' },
    { role: 'PATIENT', label: 'Patient',          email: 'patient@clinic.com', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // AuthContext handles redirect based on role
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('password123');
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Shajag Vaidya Manager</h1>
                    <p className="text-sm text-gray-500">Ayurvedic Clinic Management System</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to your account</h2>
                    <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in…
                                </>
                            ) : (
                                <>Sign in →</>
                            )}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Demo Accounts — click to fill
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_CREDENTIALS.map(({ role, label, email: demoEmail, color }) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => fillCredentials(demoEmail)}
                                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-opacity hover:opacity-80 ${color}`}
                                >
                                    <span className="block font-semibold">{label}</span>
                                    <span className="block truncate opacity-70">{demoEmail}</span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-400 text-center">
                            All accounts use password: <code className="font-mono bg-gray-100 px-1 rounded">password123</code>
                        </p>
                        <p className="mt-1 text-xs text-gray-400 text-center">
                            Patients are redirected to <strong>/patient-portal</strong>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Version 3.0 • Multi-language Support • 50,000+ Medicines Database
                </p>
            </div>
        </div>
    );
}