'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DietPlan {
    id: string;
    planNumber: string;
    patient: any;
    constitution: string;
    season: string;
    status: string;
    morningMeal: string;
    lunchMeal: string;
    eveningMeal: string;
    guidelines: string;
    restrictions: string;
    notes: string;
    compliance: string;
    createdAt: string;
}

export default function DietPlanDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [plan, setPlan] = useState<DietPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const res = await fetch(`/api/diet/plans/${params.id}`);
            const data = await res.json();
            setPlan(data.plan);
        } catch (error) {
            console.error('Error fetching plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCompliance = async (compliance: string) => {
        try {
            const res = await fetch(`/api/diet/plans/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ compliance }),
            });

            if (res.ok) {
                alert('Compliance updated!');
                fetchPlan();
            }
        } catch (error) {
            console.error('Error updating compliance:', error);
        }
    };

    const editPlan = () => {
        router.push(`/dashboard/diet/plans/${params.id}/edit`);
    };

    const deletePlan = async () => {
        if (!confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/diet/plans/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Diet plan deleted successfully!');
                router.push('/dashboard/diet');
            } else {
                alert('Failed to delete diet plan');
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Failed to delete diet plan');
        }
    };

    const archivePlan = async () => {
        if (!confirm('Archive this diet plan?')) return;

        try {
            const res = await fetch(`/api/diet/plans/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ARCHIVED' }),
            });

            if (res.ok) {
                alert('Plan archived!');
                router.push('/dashboard/diet');
            }
        } catch (error) {
            console.error('Error archiving plan:', error);
        }
    };

    const getConstitutionIcon = (constitution: string) => {
        const icons: Record<string, string> = {
            VATA: '💨',
            PITTA: '🔥',
            KAPHA: '🌊',
            TRIDOSHA: '⚖️',
        };
        return icons[constitution] || '🍽️';
    };

    const getSeasonIcon = (season: string) => {
        const icons: Record<string, string> = {
            SPRING: '🌸',
            SUMMER: '☀️',
            MONSOON: '🌧️',
            AUTUMN: '🍂',
            WINTER: '❄️',
        };
        return icons[season] || '🌿';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading diet plan...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-900 mb-2">Plan not found</p>
                    <button onClick={() => router.back()} className="text-teal-600 hover:underline">
                        ← Go back
                    </button>
                </div>
            </div>
        );
    }

    const morningMeal = JSON.parse(plan.morningMeal);
    const lunchMeal = JSON.parse(plan.lunchMeal);
    const eveningMeal = JSON.parse(plan.eveningMeal);
    const guidelines = plan.guidelines ? plan.guidelines.split('\n') : [];
    const restrictions = plan.restrictions ? plan.restrictions.split('\n') : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button onClick={() => router.back()} className="text-teal-600 hover:underline mb-4 flex items-center gap-2">
                        ← Back to Diet Plans
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.patient.fullName}</h1>
                            <div className="flex items-center gap-4 text-gray-600">
                                <span>{plan.patient.age} yrs</span>
                                <span>•</span>
                                <span>{plan.patient.gender}</span>
                                <span>•</span>
                                <span>📞 {plan.patient.phoneNumber}</span>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg flex items-center gap-2">
                                    <span className="text-xl">{getConstitutionIcon(plan.constitution)}</span>
                                    <span className="text-sm font-semibold text-purple-900">{plan.constitution}</span>
                                </div>
                                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-lg flex items-center gap-2">
                                    <span className="text-xl">{getSeasonIcon(plan.season)}</span>
                                    <span className="text-sm font-semibold text-blue-900">{plan.season}</span>
                                </div>
                                <span className="text-sm text-gray-500">Plan: {plan.planNumber}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={editPlan}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={deletePlan}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                ️ Delete
                            </button>
                            <button
                                onClick={archivePlan}
                                className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors"
                            >
                                 Archive
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                            >
                                📄 Print PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Meals */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Morning Meal */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                                <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                                    ☀️ Morning (6-8 AM)
                                </h2>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-3">
                                    {morningMeal.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span className="text-gray-800">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Lunch Meal */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                                <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                                    🍽️ Lunch (12-1 PM)
                                </h2>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-3">
                                    {lunchMeal.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-orange-500 mt-1">•</span>
                                            <span className="text-gray-800">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Evening Meal */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
                                <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    🌙 Evening (6-7 PM)
                                </h2>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-3">
                                    {eveningMeal.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-indigo-500 mt-1">•</span>
                                            <span className="text-gray-800">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Guidelines & Compliance */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Compliance Tracking */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Compliance Status</h2>
                            <div className="space-y-2">
                                {['FOLLOWING', 'PARTIAL', 'NOT_FOLLOWING'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => updateCompliance(status)}
                                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            plan.compliance === status
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {status === 'FOLLOWING' && '🟢'}
                                        {status === 'PARTIAL' && '🟡'}
                                        {status === 'NOT_FOLLOWING' && '🔴'}
                                        {' '}
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guidelines */}
                        {guidelines.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    ✓ Guidelines
                                </h2>
                                <ul className="space-y-2">
                                    {guidelines.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-green-500 mt-0.5">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Restrictions */}
                        {restrictions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    ✗ Restrictions
                                </h2>
                                <ul className="space-y-2">
                                    {restrictions.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-red-500 mt-0.5">✗</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Notes */}
                        {plan.notes && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="font-bold text-gray-900 mb-4">Notes</h2>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}