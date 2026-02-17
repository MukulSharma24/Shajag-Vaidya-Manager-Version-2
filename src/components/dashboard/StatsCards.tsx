'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatCardData {
    id: string;
    icon: React.ReactNode;
    count: number | string | null; // null = hidden for this role
    label: string;
    gradientFrom: string;
    gradientTo: string;
    iconBg: string;
    clickable?: boolean;
    route?: string;
}

// Professional SVG Icons
const Icons = {
    Users: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Medicine: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    Therapy: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    Staff: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    Revenue: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// Card definitions — count starts as 0, gets replaced by API
// null count = hidden (set by API for restricted roles)
const CARD_DEFINITIONS: Omit<StatCardData, 'count'>[] = [
    {
        id: 'totalPatients',
        icon: <Icons.Users />,
        label: 'Total Patients',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-blue-600',
        iconBg: 'bg-blue-500',
        clickable: true,
        route: '/dashboard/patients',
    },
    {
        id: 'todayAppointments',
        icon: <Icons.Calendar />,
        label: "Today's Appointments",
        gradientFrom: 'from-purple-500',
        gradientTo: 'to-purple-600',
        iconBg: 'bg-purple-500',
        clickable: true,
        route: '/dashboard/appointments',
    },
    {
        id: 'medicinesStock',
        icon: <Icons.Medicine />,
        label: 'Medicines in Stock',
        gradientFrom: 'from-green-500',
        gradientTo: 'to-green-600',
        iconBg: 'bg-green-500',
        clickable: true,
        route: '/dashboard/pharmacy',
    },
    {
        id: 'therapyAssignments',
        icon: <Icons.Therapy />,
        label: 'Active Therapy Plans',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-orange-600',
        iconBg: 'bg-orange-500',
        clickable: true,
        route: '/dashboard/therapy',
    },
    {
        id: 'totalStaff',
        icon: <Icons.Staff />,
        label: 'Present Today',          // Changed from "Total Staff"
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-indigo-600',
        iconBg: 'bg-indigo-500',
        clickable: true,
        route: '/dashboard/staff',
    },
    {
        id: 'totalRevenue',
        icon: <Icons.Revenue />,
        label: 'Revenue This Month',     // More accurate label
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-600',
        iconBg: 'bg-emerald-500',
        clickable: true,
        route: '/dashboard/billing',
    },
];

export default function StatsCards() {
    const router = useRouter();
    const [stats, setStats] = useState<Record<string, number | string | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Only render cards where the API returned a non-null value
    const visibleCards = CARD_DEFINITIONS.filter(card => {
        // During loading show all as skeleton
        if (loading) return true;
        // null means "hidden for this role"
        return stats[card.id] !== null && stats[card.id] !== undefined;
    });

    const getCount = (id: string): number | string => {
        const val = stats[id];
        if (val === null || val === undefined) return 0;
        return val;
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mb-3" />
                        <div className="h-6 bg-gray-200 rounded w-12 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                ))}
            </div>
        );
    }

    // Dynamic grid cols based on how many cards are visible
    const gridCols =
        visibleCards.length <= 2 ? 'xl:grid-cols-2' :
            visibleCards.length === 3 ? 'xl:grid-cols-3' :
                visibleCards.length === 4 ? 'xl:grid-cols-4' :
                    visibleCards.length === 5 ? 'xl:grid-cols-5' :
                        'xl:grid-cols-6';

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridCols} gap-5 mb-8`}>
            {visibleCards.map((card) => (
                <div
                    key={card.id}
                    onClick={() => card.clickable && card.route && router.push(card.route)}
                    className={`
                        group relative bg-white rounded-xl shadow-sm border border-gray-100 p-5
                        transition-all duration-300 overflow-hidden
                        ${card.clickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-transparent' : ''}
                    `}
                >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                    <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.iconBg} bg-opacity-20 group-hover:scale-105 transition-transform duration-300`}>
                                <div className={`${card.iconBg.replace('bg-', 'text-')}`}>
                                    {card.icon}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {getCount(card.id)}
                        </h3>
                        <p className="text-xs text-gray-600 font-medium">{card.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}