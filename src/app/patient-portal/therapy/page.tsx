// src/app/patient-portal/therapy/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientTherapyPage() {
    const { user } = useAuth();
    const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTherapyPlans();
    }, [user?.patientId]);

    const fetchTherapyPlans = async () => {
        try {
            if (!user?.patientId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/therapy/plans?patientId=${user.patientId}`);
            if (res.ok) {
                const data = await res.json();
                setTherapyPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching therapy plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTherapyIcon = (type: string) => {
        const icons: Record<string, string> = {
            'VAMANA': '💨',
            'VIRECHANA': '🌿',
            'BASTI': '💧',
            'NASYA': '👃',
            'RAKTAMOKSHANA': '🩸',
            'ABHYANGA': '🖐️',
            'SHIRODHARA': '💆',
        };
        return icons[type] || '💆';
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Therapy Sessions</h1>
                <p className="text-gray-600">Track your Panchakarma and therapy progress</p>
            </div>

            {therapyPlans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">💆</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapy plans</h3>
                    <p className="text-gray-600">
                        Your therapy plans will appear here once prescribed by your doctor.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {therapyPlans.map((plan) => {
                        const completedSessions = plan.sessions?.filter((s: any) => s.status === 'COMPLETED').length || 0;
                        const totalSessions = plan.totalSessions || 0;
                        const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

                        return (
                            <div
                                key={plan.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                            >
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    Plan #{plan.planNumber}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    plan.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : plan.status === 'COMPLETED'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {plan.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Therapy Types */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {plan.therapyTypes?.map((type: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1"
                                            >
                                                {getTherapyIcon(type)} {type}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-2">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="font-medium text-gray-900">
                                                {completedSessions}/{totalSessions} sessions
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sessions */}
                                {plan.sessions && plan.sessions.length > 0 && (
                                    <div className="p-5">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Sessions</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {plan.sessions.map((session: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg text-center ${
                                                        session.status === 'COMPLETED'
                                                            ? 'bg-green-50 border border-green-200'
                                                            : session.status === 'SCHEDULED'
                                                                ? 'bg-blue-50 border border-blue-200'
                                                                : 'bg-gray-50 border border-gray-200'
                                                    }`}
                                                >
                                                    <p className="text-xs text-gray-500 mb-1">Session {session.sessionNumber}</p>
                                                    <p className="text-sm font-medium">
                                                        {formatDate(session.scheduledDate)}
                                                    </p>
                                                    <p className={`text-xs mt-1 ${
                                                        session.status === 'COMPLETED'
                                                            ? 'text-green-600'
                                                            : session.status === 'SCHEDULED'
                                                                ? 'text-blue-600'
                                                                : 'text-gray-600'
                                                    }`}>
                                                        {session.status}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {plan.instructions && (
                                    <div className="px-5 pb-5">
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-xs text-amber-700 font-medium mb-1">Instructions</p>
                                            <p className="text-sm text-amber-900">{plan.instructions}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}