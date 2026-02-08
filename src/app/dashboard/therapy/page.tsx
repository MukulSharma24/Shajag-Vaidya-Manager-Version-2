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

    const getTherapyIcon = (type: string) => {
        const icons: Record<string, string> = {
            VAMANA: '🤮',
            VIRECHANA: '💊',
            BASTI: '💧',
            NASYA: '👃',
            RAKTAMOKSHANA: '🩸',
        };
        return icons[type] || '🌿';
    };

    const getTherapyName = (type: string) => {
        const names: Record<string, string> = {
            VAMANA: 'Vamana',
            VIRECHANA: 'Virechana',
            BASTI: 'Basti',
            NASYA: 'Nasya',
            RAKTAMOKSHANA: 'Raktamokshana',
        };
        return names[type] || type;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800',
            COMPLETED: 'bg-blue-100 text-blue-800',
            CANCELLED: 'bg-red-100 text-red-800',
            PAUSED: 'bg-yellow-100 text-yellow-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (time: string) => {
        return time || '--';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading therapy plans...</p>
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
                            🌿 Panchakarma Therapy Management
                        </h1>
                        <p className="text-gray-600">Manage therapy plans and track patient progress</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/therapy/create')}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        New Therapy Plan
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <div className="flex gap-2">
                            {['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'ALL'].map(status => (
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

                {/* Plans List */}
                {plans.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">🧘</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No therapy plans found</h3>
                        <p className="text-gray-600 mb-6">Create your first therapy plan to get started</p>
                        <button
                            onClick={() => router.push('/dashboard/therapy/create')}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Create Therapy Plan
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
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {plan.patient.fullName}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(plan.status)}`}>
                                                    {plan.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>{plan.patient.age} yrs • {plan.patient.gender}</span>
                                                <span>📞 {plan.patient.phoneNumber}</span>
                                            </div>
                                            {plan.patient.constitutionType && (
                                                <div className="mt-2">
                                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                                        {plan.patient.constitutionType}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{plan.planNumber}</span>
                                    </div>

                                    {/* Therapy Types */}
                                    <div className="flex flex-wrap gap-2">
                                        {plan.therapyTypes.map(type => (
                                            <div
                                                key={type}
                                                className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-lg flex items-center gap-2"
                                            >
                                                <span className="text-lg">{getTherapyIcon(type)}</span>
                                                <span className="text-sm font-semibold text-teal-900">
                                                    {getTherapyName(type)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="p-6 bg-gray-50">
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Progress</span>
                                            <span className="text-sm font-bold text-teal-600">
                                                {plan.stats.completed}/{plan.stats.total} sessions ({plan.stats.percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all"
                                                style={{ width: `${plan.stats.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Next Session */}
                                    {plan.stats.nextSession && (
                                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Next Session</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {formatDate(plan.stats.nextSession.scheduledDate)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 mb-1">Time</p>
                                                    <p className="font-semibold text-teal-600">
                                                        {formatTime(plan.stats.nextSession.scheduledTime)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dates */}
                                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                                        <div>
                                            <span className="text-gray-500">Start:</span>{' '}
                                            <span className="font-medium">{formatDate(plan.startDate)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">End:</span>{' '}
                                            <span className="font-medium">{formatDate(plan.endDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className="text-gray-500">Total Amount:</span>{' '}
                                            <span className="text-lg font-bold text-gray-900">
                                                ₹{plan.totalAmount.toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/dashboard/therapy/plans/${plan.id}`)}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}