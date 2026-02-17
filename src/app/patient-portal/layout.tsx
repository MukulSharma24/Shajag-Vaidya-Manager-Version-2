// src/app/patient-portal/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function PatientPortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pendingActions, setPendingActions] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isLoginPage = pathname === '/patient-portal/login';

    useEffect(() => {
        if (!isLoginPage) {
            checkAuth();
            fetchPendingCount();
        } else {
            setLoading(false);
        }
    }, [pathname]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) { router.push('/patient-portal/login'); return; }
            const data = await res.json();
            if (data.user.role !== 'PATIENT') { router.push('/dashboard'); return; }
            setPatient(data.user);
        } catch { router.push('/patient-portal/login'); }
        finally { setLoading(false); }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await fetch('/api/appointments/pending-count');
            if (res.ok) {
                const data = await res.json();
                setPendingActions(data.pendingActions || 0);
            }
        } catch {}
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/patient-portal/login');
    };

    // Skip layout for login page
    if (isLoginPage) return <>{children}</>;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-600 border-t-transparent"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/patient-portal', label: 'Dashboard', icon: DashboardIcon, badge: 0 },
        { href: '/patient-portal/appointments', label: 'Appointments', icon: CalendarIcon, badge: pendingActions },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/patient-portal" className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-semibold text-gray-900 text-sm leading-none">Shajag Vaidya</p>
                                <p className="text-xs text-gray-500 mt-0.5">Patient Portal</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive(item.href)
                                                ? 'bg-teal-50 text-teal-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                        {/* Only show badge if > 0 */}
                                        {item.badge > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-4">
                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{patient?.name}</p>
                                    <p className="text-xs text-gray-500">Patient</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {patient?.name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Log out
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white">
                        <div className="px-4 py-2 space-y-1">
                            {navItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                            isActive(item.href)
                                                ? 'bg-teal-50 text-teal-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                        {/* Only show badge if > 0 */}
                                        {item.badge > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>

            {/* Notification Banner */}
            {pendingActions > 0 && (
                <div className="bg-blue-50 border-b border-blue-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
                        <Link
                            href="/patient-portal/appointments"
                            className="flex items-center justify-center gap-2 text-sm text-blue-700 hover:text-blue-800"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="font-medium">
                                You have {pendingActions} appointment{pendingActions > 1 ? 's' : ''} awaiting your response
                            </span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <p className="text-center text-xs text-gray-500">
                        Shajag Vaidya Clinic · Patient Portal · Need help?{' '}
                        <a href="tel:+91" className="text-teal-600 hover:text-teal-700 font-medium">
                            Contact us
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DashboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}