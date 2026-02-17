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

const THERAPY_NAMES: Record<string, string> = {
    VAMANA: 'Vamana', VIRECHANA: 'Virechana', BASTI: 'Basti',
    NASYA: 'Nasya', RAKTAMOKSHANA: 'Raktamokshana',
};

const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
    COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
    MISSED: 'bg-red-50 text-red-700 border border-red-200',
    CANCELLED: 'bg-gray-50 text-gray-600 border border-gray-200',
    ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
};

export default function TherapyPlanDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [plan, setPlan] = useState<TherapyPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPlan(); }, []);

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
                body: JSON.stringify({ status: 'COMPLETED', duration: parseInt(duration), observations: observations || '' }),
            });
            if (res.ok) { alert('Session marked as completed!'); fetchPlan(); }
        } catch (error) { console.error('Error updating session:', error); }
    };

    const deletePlan = async () => {
        if (!confirm('Are you sure you want to delete this therapy plan? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/therapy/plans/${params.id}`, { method: 'DELETE' });
            if (res.ok) { alert('Therapy plan deleted successfully!'); router.push('/dashboard/therapy'); }
            else alert('Failed to delete therapy plan');
        } catch (error) { alert('Failed to delete therapy plan'); }
    };

    // FIX: Always allow creating a new bill for any completed sessions.
    // The plan can accumulate multiple bills over time as sessions complete.
    const createBillForPlan = async () => {
        if (!plan) return;
        const completedCount = plan.stats.completed;
        if (completedCount === 0) { alert('No completed sessions to bill yet.'); return; }

        const billAmount = plan.pricePerSession * completedCount;
        if (!window.confirm(`Create bill for ${completedCount} completed session(s)?\n\nAmount: ₹${billAmount.toLocaleString()}`)) return;

        try {
            const billData = {
                patientId: plan.patient.id,
                billItems: plan.therapyTypes.map(type => ({
                    itemName: `${THERAPY_NAMES[type] || type} Therapy`,
                    itemType: 'THERAPY',
                    quantity: Math.ceil(completedCount / plan.therapyTypes.length),
                    unitPrice: plan.pricePerSession,
                    taxPercentage: 0,
                })),
                notes: `Therapy Plan: ${plan.planNumber} — ${completedCount} session(s)`,
                status: 'PENDING',
            };

            const res = await fetch('/api/billing/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(billData),
            });

            if (res.ok) {
                const data = await res.json();
                // Link the new bill to the plan
                await fetch(`/api/therapy/plans/${plan.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ billId: data.bill.id }),
                });
                alert('Bill created successfully!');
                router.push('/dashboard/billing');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create bill');
            }
        } catch (error) { alert('Failed to create bill'); }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading therapy plan...</p>
            </div>
        </div>
    );

    if (!plan) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <p className="text-base font-semibold text-gray-800 mb-2">Plan not found</p>
                <button onClick={() => router.back()} className="text-sm text-teal-600 hover:underline">← Go back</button>
            </div>
        </div>
    );

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcomingSessions = plan.sessions.filter(s => {
        const d = new Date(s.scheduledDate); d.setHours(0, 0, 0, 0);
        return s.status === 'SCHEDULED' && d >= today;
    });
    const completedSessions = plan.sessions.filter(s => s.status === 'COMPLETED');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <button onClick={() => router.back()} className="text-sm text-teal-600 hover:underline mb-5 flex items-center gap-1">
                    ← Back to Plans
                </button>

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-semibold text-gray-900">{plan.patient.fullName}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[plan.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                {plan.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">{plan.patient.age} yrs · {plan.patient.gender} · {plan.patient.phoneNumber}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {plan.patient.constitutionType && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                                    {plan.patient.constitutionType}
                                </span>
                            )}
                            <span className="text-xs text-gray-400 font-mono">Plan: {plan.planNumber}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button onClick={() => router.push(`/dashboard/therapy/plans/${params.id}/edit`)}
                                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                            Edit
                        </button>
                        <button onClick={deletePlan}
                                className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg transition-colors">
                            Delete
                        </button>
                        {/* FIX: Always show Create Bill when there are completed sessions */}
                        {plan.stats.completed > 0 && (
                            <button onClick={createBillForPlan}
                                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                                Create Bill
                            </button>
                        )}
                        {plan.bill && (
                            <button onClick={() => router.push(`/dashboard/billing/${plan.bill.id}`)}
                                    className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center">
                                <p className="text-xs text-green-600">Latest Bill</p>
                                <p className="text-sm font-semibold text-green-800">{plan.bill.billNumber}</p>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Progress */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">Progress</h2>
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                    <span>Completion</span>
                                    <span className="font-semibold text-teal-600 text-sm">{plan.stats.percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${Math.min(plan.stats.percentage, 100)}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Completed', value: plan.stats.completed, color: 'green' },
                                    { label: 'Upcoming', value: plan.stats.upcoming, color: 'blue' },
                                    { label: 'Missed', value: plan.stats.missed, color: 'red' },
                                    { label: 'Total', value: plan.stats.total, color: 'gray' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className={`text-center p-3 bg-${color}-50 rounded-lg border border-${color}-100`}>
                                        <p className={`text-xl font-bold text-${color}-${color === 'gray' ? '700' : color === 'red' ? '500' : '600'}`}>{value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Therapies */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3">Therapies</h2>
                            <div className="space-y-2">
                                {plan.therapyTypes.map(type => (
                                    <div key={type} className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                                        <span className="text-sm font-medium text-teal-800">{THERAPY_NAMES[type] || type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3">Plan Details</h2>
                            <div className="space-y-2.5 text-sm">
                                {[
                                    { label: 'Start Date', value: formatDate(plan.startDate) },
                                    { label: 'End Date', value: formatDate(plan.endDate) },
                                    { label: 'Frequency', value: plan.frequency },
                                    { label: 'Per Session', value: `₹${plan.pricePerSession}` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="text-gray-500">{label}</span>
                                        <span className="font-medium text-gray-800">{value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-2.5 border-t border-gray-100">
                                    <span className="font-semibold text-gray-700">Total Amount</span>
                                    <span className="text-base font-bold text-teal-600">₹{plan.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            {plan.instructions && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Patient Instructions</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{plan.instructions}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sessions */}
                    <div className="lg:col-span-2 space-y-4">
                        {upcomingSessions.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h2 className="text-sm font-semibold text-gray-700 mb-4">Upcoming Sessions</h2>
                                <div className="space-y-2">
                                    {upcomingSessions.slice(0, 5).map(session => (
                                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    Session #{session.sessionNumber} — {THERAPY_NAMES[session.therapyType] || session.therapyType}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatDate(session.scheduledDate)}{session.scheduledTime && ` · ${session.scheduledTime}`}
                                                </p>
                                            </div>
                                            <button onClick={() => markSessionComplete(session.id)}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                                                Mark Done
                                            </button>
                                        </div>
                                    ))}
                                    {upcomingSessions.length > 5 && (
                                        <p className="text-xs text-gray-400 text-center pt-1">+{upcomingSessions.length - 5} more upcoming sessions</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {completedSessions.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h2 className="text-sm font-semibold text-gray-700 mb-4">Completed Sessions</h2>
                                <div className="space-y-2">
                                    {completedSessions.map(session => (
                                        <div key={session.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    Session #{session.sessionNumber} — {THERAPY_NAMES[session.therapyType] || session.therapyType}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatDate(session.scheduledDate)}{session.duration && ` · ${session.duration} mins`}
                                                </p>
                                            </div>
                                            <span className="text-green-500">✓</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {upcomingSessions.length === 0 && completedSessions.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <p className="text-sm text-gray-400">No sessions found for this plan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}