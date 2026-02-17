// src/app/patient-portal/diet/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientDietPage() {
    const { user } = useAuth();
    const [dietPlans, setDietPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePlan, setActivePlan] = useState<any>(null);

    useEffect(() => {
        fetchDietPlans();
    }, [user?.patientId]);

    const fetchDietPlans = async () => {
        try {
            if (!user?.patientId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/diet/plans?patientId=${user.patientId}`);
            if (res.ok) {
                const data = await res.json();
                const plans = data.plans || [];
                setDietPlans(plans);
                setActivePlan(plans.find((p: any) => p.status === 'ACTIVE'));
            }
        } catch (error) {
            console.error('Error fetching diet plans:', error);
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

    const parseMeal = (mealJson: string) => {
        try {
            return JSON.parse(mealJson);
        } catch {
            return [];
        }
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
                <h1 className="text-2xl font-bold text-gray-900">My Diet Plan</h1>
                <p className="text-gray-600">Your personalized Ayurvedic diet recommendations</p>
            </div>

            {!activePlan ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No active diet plan</h3>
                    <p className="text-gray-600">
                        Your diet plan will appear here once created by your doctor.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Plan Overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                                {activePlan.constitution} Constitution
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                {activePlan.season} Season
                            </span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                Active
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Plan #{activePlan.planNumber} • Created on {formatDate(activePlan.createdAt)}
                        </p>
                    </div>

                    {/* Meals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Morning */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">☀️</span>
                                <div>
                                    <h3 className="font-semibold text-amber-900">Morning</h3>
                                    <p className="text-xs text-amber-700">6:00 - 8:00 AM</p>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {parseMeal(activePlan.morningMeal).map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                                        <span className="text-amber-500 mt-1">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Lunch */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🍽️</span>
                                <div>
                                    <h3 className="font-semibold text-orange-900">Lunch</h3>
                                    <p className="text-xs text-orange-700">12:00 - 1:00 PM</p>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {parseMeal(activePlan.lunchMeal).map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-900">
                                        <span className="text-orange-500 mt-1">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Evening */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🌙</span>
                                <div>
                                    <h3 className="font-semibold text-indigo-900">Evening</h3>
                                    <p className="text-xs text-indigo-700">6:00 - 7:00 PM</p>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {parseMeal(activePlan.eveningMeal).map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-900">
                                        <span className="text-indigo-500 mt-1">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Guidelines & Restrictions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePlan.guidelines && (
                            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <span>✅</span> Guidelines
                                </h3>
                                <p className="text-sm text-green-800 whitespace-pre-line">{activePlan.guidelines}</p>
                            </div>
                        )}

                        {activePlan.restrictions && (
                            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                    <span>❌</span> Avoid
                                </h3>
                                <p className="text-sm text-red-800 whitespace-pre-line">{activePlan.restrictions}</p>
                            </div>
                        )}
                    </div>

                    {/* Follow-up */}
                    {activePlan.followUpDate && (
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📅</span>
                                <div>
                                    <p className="font-medium text-blue-900">Follow-up Date</p>
                                    <p className="text-sm text-blue-700">{formatDate(activePlan.followUpDate)}</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                Book Appointment
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Past Diet Plans */}
            {dietPlans.filter(p => p.status !== 'ACTIVE').length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Diet Plans</h2>
                    <div className="space-y-3">
                        {dietPlans.filter(p => p.status !== 'ACTIVE').map((plan) => (
                            <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Plan #{plan.planNumber}</p>
                                    <p className="text-sm text-gray-600">
                                        {plan.constitution} • {plan.season} • {formatDate(plan.createdAt)}
                                    </p>
                                </div>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                    {plan.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}