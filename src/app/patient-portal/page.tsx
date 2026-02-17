'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientProfile {
    id: string;
    fullName: string;
    age: number;
    gender: string;
    phoneNumber: string;
    email?: string;
    constitutionType: string;
    bloodGroup?: string;
    registrationId: number;
}

interface Appointment {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'PENDING_APPROVAL' | 'ALTERNATIVE_PROPOSED';
    doctorName?: string;
}

interface Prescription {
    id: string;
    prescriptionNo: string;
    chiefComplaints: string;
    diagnosis?: string;
    status: string;
    createdAt: string;
    medicineCount: number;
}

interface TherapySession {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    therapyType: string;
    status: string;
    notes?: string;
}

interface TherapyPlan {
    id: string;
    therapyTypes: string[];
    startDate: string;
    duration: number;
    frequency: string;
    status: string;
    completedSessions: number;
    totalSessions: number;
    upcomingSessions: TherapySession[];
}

interface DietPlan {
    id: string;
    constitution: string;
    season: string;
    createdAt: string;
    status: string;
    morningMeals: string[];
    lunchMeals: string[];
    eveningMeals: string[];
    guidelines?: string;
}

interface Bill {
    id: string;
    billNo: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    createdAt: string;
    dueDate?: string;
    description?: string;
}

interface DashboardData {
    patient: PatientProfile;
    appointments: Appointment[];
    prescriptions: Prescription[];
    therapyPlan: TherapyPlan | null;
    dietPlan: DietPlan | null;
    bills: Bill[];
    stats: {
        upcomingAppointments: number;
        activePrescriptions: number;
        pendingBillsAmount: number;
        therapyProgress: number;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-600',
    ACTIVE: 'bg-teal-50 text-teal-700',
    PAID: 'bg-green-50 text-green-700',
    PARTIAL: 'bg-amber-50 text-amber-700',
    UNPAID: 'bg-red-50 text-red-600',
    PENDING: 'bg-amber-50 text-amber-700',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
    ALTERNATIVE_PROPOSED: 'bg-blue-50 text-blue-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    DISPENSED: 'bg-purple-50 text-purple-700',
    NO_SHOW: 'bg-gray-100 text-gray-600',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientPortalPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/patient-portal/dashboard');
            if (res.status === 401) { router.push('/patient-portal/login'); return; }
            if (!res.ok) throw new Error();
            setData(await res.json());
        } catch {
            setError('Could not load your dashboard. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error || !data) return <ErrorState msg={error} retry={load} />;

    const { patient, appointments, prescriptions, therapyPlan, dietPlan, bills, stats } = data;

    const upcoming = appointments.filter(a => ['SCHEDULED', 'PENDING_APPROVAL', 'ALTERNATIVE_PROPOSED'].includes(a.status));
    const pastVisits = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));
    const pendingBills = bills.filter(b => b.status !== 'PAID');

    return (
        <div className="w-full px-6 py-8 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back, {patient.fullName.split(' ')[0]}</h1>
                        <p className="text-sm text-gray-500">Here's your health summary</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{patient.fullName}</p>
                            <p className="text-xs text-gray-500">Patient ID: #{patient.registrationId}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{patient.fullName.charAt(0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<CalendarIcon />}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    value={stats.upcomingAppointments}
                    label="Upcoming Appointments"
                />
                <StatCard
                    icon={<PillIcon />}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    value={stats.activePrescriptions}
                    label="Active Prescriptions"
                />
                <StatCard
                    icon={<HeartIcon />}
                    iconBg="bg-teal-50"
                    iconColor="text-teal-600"
                    value={`${stats.therapyProgress}%`}
                    label="Therapy Progress"
                />
                <StatCard
                    icon={<CurrencyIcon />}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    value={stats.pendingBillsAmount > 0 ? fmtCurrency(stats.pendingBillsAmount) : '₹0'}
                    label="Pending Bills"
                />
            </div>

            {/* Patient Info Card */}
            <div className="card mb-6">
                <div className="card-content">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xl">{patient.fullName.charAt(0)}</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{patient.fullName}</h2>
                                <p className="text-sm text-gray-500">{patient.email || patient.phoneNumber}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <InfoItem label="Age" value={`${patient.age} years`} />
                            <InfoItem label="Gender" value={patient.gender} />
                            <InfoItem label="Blood Group" value={patient.bloodGroup || 'Not specified'} />
                            <InfoItem label="Constitution" value={patient.constitutionType || 'Not assessed'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Appointments Section */}
                <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Appointments</h3>
                        <span className="text-xs font-medium text-gray-500">{appointments.length} total</span>
                    </div>
                    <div className="p-5">
                        {upcoming.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Upcoming</p>
                                <div className="space-y-3">
                                    {upcoming.slice(0, 3).map(apt => (
                                        <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-gray-900 leading-none">
                                                    {new Date(apt.appointmentDate).getDate()}
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase">
                                                    {new Date(apt.appointmentDate).toLocaleString('en', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{apt.reason || 'Consultation'}</p>
                                                <p className="text-xs text-gray-500">{apt.appointmentTime}</p>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLES[apt.status] || STATUS_STYLES.PENDING}`}>
                                                {apt.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pastVisits.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Past Visits</p>
                                <div className="space-y-2">
                                    {pastVisits.slice(0, 3).map(apt => (
                                        <div key={apt.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {new Date(apt.appointmentDate).getDate()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-800">{apt.reason || 'Consultation'}</p>
                                                    <p className="text-xs text-gray-400">{fmtDate(apt.appointmentDate)}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[apt.status] || STATUS_STYLES.COMPLETED}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {appointments.length === 0 && <EmptyState icon={<CalendarIcon />} text="No appointments yet" />}
                    </div>
                </div>

                {/* Prescriptions Section */}
                <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Prescriptions</h3>
                        <span className="text-xs font-medium text-gray-500">{prescriptions.length} total</span>
                    </div>
                    <div className="p-5">
                        {prescriptions.length > 0 ? (
                            <div className="space-y-3">
                                {prescriptions.slice(0, 4).map(rx => (
                                    <div key={rx.id} className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{rx.prescriptionNo}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{rx.chiefComplaints}</p>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[rx.status] || STATUS_STYLES.DRAFT}`}>
                                                {rx.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{fmtDate(rx.createdAt)}</span>
                                            <span className="font-medium text-gray-600">{rx.medicineCount} medicines</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={<PillIcon />} text="No prescriptions yet" />
                        )}
                    </div>
                </div>

                {/* Therapy Section */}
                <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Therapy Plan</h3>
                    </div>
                    <div className="p-5">
                        {therapyPlan ? (
                            <div className="space-y-4">
                                {/* Therapy Types */}
                                <div className="flex flex-wrap gap-2">
                                    {therapyPlan.therapyTypes.map(t => (
                                        <span key={t} className="text-xs font-medium px-2.5 py-1 bg-teal-50 text-teal-700 rounded">
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                {/* Progress */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Session Progress</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {therapyPlan.completedSessions} / {therapyPlan.totalSessions}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-500 rounded-full transition-all"
                                            style={{ width: `${therapyPlan.totalSessions > 0 ? Math.round((therapyPlan.completedSessions / therapyPlan.totalSessions) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">Start Date</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{fmtDate(therapyPlan.startDate)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">Duration</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{therapyPlan.duration} days</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">Frequency</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{therapyPlan.frequency.replace('_', ' ')}</p>
                                    </div>
                                </div>

                                {/* Upcoming Sessions */}
                                {therapyPlan.upcomingSessions?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Next Sessions</p>
                                        <div className="space-y-2">
                                            {therapyPlan.upcomingSessions.slice(0, 2).map(s => (
                                                <div key={s.id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-teal-50 rounded flex items-center justify-center">
                                                            <span className="text-xs font-semibold text-teal-700">
                                                                {new Date(s.scheduledDate).getDate()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{s.therapyType}</p>
                                                            <p className="text-xs text-gray-500">{s.scheduledTime}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[s.status] || STATUS_STYLES.SCHEDULED}`}>
                                                        {s.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState icon={<HeartIcon />} text="No therapy plan assigned" />
                        )}
                    </div>
                </div>

                {/* Diet Plan Section */}
                <div className="card">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Diet Plan</h3>
                    </div>
                    <div className="p-5">
                        {dietPlan ? (
                            <div className="space-y-4">
                                {/* Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Constitution</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{dietPlan.constitution}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Season</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{dietPlan.season}</p>
                                    </div>
                                </div>

                                {/* Meals */}
                                {[
                                    { label: 'Morning', items: dietPlan.morningMeals },
                                    { label: 'Lunch', items: dietPlan.lunchMeals },
                                    { label: 'Evening', items: dietPlan.eveningMeals },
                                ].filter(m => m.items?.length > 0).map(meal => (
                                    <div key={meal.label}>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{meal.label}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {meal.items.slice(0, 5).map(item => (
                                                <span key={item} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {dietPlan.guidelines && (
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                        <p className="text-xs font-medium text-amber-700 mb-1">Guidelines</p>
                                        <p className="text-sm text-amber-800">{dietPlan.guidelines}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState icon={<DietIcon />} text="No diet plan assigned" />
                        )}
                    </div>
                </div>
            </div>

            {/* Bills Section - Full Width */}
            <div className="card mt-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Bills & Payments</h3>
                    <span className="text-xs font-medium text-gray-500">{bills.length} total</span>
                </div>
                <div className="p-5">
                    {/* Outstanding Balance Alert */}
                    {pendingBills.length > 0 && stats.pendingBillsAmount > 0 && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-800">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-amber-900">{fmtCurrency(stats.pendingBillsAmount)}</p>
                            </div>
                            <p className="text-xs text-amber-700">Contact clinic for payment</p>
                        </div>
                    )}

                    {bills.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bills.map(bill => (
                                <div key={bill.id} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{bill.billNo}</p>
                                            <p className="text-xs text-gray-500">{fmtDate(bill.createdAt)}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[bill.status] || STATUS_STYLES.PENDING}`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{fmtCurrency(bill.totalAmount)}</p>
                                            {bill.paidAmount > 0 && bill.paidAmount < bill.totalAmount && (
                                                <p className="text-xs text-green-600">Paid: {fmtCurrency(bill.paidAmount)}</p>
                                            )}
                                        </div>
                                        {bill.dueDate && bill.status !== 'PAID' && (
                                            <p className="text-xs text-red-500 font-medium">Due {fmtDate(bill.dueDate)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<CurrencyIcon />} text="No bills yet" />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, iconColor, value, label }: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    value: string | number;
    label: string;
}) {
    return (
        <div className="card">
            <div className="card-content flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <div className={iconColor}>{icon}</div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
    );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <div className="text-gray-400">{icon}</div>
            </div>
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-600 border-t-transparent mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Loading your health summary...</p>
            </div>
        </div>
    );
}

function ErrorState({ msg, retry }: { msg: string; retry: () => void }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h2>
                <p className="text-sm text-gray-500 mb-4">{msg || 'Unable to load dashboard'}</p>
                <button onClick={retry} className="btn btn-primary">
                    Try Again
                </button>
            </div>
        </div>
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function PillIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function CurrencyIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function DietIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}