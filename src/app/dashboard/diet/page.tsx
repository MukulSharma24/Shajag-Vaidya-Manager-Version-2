'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
    id: string;
    fullName: string;
    phoneNumber: string;
    age: number;
    gender: string;
    constitutionType: string;
}

interface DietPlan {
    id: string;
    planNumber: string;
    patient: Patient;
    constitution: string;
    season: string;
    status: string;
    createdAt: string;
    compliance: string;
}

export default function DietPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<DietPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ACTIVE');

    useEffect(() => {
        fetchPlans();
    }, [statusFilter]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/diet/plans?status=${statusFilter}`);
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
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

    const getComplianceColor = (compliance: string) => {
        const colors: Record<string, string> = {
            FOLLOWING: 'bg-green-100 text-green-800',
            PARTIAL: 'bg-yellow-100 text-yellow-800',
            NOT_FOLLOWING: 'bg-red-100 text-red-800',
            NOT_ASSESSED: 'bg-gray-100 text-gray-800',
        };
        return colors[compliance] || 'bg-gray-100 text-gray-800';
    };

    const getDaysOld = (createdAt: string) => {
        const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return days === 0 ? 'Today' : days === 1 ? '1 day old' : `${days} days old`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading diet plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            🍽️ Diet Management
                        </h1>
                        <p className="text-gray-600">Constitution-based personalized diet plans</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/diet/create')}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        Create Diet Plan
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <div className="flex gap-2">
                            {['ACTIVE', 'ARCHIVED', 'ALL'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">🥗</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No diet plans found</h3>
                        <p className="text-gray-600 mb-6">Create your first diet plan to get started</p>
                        <button
                            onClick={() => router.push('/dashboard/diet/create')}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Create Diet Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {plan.patient.fullName}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <span>{plan.patient.age} yrs • {plan.patient.gender}</span>
                                                <span>📞 {plan.patient.phoneNumber}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{plan.planNumber}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg flex items-center gap-2">
                                            <span className="text-lg">{getConstitutionIcon(plan.constitution)}</span>
                                            <span className="text-sm font-semibold text-purple-900">{plan.constitution}</span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-lg flex items-center gap-2">
                                            <span className="text-lg">{getSeasonIcon(plan.season)}</span>
                                            <span className="text-sm font-semibold text-blue-900">{plan.season}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 bg-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Compliance Status</p>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getComplianceColor(plan.compliance)}`}>
                                                {plan.compliance.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">Created</p>
                                            <p className="text-sm font-medium text-gray-900">{getDaysOld(plan.createdAt)}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => router.push(`/dashboard/diet/plans/${plan.id}`)}
                                        className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}