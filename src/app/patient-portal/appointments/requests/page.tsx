// src/app/dashboard/appointments/requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AppointmentRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [action, setAction] = useState<'approve' | 'suggest_alternative' | 'decline'>('approve');
    const [altData, setAltData] = useState({ date: '', time: '' });
    const [declineReason, setDeclineReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/appointments/requests');
            if (res.ok) setRequests((await res.json()).requests || []);
        } catch {}
        finally { setLoading(false); }
    };

    const handleRespond = async () => {
        if (!selectedRequest) return;
        setError('');
        setActionLoading(true);
        try {
            const body: any = { action };
            if (action === 'suggest_alternative') {
                if (!altData.date || !altData.time) throw new Error('Select date and time');
                body.alternativeDate = altData.date;
                body.alternativeTime = altData.time;
            }
            if (action === 'decline') body.declineReason = declineReason;

            const res = await fetch(`/api/appointments/${selectedRequest.id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(data.message);
            setShowModal(false);
            setSelectedRequest(null);
            setAltData({ date: '', time: '' });
            setDeclineReason('');
            fetchRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const pending = requests.filter(r => r.status === 'PENDING_APPROVAL');
    const waiting = requests.filter(r => r.status === 'ALTERNATIVE_PROPOSED');

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointment Requests</h1>
                    <p className="text-gray-600">Review patient appointment requests</p>
                </div>
                <Link href="/dashboard/appointments" className="btn btn-ghost">← Back</Link>
            </div>

            {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">✓ {success}</div>}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-600 font-medium">Pending Approval</p>
                    <p className="text-3xl font-bold text-amber-800">{pending.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-600 font-medium">Awaiting Patient</p>
                    <p className="text-3xl font-bold text-blue-800">{waiting.length}</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12"><div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div></div>
            ) : pending.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-gray-500 font-medium">No pending requests</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50"><h2 className="font-semibold">Pending ({pending.length})</h2></div>
                    <div className="divide-y">
                        {pending.map(req => (
                            <div key={req.id} className="p-4 hover:bg-gray-50">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                                            <span className="text-lg font-bold text-teal-600">{req.patient?.fullName?.charAt(0) || '?'}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{req.patient?.fullName}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{req.reason}</p>
                                            <p className="text-sm text-teal-600 font-medium">📅 {formatDate(req.appointmentDate)} • 🕐 {req.appointmentTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setSelectedRequest(req); setAction('approve'); setShowModal(true); }}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">✓ Approve</button>
                                        <button onClick={() => { setSelectedRequest(req); setAction('suggest_alternative'); setShowModal(true); }}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">📅 Suggest</button>
                                        <button onClick={() => { setSelectedRequest(req); setAction('decline'); setShowModal(true); }}
                                                className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">✗ Decline</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {action === 'approve' && '✓ Approve'}
                                {action === 'suggest_alternative' && '📅 Suggest Time'}
                                {action === 'decline' && '✗ Decline'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">{error}</div>}

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm"><strong>Patient:</strong> {selectedRequest.patient?.fullName}</p>
                                <p className="text-sm"><strong>Requested:</strong> {formatDate(selectedRequest.appointmentDate)} at {selectedRequest.appointmentTime}</p>
                            </div>

                            {action === 'suggest_alternative' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">New Date *</label>
                                        <input type="date" value={altData.date} onChange={(e) => setAltData({ ...altData, date: e.target.value })}
                                               className="w-full px-4 py-2.5 rounded-lg border" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">New Time *</label>
                                        <select value={altData.time} onChange={(e) => setAltData({ ...altData, time: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border">
                                            <option value="">Select</option>
                                            {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {action === 'decline' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                    <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border resize-none" rows={2} />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg font-medium">Cancel</button>
                                <button onClick={handleRespond} disabled={actionLoading}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 ${
                                            action === 'approve' ? 'bg-green-600' : action === 'suggest_alternative' ? 'bg-blue-600' : 'bg-red-600'
                                        }`}>
                                    {actionLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}