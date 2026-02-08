'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TherapyPlan {
    id: string;
    planNumber: string;
    patient: any;
    therapyTypes: string[];
    startDate: string;
    endDate: string;
    totalSessions: number;
    frequency: string;
    status: string;
    pricePerSession: number;
    totalAmount: number;
    notes: string;
    instructions: string;
    sessions: TherapySession[];
    bill: any;
    stats: {
        completed: number;
        upcoming: number;
        missed: number;
        total: number;
        percentage: number;
    };
}

interface TherapySession {
    id: string;
    sessionNumber: number;
    therapyType: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    completedAt?: string;
    duration?: number;
    observations?: string;
}

export default function TherapyPlanDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [plan, setPlan] = useState<TherapyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<TherapySession | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const res = await fetch(`/api/therapy/plans/${params.id}`);
            const data = await res.json();
            setPlan(data.plan);
        } catch (error) {
            console.error('Error fetching plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const markSessionComplete = async (sessionId: string) => {
        try {
            const duration = prompt('Enter session duration in minutes:', '60');
            if (!duration) return;

            const observations = prompt('Any observations? (Optional)');

            const res = await fetch(`/api/therapy/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'COMPLETED',
                    duration: parseInt(duration),
                    observations: observations || '',
                }),
            });

            if (res.ok) {
                alert('Session marked as completed!');
                fetchPlan();
            }
        } catch (error) {
            console.error('Error updating session:', error);
        }
    };

    const createBillForPlan = async () => {
        if (!plan) return;

        const confirm = window.confirm(
            `Create bill for ₹${plan.totalAmount.toLocaleString()}?\n\nThis will bill ${plan.stats.completed} completed sessions.`
        );

        if (!confirm) return;

        try {
            // Create bill
            const billData = {
                patientId: plan.patient.id,
                billItems: plan.therapyTypes.map(type => ({
                    itemName: `${type} Therapy`,
                    itemType: 'THERAPY',
                    quantity: plan.stats.completed,
                    unitPrice: plan.pricePerSession,
                    taxPercentage: 0,
                })),
                notes: `Therapy Plan: ${plan.planNumber}`,
                status: 'PENDING',
            };

            const res = await fetch('/api/billing/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(billData),
            });

            if (res.ok) {
                const data = await res.json();

                // Link bill to plan
                await fetch(`/api/therapy/plans/${plan.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ billId: data.bill.id }),
                });

                alert('Bill created successfully!');
                router.push(`/dashboard/billing`);
            }
        } catch (error) {
            console.error('Error creating bill:', error);
            alert('Failed to create bill');
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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            SCHEDULED: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            MISSED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading therapy plan...</p>
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

    const upcomingSessions = plan.sessions.filter(
        s => s.status === 'SCHEDULED' && new Date(s.scheduledDate) >= new Date()
    );
    const completedSessions = plan.sessions.filter(s => s.status === 'COMPLETED');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button onClick={() => router.back()} className="text-teal-600 hover:underline mb-4 flex items-center gap-2">
                        ← Back to Plans
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
                            <div className="mt-2 flex items-center gap-3">
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                                    {plan.patient.constitutionType}
                                </span>
                                <span className="text-sm text-gray-500">Plan: {plan.planNumber}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            {!plan.bill && plan.stats.completed > 0 && (
                                <button
                                    onClick={createBillForPlan}
                                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mb-2"
                                >
                                    💰 Create Bill
                                </button>
                            )}
                            {plan.bill && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-sm text-green-700 mb-1">✓ Billed</p>
                                    <p className="font-bold text-green-900">{plan.bill.billNumber}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Progress & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Progress Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Progress</h2>
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Completion</span>
                                    <span className="text-lg font-bold text-teal-600">
                                        {plan.stats.percentage.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all"
                                        style={{ width: `${plan.stats.percentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{plan.stats.completed}</p>
                                    <p className="text-xs text-gray-600">Completed</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{plan.stats.upcoming}</p>
                                    <p className="text-xs text-gray-600">Upcoming</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{plan.stats.missed}</p>
                                    <p className="text-xs text-gray-600">Missed</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900">{plan.stats.total}</p>
                                    <p className="text-xs text-gray-600">Total</p>
                                </div>
                            </div>
                        </div>

                        {/* Therapy Types */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Therapies</h2>
                            <div className="space-y-2">
                                {plan.therapyTypes.map(type => (
                                    <div key={type} className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg">
                                        <span className="text-2xl">{getTherapyIcon(type)}</span>
                                        <span className="font-semibold text-gray-900">{type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Plan Details</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Start Date:</span>
                                    <span className="font-semibold">{formatDate(plan.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">End Date:</span>
                                    <span className="font-semibold">{formatDate(plan.endDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Frequency:</span>
                                    <span className="font-semibold">{plan.frequency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Per Session:</span>
                                    <span className="font-semibold">₹{plan.pricePerSession}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t">
                                    <span className="text-gray-900 font-bold">Total Amount:</span>
                                    <span className="text-xl font-bold text-teal-600">₹{plan.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {plan.instructions && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Instructions:</p>
                                    <p className="text-sm text-gray-600">{plan.instructions}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sessions */}
                    <div className="lg:col-span-2">
                        {/* Upcoming Sessions */}
                        {upcomingSessions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Upcoming Sessions</h2>
                                <div className="space-y-3">
                                    {upcomingSessions.slice(0, 5).map(session => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{getTherapyIcon(session.therapyType)}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        Session #{session.sessionNumber} - {session.therapyType}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(session.scheduledDate)} • {session.scheduledTime || 'Time TBD'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => markSessionComplete(session.id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                ✓ Mark Done
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Sessions */}
                        {completedSessions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Completed Sessions</h2>
                                <div className="space-y-2">
                                    {completedSessions.map(session => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{getTherapyIcon(session.therapyType)}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        Session #{session.sessionNumber} - {session.therapyType}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {formatDate(session.scheduledDate)}
                                                        {session.duration && ` • ${session.duration} mins`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-green-600 text-xl">✓</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}