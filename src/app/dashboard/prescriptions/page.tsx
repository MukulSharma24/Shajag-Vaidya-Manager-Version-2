'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================
// INTERFACES
// ============================================

interface Patient {
    id: string;
    fullName: string;           // Your actual field name
    dateOfBirth: string;
    age: number;
    gender: string;
    phoneNumber: string;        // Your actual field name
    email?: string;
    bloodGroup?: string;
    addressLine1?: string;
    constitutionType: string;
    // Optional - you can add this later
    registrationId?: string;
}

interface Medicine {
    id: string;
    name: string;
    genericName?: string;
    type: string;
    strength?: string;
    unit: string;
    currentStock: number;
    sellingPrice: number;
    stockStatus: string;
    stockLabel: string;
    available: boolean;
}

interface PrescriptionMedicine {
    medicineId: string;
    medicineName: string;
    medicineType: string;
    strength: string;
    dosageFormat: string;
    dosageMorning: number;
    dosageAfternoon: number;
    dosageEvening: number;
    dosageNight: number;
    duration: number;
    durationUnit: string;
    timing: string;
    instructions: string;
    quantityNeeded: number;
    unitType: string;
    stockAvailable: number;
}

interface Prescription {
    id: string;
    prescriptionNo: string;
    patient: Patient;
    chiefComplaints: string;
    diagnosis?: string;
    medicines: any[];
    status: 'DRAFT' | 'COMPLETED' | 'DISPENSED' | 'CLOSED';
    followUpDate?: string;
    createdAt: string;
}

interface TodayPatient extends Patient {
    appointmentTime?: string;
    appointmentReason?: string;
    hasAppointment: boolean;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [todayPatients, setTodayPatients] = useState<TodayPatient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [preselectedPatient, setPreselectedPatient] = useState<Patient | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        thisWeek: 0,
        pendingDispense: 0,
    });

    useEffect(() => {
        fetchPrescriptions();
        fetchStats();
        fetchTodayPatients();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/prescriptions');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPrescriptions(data.prescriptions || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/prescriptions/stats?period=week');
            if (res.ok) {
                const data = await res.json();
                setStats({
                    total: data.overview.total,
                    today: data.overview.today,
                    thisWeek: data.overview.period,
                    pendingDispense: data.overview.pendingDispense,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchTodayPatients = async () => {
        try {
            setLoadingPatients(true);

            // Get today's date range (start and end of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            console.log('📅 Fetching appointments for:', today.toDateString());

            // Fetch today's appointments with patient details
            const res = await fetch(
                `/api/appointments?` + new URLSearchParams({
                    startDate: today.toISOString(),
                    endDate: tomorrow.toISOString(),
                    status: 'scheduled', // Only scheduled appointments
                })
            );

            if (res.ok) {
                const data = await res.json();
                const appointments = data.appointments || [];

                console.log('✅ Found', appointments.length, 'appointments today');

                // Map appointments to TodayPatient format
                const todayPats: TodayPatient[] = appointments
                    .filter((apt: any) => apt.patient) // Only appointments with patients
                    .map((apt: any) => ({
                        // Patient details
                        id: apt.patient.id,
                        fullName: apt.patient.fullName,
                        dateOfBirth: apt.patient.dateOfBirth,
                        age: apt.patient.age,
                        gender: apt.patient.gender,
                        phoneNumber: apt.patient.phoneNumber,
                        email: apt.patient.email,
                        bloodGroup: apt.patient.bloodGroup,
                        addressLine1: apt.patient.addressLine1,
                        constitutionType: apt.patient.constitutionType,
                        registrationId: apt.patient.registrationId,
                        // Appointment details
                        appointmentTime: apt.appointmentTime,
                        appointmentReason: apt.reason,
                        hasAppointment: true,
                    }));

                setTodayPatients(todayPats);
            } else {
                console.error('❌ Failed to fetch appointments:', res.status);
                setTodayPatients([]);
            }
        } catch (error) {
            console.error('❌ Error fetching today patients:', error);
            setTodayPatients([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    const handleQuickPrescription = (patient: Patient) => {
        setPreselectedPatient(patient);
        setShowCreateModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this prescription?')) return;
        try {
            const res = await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPrescriptions();
                fetchStats();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete prescription');
            }
        } catch (error) {
            console.error('Error deleting prescription:', error);
            alert('Error deleting prescription');
        }
    };

    const handleDispense = async (id: string) => {
        if (!confirm('Dispense medicine for this prescription? Stock will be deducted.')) return;
        try {
            const res = await fetch(`/api/prescriptions/${id}/dispense`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dispensedBy: 'current-user-id' }),
            });

            if (res.ok) {
                alert('Prescription dispensed successfully!');
                fetchPrescriptions();
                fetchStats();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to dispense prescription');
            }
        } catch (error) {
            console.error('Error dispensing:', error);
            alert('Error dispensing prescription');
        }
    };

    const filteredPrescriptions = prescriptions.filter((rx) => {
        const matchesSearch = searchQuery
            ? rx.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rx.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rx.patient?.phoneNumber?.includes(searchQuery) ||
            rx.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

        const matchesStatus = statusFilter === 'all' || rx.status === statusFilter;

        let matchesDate = true;
        if (dateFilter !== 'all') {
            const rxDate = new Date(rx.createdAt);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateFilter === 'today') {
                matchesDate = rxDate >= today;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                matchesDate = rxDate >= weekAgo;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                matchesDate = rxDate >= monthAgo;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusBadge = (status: string) => {
        const badges = {
            DRAFT: <span className="badge bg-blue-100 text-blue-700 border-blue-200">Draft</span>,
            COMPLETED: <span className="badge bg-green-100 text-green-700 border-green-200">Completed</span>,
            DISPENSED: <span className="badge bg-amber-100 text-amber-700 border-amber-200">Dispensed</span>,
            CLOSED: <span className="badge bg-gray-100 text-gray-700 border-gray-200">Closed</span>,
        };
        return badges[status as keyof typeof badges] || badges.DRAFT;
    };

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Prescription Management</h1>
                        <p className="text-sm text-gray-500">Manage patient prescriptions and medicines</p>
                    </div>
                    <button onClick={() => {
                        setPreselectedPatient(null);
                        setShowCreateModal(true);
                    }} className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Prescription
                    </button>
                </div>

                {/* TODAY'S PATIENTS GRID */}
                {!loadingPatients && todayPatients.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Today's Patients</h2>
                                <p className="text-sm text-gray-500">Click to create prescription</p>
                            </div>
                            <span className="text-sm text-gray-500">{todayPatients.length} patients</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {todayPatients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => handleQuickPrescription(patient)}
                                    className="group relative p-4 bg-gradient-to-br from-white to-gray-50 hover:from-teal-50 hover:to-teal-100 border-2 border-gray-200 hover:border-teal-400 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                                >
                                    {/* Appointment Time Badge */}
                                    {patient.hasAppointment && patient.appointmentTime && (
                                        <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 bg-teal-600 text-white text-xs font-semibold rounded">
                        {patient.appointmentTime}
                    </span>
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="flex justify-center mb-3">
                                        <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 group-hover:from-teal-600 group-hover:to-teal-700 rounded-full flex items-center justify-center shadow-md ring-4 ring-white transition-all">
                    <span className="text-white font-bold text-lg">
                        {patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                    </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                                            {patient.fullName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {patient.age}Y • {patient.gender}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                                            {patient.phoneNumber}
                                        </p>

                                        {/* Registration ID */}
                                        {patient.registrationId && (
                                            <p className="text-xs text-teal-600 font-semibold mt-1">
                                                #{patient.registrationId}
                                            </p>
                                        )}
                                    </div>

                                    {/* Hover Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shadow-xl">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Total Prescriptions</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Today</p>
                                    <p className="text-2xl font-semibold text-teal-600">{stats.today}</p>
                                </div>
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">This Week</p>
                                    <p className="text-2xl font-semibold text-purple-600">{stats.thisWeek}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Pending Dispense</p>
                                    <p className="text-2xl font-semibold text-amber-600">{stats.pendingDispense}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="card-content">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by prescription no., patient name, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-10"
                                />
                            </div>

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select">
                                <option value="all">All Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="DISPENSED">Dispensed</option>
                                <option value="CLOSED">Closed</option>
                            </select>

                            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="form-select">
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 6v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prescription List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : filteredPrescriptions.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                    <p className="text-sm text-gray-500 mb-6">Create your first prescription to get started</p>
                    <button onClick={() => {
                        setPreselectedPatient(null);
                        setShowCreateModal(true);
                    }} className="btn btn-primary">
                        New Prescription
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                    {filteredPrescriptions.map((rx) => (
                        <PrescriptionCard
                            key={rx.id}
                            prescription={rx}
                            viewMode={viewMode}
                            onView={(rx) => {
                                setSelectedPrescription(rx);
                                setShowViewModal(true);
                            }}
                            onDelete={handleDelete}
                            onDispense={handleDispense}
                            getStatusBadge={getStatusBadge}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreatePrescriptionModal
                    preselectedPatient={preselectedPatient}
                    onClose={() => {
                        setShowCreateModal(false);
                        setPreselectedPatient(null);
                    }}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setPreselectedPatient(null);
                        fetchPrescriptions();
                        fetchStats();
                        fetchTodayPatients();
                    }}
                />
            )}

            {showViewModal && selectedPrescription && (
                <ViewPrescriptionModal
                    prescriptionId={selectedPrescription.id}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedPrescription(null);
                    }}
                    onDispense={() => {
                        handleDispense(selectedPrescription.id);
                        setShowViewModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ============================================
// PRESCRIPTION CARD COMPONENT
// ============================================

function PrescriptionCard({
                              prescription,
                              viewMode,
                              onView,
                              onDelete,
                              onDispense,
                              getStatusBadge,
                          }: {
    prescription: Prescription;
    viewMode: 'grid' | 'list';
    onView: (rx: Prescription) => void;
    onDelete: (id: string) => void;
    onDispense: (id: string) => void;
    getStatusBadge: (status: string) => JSX.Element;
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (viewMode === 'list') {
        return (
            <div className="card card-hover">
                <div className="card-content">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                            <div className="col-span-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-semibold text-teal-700">
                                            {prescription.patient?.fullName?.charAt(0)?.toUpperCase() || 'P'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">{prescription.prescriptionNo}</h3>
                                        <p className="text-xs text-gray-500">{prescription.patient?.fullName || 'Unknown Patient'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-900 line-clamp-2">{prescription.chiefComplaints}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">💊 {prescription.medicines.length} medicines</p>
                            </div>
                            <div>
                                {getStatusBadge(prescription.status)}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => onView(prescription)} className="btn btn-sm btn-secondary">
                                    View
                                </button>
                                {prescription.status === 'COMPLETED' && (
                                    <button onClick={() => onDispense(prescription.id)} className="btn btn-sm btn-primary">
                                        Dispense
                                    </button>
                                )}
                                {prescription.status !== 'DISPENSED' && (
                                    <button onClick={() => onDelete(prescription.id)} className="btn btn-sm btn-ghost text-red-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{prescription.prescriptionNo}</h3>
                        <p className="text-xs text-gray-500">{formatDate(prescription.createdAt)}</p>
                    </div>
                    {getStatusBadge(prescription.status)}
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-semibold text-teal-700">
                                {prescription.patient?.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{prescription.patient?.fullName || 'Unknown Patient'}</p>
                            <p className="text-xs text-gray-500">{prescription.patient?.age || 0}Y • {prescription.patient?.gender || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                    <div>
                        <p className="text-gray-500 mb-1">Chief Complaint:</p>
                        <p className="text-gray-900 line-clamp-2">{prescription.chiefComplaints}</p>
                    </div>
                    {prescription.diagnosis && (
                        <div>
                            <p className="text-gray-500 mb-1">Diagnosis:</p>
                            <p className="text-gray-900">{prescription.diagnosis}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-gray-500">💊 {prescription.medicines.length} medicines prescribed</p>
                    </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => onView(prescription)} className="flex-1 btn btn-sm btn-secondary">
                        View
                    </button>
                    {prescription.status === 'COMPLETED' && (
                        <button onClick={() => onDispense(prescription.id)} className="flex-1 btn btn-sm btn-primary">
                            Dispense
                        </button>
                    )}
                    {prescription.status !== 'DISPENSED' && (
                        <button onClick={() => onDelete(prescription.id)} className="btn btn-sm btn-ghost text-red-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// CREATE PRESCRIPTION MODAL
// ============================================

function CreatePrescriptionModal({
                                     preselectedPatient,
                                     onClose,
                                     onSuccess
                                 }: {
    preselectedPatient: Patient | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const [chiefComplaints, setChiefComplaints] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [instructions, setInstructions] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'COMPLETED'>('COMPLETED');

    const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const patientDropdownRef = useRef<HTMLDivElement>(null);
    const medicineDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (patientSearch && patientSearch.length >= 2) {
            searchPatients(patientSearch);
        } else {
            setPatients([]);
        }
    }, [patientSearch]);

    useEffect(() => {
        if (medicineSearch && medicineSearch.length >= 2) {
            searchMedicines(medicineSearch);
        } else {
            setMedicineResults([]);
        }
    }, [medicineSearch]);

    useEffect(() => {
        if (selectedPatient) {
            loadPatientHistory(selectedPatient.id);
        }
    }, [selectedPatient]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
                setShowPatientDropdown(false);
            }
            if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) {
                setShowMedicineDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (preselectedPatient) {
            setSelectedPatient(preselectedPatient);
            setPatientSearch(preselectedPatient.fullName);
            loadPatientHistory(preselectedPatient.id);
        }
    }, [preselectedPatient]);

    const searchPatients = async (query: string) => {
        try {
            console.log('🔍 Searching patients with query:', query);
            const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
            console.log('📡 Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('📦 Full API Response:', data);

                // Handle different response structures
                let patientList = [];
                if (data.patients) {
                    patientList = data.patients;
                } else if (Array.isArray(data)) {
                    patientList = data;
                } else {
                    console.warn('⚠️ Unexpected response structure:', data);
                }

                console.log('👥 Patient list:', patientList);
                console.log('📊 Number of patients found:', patientList.length);

                // Debug each patient
                patientList.forEach((p: any, i: number) => {
                    console.log(`Patient ${i + 1}:`, {
                        id: p.id,
                        fullName: p.fullName,
                        phoneNumber: p.phoneNumber,
                        age: p.age,
                        gender: p.gender
                    });
                });

                setPatients(patientList);

                if (patientList.length > 0) {
                    setShowPatientDropdown(true);
                    console.log('✅ Showing dropdown with', patientList.length, 'patients');
                } else {
                    console.log('⚠️ No patients found, dropdown hidden');
                }
            } else {
                console.error('❌ API Error:', res.status, res.statusText);
                const errorText = await res.text();
                console.error('Error details:', errorText);
            }
        } catch (error) {
            console.error('❌ Error searching patients:', error);
        }
    };

    const searchMedicines = async (query: string) => {
        try {
            const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setMedicineResults(data.medicines || []);
                setShowMedicineDropdown(true);
            }
        } catch (error) {
            console.error('Error searching medicines:', error);
        }
    };

    const loadPatientHistory = async (patientId: string) => {
        try {
            const res = await fetch(`/api/prescriptions/patient/${patientId}?limit=5`);
            if (res.ok) {
                const data = await res.json();
                setPatientHistory(data.prescriptions || []);
            }
        } catch (error) {
            console.error('Error loading patient history:', error);
        }
    };

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setPatientSearch(patient.fullName);
        setShowPatientDropdown(false);
    };

    const addMedicine = (medicine: Medicine) => {
        const newMedicine: PrescriptionMedicine = {
            medicineId: medicine.id,
            medicineName: medicine.name,
            medicineType: medicine.type,
            strength: medicine.strength || '',
            dosageFormat: '1-0-1',
            dosageMorning: 1,
            dosageAfternoon: 0,
            dosageEvening: 1,
            dosageNight: 0,
            duration: 5,
            durationUnit: 'DAYS',
            timing: 'After Food',
            instructions: '',
            quantityNeeded: 10,
            unitType: medicine.unit,
            stockAvailable: medicine.currentStock,
        };

        setMedicines([...medicines, newMedicine]);
        setMedicineSearch('');
        setShowMedicineDropdown(false);
    };

    const updateMedicine = (index: number, field: string, value: any) => {
        const updated = [...medicines];
        updated[index] = { ...updated[index], [field]: value };
        setMedicines(updated);
    };

    const setDosageTemplate = (index: number, template: string) => {
        const templates: { [key: string]: [number, number, number, number] } = {
            '1-0-1': [1, 0, 1, 0],
            '1-1-1': [1, 1, 1, 0],
            '0-0-1': [0, 0, 1, 0],
            '1-0-0': [1, 0, 0, 0],
            '0-1-0': [0, 1, 0, 0],
        };

        const [morning, afternoon, evening, night] = templates[template] || [0, 0, 0, 0];

        const updated = [...medicines];
        updated[index] = {
            ...updated[index],
            dosageFormat: template,
            dosageMorning: morning,
            dosageAfternoon: afternoon,
            dosageEvening: evening,
            dosageNight: night,
        };

        setMedicines(updated);
    };

    const removeMedicine = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const copyFromPrevious = (prescription: any) => {
        setChiefComplaints(prescription.chiefComplaints || '');
        setDiagnosis(prescription.diagnosis || '');

        const copiedMedicines = prescription.medicines.map((med: any) => ({
            medicineId: med.medicine?.id || '',
            medicineName: med.name,
            medicineType: med.medicine?.type || '',
            strength: med.medicine?.strength || '',
            dosageFormat: med.dosage,
            dosageMorning: 1,
            dosageAfternoon: 0,
            dosageEvening: 1,
            dosageNight: 0,
            duration: 5,
            durationUnit: 'DAYS',
            timing: 'After Food',
            instructions: '',
            quantityNeeded: 10,
            unitType: med.medicine?.unit || 'Strip',
            stockAvailable: med.medicine?.currentStock || 0,
        }));

        setMedicines(copiedMedicines);
        setShowHistory(false);
        alert('Prescription copied! You can now edit as needed.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient || !selectedPatient.id) {
            alert('Please select a patient from the dropdown');
            return;
        }

        if (!chiefComplaints || !chiefComplaints.trim()) {
            alert('Please enter chief complaints');
            return;
        }

        if (medicines.length === 0) {
            alert('Please add at least one medicine');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    chiefComplaints,
                    diagnosis: diagnosis || null,
                    medicines,
                    instructions: instructions || null,
                    followUpDate: followUpDate || null,
                    status,
                    createdBy: 'current-user-id',
                }),
            });

            if (res.ok) {
                alert('Prescription created successfully!');
                onSuccess();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create prescription');
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            alert('Error creating prescription');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Prescription</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">

                        {/* Patient Selection */}
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-teal-900 mb-3">Patient Information</h3>

                            <div className="relative" ref={patientDropdownRef}>
                                <label className="form-label">Search Patient <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    onFocus={() => {
                                        if (patientSearch && patientSearch.length >= 2 && patients.length > 0) {
                                            setShowPatientDropdown(true);
                                        }
                                    }}
                                    placeholder="Type patient name or phone..."
                                    className="form-input"
                                    autoComplete="off"
                                />

                                {showPatientDropdown && patients.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() => selectPatient(patient)}
                                                className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b border-gray-100 last:border-0 focus:bg-teal-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-semibold text-teal-700">
                                                            {patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className="text-sm font-semibold text-gray-900">{patient.fullName}</p>
                                                            {patient.id && (
                                                                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded font-semibold">
                                                                    ID: {patient.id.slice(0, 8).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-700 font-medium">
                                                            📞 {patient.phoneNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {patient.age}Y • {patient.gender}
                                                            {patient.email && ` • ${patient.email}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedPatient && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-teal-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                                <span className="text-base font-semibold text-teal-700">
                                                    {selectedPatient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.fullName}</p>
                                                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded font-semibold">
                                                        ID: {selectedPatient.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-700 font-medium">
                                                    📞 {selectedPatient.phoneNumber}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedPatient.age}Y • {selectedPatient.gender}
                                                    {selectedPatient.email && ` • ${selectedPatient.email}`}
                                                </p>
                                            </div>
                                        </div>
                                        {patientHistory.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="btn btn-sm btn-ghost text-teal-600 flex-shrink-0"
                                            >
                                                View History ({patientHistory.length})
                                            </button>
                                        )}
                                    </div>

                                    {showHistory && patientHistory.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-teal-200">
                                            <p className="text-xs font-semibold text-teal-900 mb-2">Recent Prescriptions:</p>
                                            <div className="space-y-2">
                                                {patientHistory.map((rx) => (
                                                    <div key={rx.id} className="p-2 bg-teal-50 rounded border border-teal-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium text-gray-900">{rx.prescriptionNo}</p>
                                                                <p className="text-xs text-gray-600 line-clamp-1">{rx.chiefComplaints}</p>
                                                                <p className="text-xs text-gray-500">{rx.medicineCount} medicines</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyFromPrevious(rx)}
                                                                className="btn btn-xs btn-ghost text-teal-600"
                                                            >
                                                                Copy
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Clinical Information */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Clinical Assessment</h3>

                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Chief Complaints <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={chiefComplaints}
                                        onChange={(e) => setChiefComplaints(e.target.value)}
                                        rows={3}
                                        className="form-textarea"
                                        placeholder="e.g., Fever since 2 days, headache, body pain..."
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Diagnosis</label>
                                    <textarea
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                        rows={2}
                                        className="form-textarea"
                                        placeholder="e.g., Viral Fever..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medicines Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Medicines Prescribed</h3>
                                <span className="text-xs text-gray-500">{medicines.length} medicine(s) added</span>
                            </div>

                            <div className="relative mb-4" ref={medicineDropdownRef}>
                                <label className="form-label">Search & Add Medicine</label>
                                <input
                                    type="text"
                                    value={medicineSearch}
                                    onChange={(e) => setMedicineSearch(e.target.value)}
                                    onFocus={() => {
                                        if (medicineSearch && medicineSearch.length >= 2 && medicineResults.length > 0) {
                                            setShowMedicineDropdown(true);
                                        }
                                    }}
                                    placeholder="Type medicine name..."
                                    className="form-input"
                                    autoComplete="off"
                                />

                                {showMedicineDropdown && medicineResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {medicineResults.map((medicine) => (
                                            <button
                                                key={medicine.id}
                                                type="button"
                                                onClick={() => addMedicine(medicine)}
                                                disabled={!medicine.available}
                                                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-0 ${
                                                    medicine.available ? 'hover:bg-gray-50' : 'bg-gray-50 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {medicine.type} • {medicine.strength || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xs font-medium ${
                                                            medicine.stockStatus === 'IN_STOCK' ? 'text-green-600' :
                                                                medicine.stockStatus === 'LOW_STOCK' ? 'text-amber-600' :
                                                                    'text-red-600'
                                                        }`}>
                                                            {medicine.stockLabel}
                                                        </p>
                                                        <p className="text-xs text-gray-500">₹{medicine.sellingPrice}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {medicines.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <svg className="mx-auto w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <p className="text-sm text-gray-500">No medicines added yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Search and select medicines from inventory</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {medicines.map((med, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{med.medicineName}</p>
                                                    <p className="text-xs text-gray-500">{med.medicineType} • {med.strength}</p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Stock: {med.stockAvailable} {med.unitType}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedicine(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label text-xs">Dosage</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0'].map((template) => (
                                                        <button
                                                            key={template}
                                                            type="button"
                                                            onClick={() => setDosageTemplate(index, template)}
                                                            className={`px-3 py-1 text-xs font-medium rounded border ${
                                                                med.dosageFormat === template
                                                                    ? 'bg-teal-600 text-white border-teal-600'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                                                            }`}
                                                        >
                                                            {template}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="form-group">
                                                    <label className="form-label text-xs">Duration</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={med.duration}
                                                        onChange={(e) => updateMedicine(index, 'duration', parseInt(e.target.value) || 1)}
                                                        className="form-input text-sm"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-xs">Timing</label>
                                                    <select
                                                        value={med.timing}
                                                        onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                                                        className="form-select text-sm"
                                                    >
                                                        <option>After Food</option>
                                                        <option>Before Food</option>
                                                        <option>Empty Stomach</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Additional Instructions */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>

                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label">General Instructions</label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        rows={2}
                                        className="form-textarea"
                                        placeholder="e.g., Take complete rest..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Follow-up Date</label>
                                        <input
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className="form-input"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'COMPLETED')}
                                            className="form-select"
                                        >
                                            <option value="DRAFT">Save as Draft</option>
                                            <option value="COMPLETED">Mark as Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? 'Creating...' : 'Create Prescription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// VIEW PRESCRIPTION MODAL
// ============================================

function ViewPrescriptionModal({ prescriptionId, onClose, onDispense }: {
    prescriptionId: string;
    onClose: () => void;
    onDispense: () => void;
}) {
    const [prescription, setPrescription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrescription();
    }, [prescriptionId]);

    const fetchPrescription = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/prescriptions/${prescriptionId}`);
            if (res.ok) {
                const data = await res.json();
                setPrescription(data);
            }
        } catch (error) {
            console.error('Error fetching prescription:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            DRAFT: <span className="badge bg-blue-100 text-blue-700 border-blue-200">Draft</span>,
            COMPLETED: <span className="badge bg-green-100 text-green-700 border-green-200">Completed</span>,
            DISPENSED: <span className="badge bg-amber-100 text-amber-700 border-amber-200">Dispensed</span>,
            CLOSED: <span className="badge bg-gray-100 text-gray-700 border-gray-200">Closed</span>,
        };
        return badges[status as keyof typeof badges] || badges.DRAFT;
    };

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center py-20">
                        <p className="text-gray-500">Prescription not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Prescription Details</h2>
                        <p className="text-sm text-gray-500 mt-1">{prescription.prescriptionNo}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body space-y-6">

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="text-base font-semibold text-gray-900">{formatDate(prescription.createdAt)}</p>
                        </div>
                        <div>
                            {getStatusBadge(prescription.status)}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Patient Information</h3>
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-semibold text-white">
                                        {prescription.patient?.fullName?.charAt(0)?.toUpperCase() || 'P'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-semibold text-gray-900">{prescription.patient?.fullName || 'Unknown Patient'}</p>
                                    <p className="text-sm text-gray-600">
                                        {prescription.patient?.age || 0}Y • {prescription.patient?.gender || 'N/A'} • {prescription.patient?.phoneNumber || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Clinical Assessment</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Chief Complaints</p>
                                <p className="text-sm text-gray-900">{prescription.chiefComplaints}</p>
                            </div>

                            {prescription.diagnosis && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
                                    <p className="text-sm text-gray-900">{prescription.diagnosis}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Medicines Prescribed</h3>
                        <div className="space-y-3">
                            {prescription.medicines.map((med: any, index: number) => (
                                <div key={med.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-teal-700">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">{med.medicineName}</p>
                                            <p className="text-xs text-gray-500 mb-2">{med.medicineType} • {med.strength}</p>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-500">Dosage:</span>
                                                    <span className="ml-1 font-medium text-gray-900">{med.dosageFormat}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Duration:</span>
                                                    <span className="ml-1 font-medium text-gray-900">
                                                        {med.duration} {med.durationUnit.toLowerCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Timing:</span>
                                                    <span className="ml-1 font-medium text-gray-900">{med.timing}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {prescription.instructions && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructions</h3>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">{prescription.instructions}</p>
                            </div>
                        </div>
                    )}

                </div>

                <div className="modal-footer">
                    <button onClick={() => window.print()} className="btn btn-ghost">
                        Print
                    </button>
                    {prescription.status === 'COMPLETED' && (
                        <button onClick={onDispense} className="btn btn-primary">
                            Dispense Medicine
                        </button>
                    )}
                    <button onClick={onClose} className="btn btn-ghost">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}