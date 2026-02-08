'use client';

import React, { useEffect, useState } from 'react';

interface Appointment {
    id: string;
    patientName: string;
    time: string;
    type: string;
    status: string;
}

export default function TodaysAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodaysAppointments();

        // Refresh appointments every 30 seconds for real-time updates
        const interval = setInterval(() => {
            loadTodaysAppointments();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadTodaysAppointments = async () => {
        try {
            const response = await fetch('/api/dashboard/appointments');

            if (response.ok) {
                const data = await response.json();
                setAppointments(data);
            } else {
                console.error('Failed to fetch appointments');
                setAppointments([]);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        // Navigate to appointments page
        window.location.href = '/dashboard/appointments';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Today's Appointments</h2>
                <button
                    onClick={handleViewAll}
                    className="px-4 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition"
                >
                    View All
                </button>
            </div>

            {/* Appointments List or Empty State */}
            {appointments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        No appointments scheduled for today
                    </h3>
                    <p className="text-gray-600 text-sm">
                        All clear for today! Check back later or schedule new appointments.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-700 font-semibold">
                                        {appointment.patientName.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">{appointment.patientName}</h4>
                                    <p className="text-sm text-gray-600">{appointment.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-800">{appointment.time}</p>
                                <span className={`
                                    inline-block px-2 py-1 text-xs font-medium rounded-full
                                    ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : ''}
                                    ${appointment.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                                `}>
                                    {appointment.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}