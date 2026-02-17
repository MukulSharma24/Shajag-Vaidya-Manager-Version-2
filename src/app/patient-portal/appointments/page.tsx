'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    ALTERNATIVE_PROPOSED: { label: 'New Time Proposed', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
    SCHEDULED: { label: 'Confirmed', color: 'bg-green-50 text-green-700 border border-green-200' },
    COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border border-red-200' },
    DECLINED: { label: 'Declined', color: 'bg-red-50 text-red-600 border border-red-200' },
};

interface Appointment {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status: string;
    notes?: string;
    duration?: number;
    totalAmount?: number;
    paidAmount?: number;
}

// ── Payment Confirmation Modal ────────────────────────────────────────────────
function PaymentConfirmModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', amount: '' });
    const [loading, setLoading] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/patient-portal/payment-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowThankYou(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                alert('Failed to submit. Please try again.');
            }
        } catch (error) {
            alert('Error submitting confirmation');
        } finally {
            setLoading(false);
        }
    };

    if (showThankYou) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Thank You!</h3>
                    <p className="text-sm text-gray-500">Your payment confirmation has been received.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Payment Confirmation</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Please share your payment details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="your@email.com"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Enter payment amount"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                'Confirm Payment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ onClose }: { onClose: () => void }) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Make a Payment</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Scan QR or use UPI ID below</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Demo QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 relative">
                                {/* Demo QR pattern */}
                                <div className="grid grid-cols-7 gap-0.5 p-2 opacity-40">
                                    {Array.from({ length: 49 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 h-4 rounded-sm ${
                                                [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48,10,12,24,36,38].includes(i)
                                                    ? 'bg-gray-800'
                                                    : 'bg-transparent'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="absolute bottom-3 bg-white px-2 py-0.5 rounded text-xs font-medium text-teal-600 border border-teal-200">
                                    Demo QR
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Your actual QR will appear here</p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">OR PAY VIA UPI</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* UPI ID */}
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-teal-600 font-medium mb-0.5">UPI ID</p>
                                <p className="text-sm font-semibold text-teal-800 font-mono">yourclinic@upi</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard?.writeText('yourclinic@upi');
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                            >
                                Copy
                            </button>
                        </div>

                        {/* Share confirmation info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                After payment, share screenshot to:
                            </p>
                            <div className="space-y-1.5">
                                <a
                                    href="https://wa.me/919999999999"
                                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-teal-600 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.118 1.522 5.848L0 24l6.336-1.495A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.938 0-3.754-.524-5.318-1.435l-.38-.225-3.962.935.975-3.858-.247-.397A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                    </svg>
                                    <span className="font-medium">WhatsApp:</span>
                                    <span className="text-teal-600">+91 99999 99999</span>
                                </a>
                                <a
                                    href="mailto:clinic@example.com"
                                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-teal-600 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">Email:</span>
                                    <span className="text-teal-600">clinic@example.com</span>
                                </a>
                            </div>
                        </div>

                        {/* ✅ NEW: Payment Confirmation Button */}
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>After Payment, Fill This</span>
                        </button>
                    </div>

                    <div className="px-5 pb-5">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            {showConfirmModal && (
                <PaymentConfirmModal
                    onClose={() => setShowConfirmModal(false)}
                    onSuccess={() => {
                        setShowConfirmModal(false);
                        // Optionally close the payment modal too
                        // onClose();
                    }}
                />
            )}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PatientAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
    const [showModal, setShowModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [requestData, setRequestData] = useState({ preferredDate: '', preferredTime: '', reason: '', notes: '' });
    const [requestLoading, setRequestLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { fetchAppointments(); }, []);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const fetchAppointments = async () => {
        try {
            const res = await fetch('/api/patient-portal/appointments/request');
            if (res.status === 401) { router.push('/patient-portal/login'); return; }
            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments || []);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setRequestLoading(true);
        try {
            const res = await fetch('/api/patient-portal/appointments/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess('Appointment request submitted successfully!');
            setShowModal(false);
            setRequestData({ preferredDate: '', preferredTime: '', reason: '', notes: '' });
            fetchAppointments();
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleRespond = async (id: string, action: 'accept' | 'decline') => {
        setActionLoading(id);
        setError('');
        try {
            const res = await fetch(`/api/patient-portal/appointments/${id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(data.message || (action === 'accept' ? 'Appointment confirmed!' : 'Appointment declined'));
            fetchAppointments();
        } catch (err: any) {
            setError(err.message || 'Failed to respond');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

    const formatTime = (time: string) => {
        if (!time) return '';
        if (time.includes('AM') || time.includes('PM')) return time;
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (activeTab === 'upcoming') return aptDate >= today && !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(apt.status);
        if (activeTab === 'past') return aptDate < today || ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(apt.status);
        return true;
    });

    const pendingResponseCount = appointments.filter(apt => apt.status === 'ALTERNATIVE_PROPOSED').length;

    return (
        <div className="w-full px-4 sm:px-6 py-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
                    <p className="text-sm text-gray-500 mt-1">View and request appointments</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Pay Button */}
                    <button
                        onClick={() => setShowPayModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Pay
                    </button>

                    {/* Request Appointment Button */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Request Appointment
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Pending Response Alert */}
            {pendingResponseCount > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">
                        {pendingResponseCount} appointment{pendingResponseCount > 1 ? 's' : ''} need your response
                    </span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                {(['all', 'upcoming', 'past'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-600 border-t-transparent" />
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mb-4">No appointments found</p>
                    <button onClick={() => setShowModal(true)} className="text-teal-600 font-medium hover:text-teal-700">
                        Request your first appointment →
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map(apt => {
                        const status = STATUS_CONFIG[apt.status] || { label: apt.status, color: 'bg-gray-100 text-gray-700' };
                        const isAltProposed = apt.status === 'ALTERNATIVE_PROPOSED';
                        const isLoading = actionLoading === apt.id;

                        return (
                            <div key={apt.id} className={`card ${isAltProposed ? 'border-blue-300 bg-blue-50/30' : ''}`}>
                                <div className="card-content">
                                    {isAltProposed && (
                                        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2">
                                            <span className="text-lg">📅</span>
                                            <p className="text-sm font-medium text-blue-800">
                                                A new time has been proposed for this appointment. Please accept or decline.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-xl font-bold text-gray-900 leading-none">
                                                {new Date(apt.appointmentDate).getDate()}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase mt-1">
                                                {new Date(apt.appointmentDate).toLocaleString('en', { month: 'short' })}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">{apt.reason}</h3>
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{formatDate(apt.appointmentDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{formatTime(apt.appointmentTime)}</span>
                                                </div>
                                            </div>

                                            {apt.notes && (
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{apt.notes}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Accept / Decline for Alternative Proposed */}
                                    {isAltProposed && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                                            <button
                                                onClick={() => handleRespond(apt.id, 'accept')}
                                                disabled={isLoading}
                                                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Accept
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(apt.id, 'decline')}
                                                disabled={isLoading}
                                                className="flex-1 btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Payment Modal */}
            {showPayModal && <PaymentModal onClose={() => setShowPayModal(false)} />}

            {/* Request Appointment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Request Appointment</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleRequest}>
                            <div className="modal-body space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">{error}</div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Preferred Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={requestData.preferredDate}
                                        onChange={(e) => setRequestData({ ...requestData, preferredDate: e.target.value })}
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Preferred Time <span className="text-red-500">*</span></label>
                                    <select
                                        value={requestData.preferredTime}
                                        onChange={(e) => setRequestData({ ...requestData, preferredTime: e.target.value })}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select time</option>
                                        {['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM',
                                            '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reason <span className="text-red-500">*</span></label>
                                    <select
                                        value={requestData.reason}
                                        onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select reason</option>
                                        {['General Consultation','Follow-up Visit','Therapy Session','Diet Consultation','New Symptoms','Health Check-up'].map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Additional Notes</label>
                                    <textarea
                                        value={requestData.notes}
                                        onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                                        className="form-textarea"
                                        rows={3}
                                        placeholder="Any additional information..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={requestLoading} className="flex-1 btn btn-primary disabled:opacity-50">
                                    {requestLoading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}