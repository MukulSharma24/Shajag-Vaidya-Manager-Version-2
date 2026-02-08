'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState('admin');
    const [currentRole, setCurrentRole] = useState('Practice Owner');
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    useEffect(() => {
        const user = localStorage.getItem('currentUser') || 'admin';
        const role = localStorage.getItem('currentRole') || 'owner';
        setCurrentUser(user);

        const roleMap: { [key: string]: string } = {
            'owner': 'Practice Owner',
            'doctor': 'Doctor',
            'patient': 'Patient',
            'nurse': 'Nurse',
            'pharmacy': 'Pharmacy Staff',
            'assistant': 'Assistant'
        };
        setCurrentRole(roleMap[role] || 'Practice Owner');
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        router.push('/');
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिंदी' },
        { code: 'sa', name: 'संस्कृत' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'kn', name: 'ಕನ್ನಡ' }
    ];

    return (
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="w-full px-6 h-16">
                <div className="flex items-center justify-between h-full">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900">Shajag Vaidya Manager</h1>
                                <p className="text-xs text-gray-500">Ayurvedic Clinic Management</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Language Selector */}
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="text-sm border-0 bg-transparent text-gray-700 focus:outline-none focus:ring-0 pr-8 cursor-pointer font-medium"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-200"></div>

                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">{currentUser}</div>
                                <div className="text-xs text-gray-500">{currentRole}</div>
                            </div>
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-gray-600">
                                    {currentUser.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}