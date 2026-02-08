'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        role: '',
        username: '',
        password: ''
    });

    const roles = [
        { value: 'owner', label: 'Practice Owner', description: 'Full system access' },
        { value: 'doctor', label: 'Doctor', description: 'Clinical & patient management' },
        { value: 'patient', label: 'Patient', description: 'Personal records access' },
        { value: 'nurse', label: 'Nurse', description: 'Patient care & therapy' },
        { value: 'pharmacy', label: 'Pharmacy Staff', description: 'Inventory & prescriptions' },
        { value: 'assistant', label: 'Assistant', description: 'Appointments & admin' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('currentUser', formData.username);
        localStorage.setItem('currentRole', formData.role);
        router.push('/dashboard');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8 animate-fadeInUp">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Shajag Vaidya Manager</h1>
                    <p className="text-sm text-gray-500">Ayurvedic Clinic Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 animate-fadeInUp animate-delay-100">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to your account</h2>
                        <p className="text-sm text-gray-500">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div className="form-group">
                            <label htmlFor="role" className="form-label">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="form-select"
                            >
                                <option value="">Select your role</option>
                                {roles.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label} — {role.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Username */}
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Enter your username"
                                className="form-input"
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                                className="form-input"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full btn btn-primary btn-lg mt-6"
                        >
                            Sign in
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-500 animate-fadeInUp animate-delay-200">
                    <p>Version 3.0 • Multi-language Support • 50,000+ Medicines Database</p>
                </div>
            </div>
        </div>
    );
}