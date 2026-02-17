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

interface TherapyPlan {
    id: string;
    planNumber: string;
    patient: Patient;
    therapyTypes: string[];
    startDate: string;
    endDate: string;
    totalSessions: number;
    status: string;
    pricePerSession: number;
    totalAmount: number;
    stats: {
        completed: number;
        total: number;
        percentage: number;
        nextSession: any;
    };
}

const THERAPY_NAMES: Record<string, string> = {
    VAMANA: 'Vamana',
    VIRECHANA: 'Virechana',
    BASTI: 'Basti',
    NASYA: 'Nasya',
    RAKTAMOKSHANA: 'Raktamokshana',
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border border-blue-200',
    CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
    PAUSED: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
};

export default function TherapyPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<TherapyPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ACTIVE');

    useEffect(() => {
        fetchPlans();
    }, [statusFilter]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/therapy/plans?status=${statusFilter}`);
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading therapy plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Therapy Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage Panchakarma therapy plans and track progress</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/therapy/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <span>+</span>
                        New Therapy Plan
                    </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 mb-6">
                    {['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'ALL'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Plans */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                        <p className="text-4xl mb-3">🧘</p>
                        <h3 className="text-base font-semibold text-gray-800 mb-1">No therapy plans found</h3>
                        <p className="text-sm text-gray-500 mb-5">Create your first therapy plan to get started</p>
                        <button
                            onClick={() => router.push('/dashboard/therapy/create')}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Create Therapy Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-gray-900">
                                                    {plan.patient.fullName}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[plan.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                                    {plan.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {plan.patient.age} yrs · {plan.patient.gender} · {plan.patient.phoneNumber}
                                            </p>
                                            {plan.patient.constitutionType && (
                                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                                                    {plan.patient.constitutionType}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{plan.planNumber}</span>
                                    </div>

                                    {/* Therapy Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {plan.therapyTypes.map(type => (
                                            <span
                                                key={type}
                                                className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-md text-xs font-medium"
                                            >
                                                {THERAPY_NAMES[type] || type}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                        <span>Progress</span>
                                        <span className="font-medium text-gray-700">
                                            {plan.stats.completed}/{plan.stats.total} sessions ({plan.stats.percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="h-full bg-teal-500 rounded-full transition-all"
                                            style={{ width: `${Math.min(plan.stats.percentage, 100)}%` }}
                                        />
                                    </div>

                                    {plan.stats.nextSession && (
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Next session</span>
                                            <span className="font-medium text-gray-700">
                                                {formatDate(plan.stats.nextSession.scheduledDate)}
                                                {plan.stats.nextSession.scheduledTime && ` · ${plan.stats.nextSession.scheduledTime}`}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <span>{formatDate(plan.startDate)}</span>
                                        <span>{formatDate(plan.endDate)}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-400">Total Amount</span>
                                        <p className="text-base font-semibold text-gray-900">₹{plan.totalAmount.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/dashboard/therapy/plans/${plan.id}`)}
                                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
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