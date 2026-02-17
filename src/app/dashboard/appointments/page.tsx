'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
}

interface Appointment {
    id: string;
    patientId?: string;
    patient?: Patient;
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    reason: string;
    status: string;
    notes?: string;
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(true);
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
    const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Appointment | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const appointmentsRes = await fetch('/api/appointments');
            const appointmentsData = await appointmentsRes.json();

            const appointmentList = appointmentsData.appointments || appointmentsData || [];
            const allAppointments = Array.isArray(appointmentList) ? appointmentList : [];
            setAppointments(allAppointments);

            // Filter pending requests (PENDING_APPROVAL status)
            const pending = allAppointments.filter((apt: Appointment) =>
                apt.status === 'PENDING_APPROVAL' || apt.status === 'pending_approval'
            );
            setPendingRequests(pending);

            // Reset current index if it's out of bounds
            if (currentRequestIndex >= pending.length) {
                setCurrentRequestIndex(Math.max(0, pending.length - 1));
            }

            const patientsRes = await fetch('/api/patients');
            const patientsData = await patientsRes.json();

            const patientList = patientsData.patients || patientsData || [];
            setPatients(Array.isArray(patientList) ? patientList : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAppointments([]);
            setPatients([]);
            setPendingRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Clear action message after 3 seconds
    useEffect(() => {
        if (actionMessage) {
            const timer = setTimeout(() => setActionMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionMessage]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;
        try {
            await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
            fetchAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await fetch(`/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleApproveRequest = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/appointments/${id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });

            if (res.ok) {
                setActionMessage({ type: 'success', text: 'Appointment approved successfully!' });
                fetchAppointments();
            } else {
                const data = await res.json();
                setActionMessage({ type: 'error', text: data.error || 'Failed to approve' });
            }
        } catch (error) {
            console.error('Error approving request:', error);
            setActionMessage({ type: 'error', text: 'Failed to approve appointment' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineRequest = async (id: string, reason?: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/appointments/${id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decline', declineReason: reason || 'Schedule conflict' }),
            });

            if (res.ok) {
                setActionMessage({ type: 'success', text: 'Appointment declined' });
                fetchAppointments();
            } else {
                const data = await res.json();
                setActionMessage({ type: 'error', text: data.error || 'Failed to decline' });
            }
        } catch (error) {
            console.error('Error declining request:', error);
            setActionMessage({ type: 'error', text: 'Failed to decline appointment' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuggestAlternative = async (id: string, newDate: string, newTime: string, message?: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/appointments/${id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'suggest_alternative',
                    alternativeDate: newDate,
                    alternativeTime: newTime,
                    staffMessage: message
                }),
            });

            if (res.ok) {
                setActionMessage({ type: 'success', text: 'Alternative time suggested! Patient will be notified.' });
                setShowSuggestModal(false);
                setSelectedRequest(null);
                fetchAppointments();
            } else {
                const data = await res.json();
                setActionMessage({ type: 'error', text: data.error || 'Failed to suggest alternative' });
            }
        } catch (error) {
            console.error('Error suggesting alternative:', error);
            setActionMessage({ type: 'error', text: 'Failed to suggest alternative' });
        } finally {
            setActionLoading(null);
        }
    };

    const openSuggestModal = (request: Appointment) => {
        setSelectedRequest(request);
        setShowSuggestModal(true);
    };

    // Navigate between pending requests
    const goToPrevRequest = () => {
        setCurrentRequestIndex(prev => Math.max(0, prev - 1));
    };

    const goToNextRequest = () => {
        setCurrentRequestIndex(prev => Math.min(pendingRequests.length - 1, prev + 1));
    };

    // Filter out pending requests from regular appointment list
    const regularAppointments = React.useMemo(() => {
        if (!Array.isArray(appointments)) return [];
        return appointments.filter(apt =>
            apt.status !== 'PENDING_APPROVAL' && apt.status !== 'pending_approval'
        );
    }, [appointments]);

    const filteredAppointments = React.useMemo(() => {
        if (!Array.isArray(regularAppointments)) {
            return [];
        }

        return regularAppointments.filter((apt) => {
            const matchesSearch = searchQuery
                ? (apt.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    apt.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    apt.patient?.phoneNumber?.includes(searchQuery) ||
                    apt.guestPhone?.includes(searchQuery))
                : true;

            const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

            const aptDate = new Date(apt.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let matchesDate = true;
            if (dateFilter === 'today') {
                matchesDate = aptDate.toDateString() === today.toDateString();
            } else if (dateFilter === 'week') {
                const weekFromNow = new Date(today);
                weekFromNow.setDate(today.getDate() + 7);
                matchesDate = aptDate >= today && aptDate <= weekFromNow;
            } else if (dateFilter === 'month') {
                matchesDate = aptDate.getMonth() === today.getMonth() &&
                    aptDate.getFullYear() === today.getFullYear();
            }

            if (selectedDate) {
                matchesDate = aptDate.toDateString() === selectedDate.toDateString();
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [regularAppointments, searchQuery, statusFilter, dateFilter, selectedDate]);

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dateA.getTime() - dateB.getTime();
    });

    const groupedAppointments = sortedAppointments.reduce((groups, apt) => {
        const date = new Date(apt.appointmentDate).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(apt);
        return groups;
    }, {} as Record<string, Appointment[]>);

    const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
            'no-show': 'bg-gray-100 text-gray-700 border-gray-200',
            SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
            COMPLETED: 'bg-green-100 text-green-700 border-green-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            NO_SHOW: 'bg-gray-100 text-gray-700 border-gray-200',
            PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
            ALTERNATIVE_PROPOSED: 'bg-purple-100 text-purple-700 border-purple-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const goToPreviousDate = () => {
        setCurrentDateIndex(prev => Math.max(0, prev - 1));
    };

    const goToNextDate = () => {
        setCurrentDateIndex(prev => Math.min(sortedDates.length - 1, prev + 1));
    };

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Action Message Toast */}
            {actionMessage && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                    actionMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {actionMessage.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">{actionMessage.text}</span>
                </div>
            )}

            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Appointment Management</h1>
                        <p className="text-sm text-gray-500">Schedule and manage patient appointments</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowCalendar(!showCalendar)} className="btn btn-secondary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {showCalendar ? 'Hide' : 'Show'} Calendar
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Schedule Appointment
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search by patient name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-input pl-10" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select">
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                    </select>
                    <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setSelectedDate(null); setCurrentDateIndex(0); }} className="form-select">
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {showCalendar && (
                    <div className="lg:col-span-1 space-y-4">
                        <AppointmentCalendar
                            appointments={regularAppointments}
                            selectedDate={selectedDate}
                            onSelectDate={(date) => { setSelectedDate(date); setDateFilter('all'); setCurrentDateIndex(0); }}
                        />

                        {/* Pending Requests Card */}
                        <div className="card">
                            <div className="card-content">
                                {/* Header with navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Pending Requests</h3>
                                    </div>
                                    {pendingRequests.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {/* Navigation buttons for multiple requests */}
                                            {pendingRequests.length > 1 && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={goToPrevRequest}
                                                        disabled={currentRequestIndex === 0}
                                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs text-gray-500 min-w-[40px] text-center">
                                                        {currentRequestIndex + 1}/{pendingRequests.length}
                                                    </span>
                                                    <button
                                                        onClick={goToNextRequest}
                                                        disabled={currentRequestIndex === pendingRequests.length - 1}
                                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                                                {pendingRequests.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-500">No pending requests</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Current Request Card */}
                                        {pendingRequests[currentRequestIndex] && (
                                            <PendingRequestCard
                                                request={pendingRequests[currentRequestIndex]}
                                                onApprove={() => handleApproveRequest(pendingRequests[currentRequestIndex].id)}
                                                onDecline={() => handleDeclineRequest(pendingRequests[currentRequestIndex].id)}
                                                onSuggestAlternative={() => openSuggestModal(pendingRequests[currentRequestIndex])}
                                                formatDate={formatDate}
                                                formatTime={formatTime}
                                                isLoading={actionLoading === pendingRequests[currentRequestIndex].id}
                                            />
                                        )}

                                        {/* Dots indicator for multiple requests */}
                                        {pendingRequests.length > 1 && (
                                            <div className="flex justify-center gap-1.5 mt-3">
                                                {pendingRequests.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentRequestIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${
                                                            idx === currentRequestIndex ? 'bg-amber-500' : 'bg-gray-300 hover:bg-gray-400'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className={showCalendar ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                        </div>
                    ) : sortedAppointments.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                            <p className="text-sm text-gray-500 mb-6">Schedule your first appointment</p>
                            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Schedule Appointment</button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={goToPreviousDate} disabled={currentDateIndex === 0} className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </button>
                                <span className="text-sm font-medium text-gray-600">{currentDateIndex + 1} of {sortedDates.length}</span>
                                <button onClick={goToNextDate} disabled={currentDateIndex === sortedDates.length - 1} className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {sortedDates[currentDateIndex] && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                                        {new Date(sortedDates[currentDateIndex]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {groupedAppointments[sortedDates[currentDateIndex]]
                                            .sort((a, b) => {
                                                const timeA = a.appointmentTime.split(':').map(Number);
                                                const timeB = b.appointmentTime.split(':').map(Number);
                                                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                                            })
                                            .map((apt) => (
                                                <AppointmentCard key={apt.id} appointment={apt} onDelete={handleDelete} onStatusChange={handleStatusChange} getStatusColor={getStatusColor} formatTime={formatTime} />
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showAddModal && (
                <AddAppointmentModal patients={patients} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchAppointments(); }} />
            )}

            {/* Suggest Alternative Modal */}
            {showSuggestModal && selectedRequest && (
                <SuggestAlternativeModal
                    request={selectedRequest}
                    onClose={() => { setShowSuggestModal(false); setSelectedRequest(null); }}
                    onSubmit={handleSuggestAlternative}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    isLoading={actionLoading === selectedRequest.id}
                />
            )}
        </div>
    );
}

// Pending Request Card Component
function PendingRequestCard({ request, onApprove, onDecline, onSuggestAlternative, formatDate, formatTime, isLoading }: {
    request: Appointment;
    onApprove: () => void;
    onDecline: () => void;
    onSuggestAlternative: () => void;
    formatDate: (d: string) => string;
    formatTime: (t: string) => string;
    isLoading: boolean;
}) {
    const patientName = request.patient?.fullName || request.guestName || 'Unknown';
    const patientPhone = request.patient?.phoneNumber || request.guestPhone || '';

    return (
        <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <span className="text-amber-700 font-semibold text-sm">{patientName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{patientName}</h4>
                    <p className="text-xs text-gray-500">{patientPhone}</p>
                </div>
            </div>

            <div className="text-xs text-gray-600 mb-3 space-y-1.5">
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(request.appointmentDate)} • {formatTime(request.appointmentTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="truncate">{request.reason}</span>
                </div>
                {request.notes && (
                    <div className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span className="line-clamp-2">{request.notes}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <button
                        onClick={onApprove}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                        {isLoading ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                            </>
                        )}
                    </button>
                    <button
                        onClick={onDecline}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Decline
                    </button>
                </div>
                <button
                    onClick={onSuggestAlternative}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-xs font-medium border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Suggest Different Time
                </button>
            </div>
        </div>
    );
}

// Suggest Alternative Modal
function SuggestAlternativeModal({ request, onClose, onSubmit, formatDate, formatTime, isLoading }: {
    request: Appointment;
    onClose: () => void;
    onSubmit: (id: string, date: string, time: string, message?: string) => void;
    formatDate: (d: string) => string;
    formatTime: (t: string) => string;
    isLoading: boolean;
}) {
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [message, setMessage] = useState('');

    const patientName = request.patient?.fullName || request.guestName || 'Unknown';

    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDate && newTime) {
            onSubmit(request.id, newDate, newTime, message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Suggest Alternative Time</h2>
                        <p className="text-sm text-gray-500">For {patientName}'s appointment request</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        {/* Original Request Info */}
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Original Request</p>
                            <div className="flex items-center gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-medium text-gray-900 ml-1">{formatDate(request.appointmentDate)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Time:</span>
                                    <span className="font-medium text-gray-900 ml-1">{formatTime(request.appointmentTime)}</span>
                                </div>
                            </div>
                            <div className="mt-1 text-sm">
                                <span className="text-gray-500">Reason:</span>
                                <span className="text-gray-900 ml-1">{request.reason}</span>
                            </div>
                        </div>

                        {/* New Date/Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">New Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Time <span className="text-red-500">*</span></label>
                                <select
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select time</option>
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{formatTime(time)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Message to Patient */}
                        <div className="form-group">
                            <label className="form-label">Message to Patient (Optional)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="form-textarea"
                                rows={2}
                                placeholder="e.g., The doctor is unavailable at your requested time..."
                            />
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <strong>Note:</strong> The patient will receive this suggestion and can accept or decline.
                                If they accept, the appointment will be automatically confirmed.
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newDate || !newTime}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Suggestion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AppointmentCard({ appointment, onDelete, onStatusChange, getStatusColor, formatTime }: { appointment: Appointment; onDelete: (id: string) => void; onStatusChange: (id: string, status: string) => void; getStatusColor: (status: string) => string; formatTime: (time: string) => string; }) {
    const patientName = appointment.patient?.fullName || appointment.guestName || 'Unknown';
    const patientPhone = appointment.patient?.phoneNumber || appointment.guestPhone || '';
    const isGuest = !appointment.patientId;

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{patientName}</h3>
                            {isGuest && (<span className="badge bg-amber-100 text-amber-700 border-amber-200 text-xs">Guest</span>)}
                        </div>
                        <p className="text-xs text-gray-500">{patientPhone}</p>
                    </div>
                    <select value={appointment.status} onChange={(e) => onStatusChange(appointment.id, e.target.value)} className={`badge ${getStatusColor(appointment.status)} border-0 cursor-pointer text-xs`}>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                    </select>
                </div>

                <div className="space-y-2 mb-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(appointment.appointmentTime)} ({appointment.duration} mins)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="truncate">{appointment.reason}</span>
                    </div>
                    {appointment.notes && (
                        <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="truncate">{appointment.notes}</span>
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                    <button onClick={() => onDelete(appointment.id)} className="w-full btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function AppointmentCalendar({ appointments, selectedDate, onSelectDate }: { appointments: Appointment[]; selectedDate: Date | null; onSelectDate: (date: Date) => void; }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const getAppointmentsForDate = (date: Date) => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === date.toDateString();
        }).length;
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="card">
            <div className="card-content">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-gray-900">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>))}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const appointmentCount = getAppointmentsForDate(date);
                        const isToday = date.toDateString() === today.toDateString();
                        const isSelected = selectedDate?.toDateString() === date.toDateString();

                        return (
                            <button key={day} onClick={() => onSelectDate(date)} className={`aspect-square p-1 text-sm rounded-lg relative ${isSelected ? 'bg-teal-600 text-white' : isToday ? 'bg-teal-50 text-teal-700 font-semibold' : 'hover:bg-gray-100'} ${appointmentCount > 0 && !isSelected ? 'font-medium' : ''}`}>
                                <span className="block">{day}</span>
                                {appointmentCount > 0 && (<span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-600'}`} />)}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-teal-600" />
                            <span>Has appointments</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddAppointmentModal({ patients, onClose, onSuccess }: { patients: Patient[]; onClose: () => void; onSuccess: () => void; }) {
    const [isGuest, setIsGuest] = useState(false);
    const [formData, setFormData] = useState({ patientId: '', guestName: '', guestPhone: '', guestEmail: '', appointmentDate: '', appointmentTime: '', duration: '30', reason: '', notes: '', });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, patientId: isGuest ? null : formData.patientId || null, duration: parseInt(formData.duration), }),
            });
            if (response.ok) { onSuccess(); } else { alert('Failed to schedule appointment'); }
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            alert('Failed to schedule appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Schedule Appointment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={!isGuest} onChange={() => setIsGuest(false)} className="w-4 h-4 text-teal-600" />
                                <span className="text-sm font-medium text-gray-700">Registered Patient</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={isGuest} onChange={() => setIsGuest(true)} className="w-4 h-4 text-teal-600" />
                                <span className="text-sm font-medium text-gray-700">Guest / Walk-in</span>
                            </label>
                        </div>

                        {!isGuest ? (
                            <div className="form-group">
                                <label htmlFor="patientId" className="form-label">Select Patient <span className="text-red-500">*</span></label>
                                <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required={!isGuest} className="form-select">
                                    <option value="">Choose a patient</option>
                                    {patients.map(patient => (<option key={patient.id} value={patient.id}>{patient.fullName} - {patient.phoneNumber}</option>))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="form-group">
                                    <label htmlFor="guestName" className="form-label">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" id="guestName" name="guestName" value={formData.guestName} onChange={handleChange} required={isGuest} className="form-input" placeholder="Enter patient name" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label htmlFor="guestPhone" className="form-label">Phone Number <span className="text-red-500">*</span></label>
                                        <input type="tel" id="guestPhone" name="guestPhone" value={formData.guestPhone} onChange={handleChange} required={isGuest} className="form-input" placeholder="+91 9876543210" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="guestEmail" className="form-label">Email</label>
                                        <input type="email" id="guestEmail" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className="form-input" placeholder="email@example.com" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label htmlFor="appointmentDate" className="form-label">Date <span className="text-red-500">*</span></label>
                                <input type="date" id="appointmentDate" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="appointmentTime" className="form-label">Time <span className="text-red-500">*</span></label>
                                <select id="appointmentTime" name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required className="form-select">
                                    <option value="">Select time</option>
                                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="duration" className="form-label">Duration (minutes) <span className="text-red-500">*</span></label>
                                <select id="duration" name="duration" value={formData.duration} onChange={handleChange} required className="form-select">
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                    <option value="120">2 hours</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="reason" className="form-label">Reason <span className="text-red-500">*</span></label>
                                <input type="text" id="reason" name="reason" value={formData.reason} onChange={handleChange} required className="form-input" placeholder="e.g., Consultation, Follow-up" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes" className="form-label">Notes</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="form-textarea" placeholder="Additional notes or special instructions..." />
                        </div>
                    </div>

                    <div className="modal-footer flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Scheduling...' : 'Schedule Appointment'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}