'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
    roles: string[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState('owner');
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('currentRole') || 'owner';
        setUserRole(role);

        // Load collapsed state from localStorage
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            setIsCollapsed(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    const navItems: NavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
            href: '/dashboard',
            roles: ['owner', 'doctor', 'nurse', 'pharmacy', 'assistant']
        },
        {
            id: 'appointments',
            label: 'Appointments',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            href: '/dashboard/appointments',
            roles: ['owner', 'doctor', 'assistant']
        },
        {
            id: 'patients',
            label: 'Patients',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            href: '/dashboard/patients',
            roles: ['owner', 'doctor', 'nurse']
        },
        {
            id: 'prescriptions',
            label: 'Prescriptions',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            href: '/dashboard/prescriptions',
            roles: ['owner', 'doctor']
        },
        {
            id: 'pharmacy',
            label: 'Pharmacy',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
            href: '/dashboard/pharmacy',
            roles: ['owner', 'doctor', 'pharmacy']
        },
        {
            id: 'therapy',
            label: 'Therapy',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
            href: '/dashboard/therapy',
            roles: ['owner', 'doctor', 'nurse']
        },
        {
            id: 'diet',
            label: 'Diet Plans',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
            href: '/dashboard/diet',
            roles: ['owner', 'doctor']
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            href: '/dashboard/reports',
            roles: ['owner', 'doctor']
        },
        {
            id: 'communication',
            label: 'Communication',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
            href: '/dashboard/communication',
            roles: ['owner', 'doctor', 'assistant']
        },
        {
            id: 'staff',
            label: 'Staff Management',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
            href: '/dashboard/staff',
            roles: ['owner']
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            href: '/dashboard/billing',
            roles: ['owner', 'assistant']
        }
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-30
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-16' : 'w-64'}
                `}
            >
                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm z-50"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        className={`w-3 h-3 text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Navigation */}
                <nav className="h-full overflow-y-auto py-4 scrollbar-hide">
                    <ul className="space-y-1 px-3">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                            transition-all duration-200 group relative
                                            ${isActive
                                            ? 'bg-teal-50 text-teal-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                        `}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <span className={`flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                            {item.icon}
                                        </span>
                                        <span
                                            className={`
                                                whitespace-nowrap transition-all duration-300
                                                ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                                            `}
                                        >
                                            {item.label}
                                        </span>

                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed && (
                                            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Spacer to prevent content overlap */}
            <div className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
        </>
    );
}