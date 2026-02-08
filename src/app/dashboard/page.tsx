'use client';

import React from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import TodaysAppointments from '@/components/dashboard/TodaysAppointments';
import ChartsSection from '@/components/dashboard/ChartsSection';

export default function DashboardPage() {
    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
                        <p className="text-sm text-gray-500">Monitor your clinic's performance and key metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Date Range Selector */}
                        <select className="form-select text-sm">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                        <button className="btn btn-primary btn-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="mb-8">
                <StatsCards />
            </div>

            {/* Today's Appointments Section */}
            <div className="mb-8">
                <TodaysAppointments />
            </div>

            {/* Charts Section */}
            <ChartsSection />
        </div>
    );
}