'use client';

import React, { useState, useEffect } from 'react';
import PatientLoginCredentials from '@/components/patients/PatientLoginCredentials';

interface Patient {
    id: string;
    fullName: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    phoneNumber: string;
    email?: string;
    bloodGroup?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    constitutionType: string;
    treatmentCount: number;
    lastVisit: string;
    notes?: string;
    registrationId?: number;
    userId?: string;
}

// Helper function to format patient ID for display
const formatPatientId = (id: string, registrationId?: number): string => {
    if (registrationId) {
        return `P${registrationId.toString().padStart(6, '0')}`;
    }
    return id.substring(0, 8).toUpperCase();
};

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const fetchPatients = async (search = '') => {
        try {
            setLoading(true);
            const url = search ? `/api/patients?search=${encodeURIComponent(search)}` : '/api/patients';
            const response = await fetch(url);

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();

            if (Array.isArray(data)) {
                setPatients(data);
            } else if (data.patients && Array.isArray(data.patients)) {
                setPatients(data.patients);
            } else {
                setPatients([]);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPatients(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPatients(searchQuery);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this patient?')) return;
        try {
            await fetch(`/api/patients/${id}`, { method: 'DELETE' });
            fetchPatients(searchQuery);
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const handleEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowEditModal(true);
    };

    const handleSchedule = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowScheduleModal(true);
    };

    const handlePortalLogin = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowLoginModal(true);
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getConstitutionColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'Vata': 'bg-blue-100 text-blue-700 border-blue-200',
            'Pitta': 'bg-red-100 text-red-700 border-red-200',
            'Kapha': 'bg-green-100 text-green-700 border-green-200',
            'Vata-Pitta': 'bg-purple-100 text-purple-700 border-purple-200',
            'Pitta-Kapha': 'bg-orange-100 text-orange-700 border-orange-200',
            'Vata-Kapha': 'bg-cyan-100 text-cyan-700 border-cyan-200',
            'Tridosha': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Patient Management</h1>
                        <p className="text-sm text-gray-500">Manage patient records and portal access</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Patient
                    </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search patients by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input pl-10"
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                    {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(''); fetchPatients(); }} className="btn btn-ghost">
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Patient Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : !Array.isArray(patients) ? (
                <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 font-medium mb-2">Error: Invalid data format</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh Page</button>
                </div>
            ) : patients.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first patient'}
                    </p>
                    {!searchQuery && (
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Add New Patient</button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {patients.map((patient) => (
                        <div key={patient.id} className="card card-hover">
                            <div className="card-content">
                                {/* Avatar and Name */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-sm">{getInitials(patient.fullName)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate mb-1">{patient.fullName}</h3>
                                        <p className="text-sm text-gray-500 mb-1">Age: {patient.age} • {patient.gender}</p>
                                        <p className="text-xs text-gray-400 font-mono">ID: {formatPatientId(patient.id, patient.registrationId)}</p>
                                    </div>
                                </div>

                                {/* Constitution Badge + Portal Status */}
                                <div className="mb-4 flex items-center gap-2 flex-wrap">
                                    <span className={`badge ${getConstitutionColor(patient.constitutionType)}`}>
                                        {patient.constitutionType}
                                    </span>
                                    {patient.userId ? (
                                        <span className="badge bg-green-100 text-green-700 border-green-200">🔐 Portal Active</span>
                                    ) : (
                                        <span className="badge bg-gray-100 text-gray-500 border-gray-200">No Portal</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{patient.treatmentCount} Treatments</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Last Visit: {getRelativeTime(patient.lastVisit)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="font-medium">{patient.phoneNumber}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button onClick={() => handleSchedule(patient)} className="flex-1 btn btn-sm btn-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Schedule
                                    </button>
                                    <button onClick={() => handlePortalLogin(patient)} className="btn btn-sm btn-secondary" title="Portal Login">
                                        🔐
                                    </button>
                                    <button onClick={() => handleEdit(patient)} className="btn btn-sm btn-ghost" title="Edit">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(patient.id)} className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50" title="Delete">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Portal Login Modal */}
            {showLoginModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Patient Portal Access</h2>
                            <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Patient Info */}
                            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">{getInitials(selectedPatient.fullName)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{selectedPatient.fullName}</h3>
                                        <p className="text-sm text-gray-600">{selectedPatient.phoneNumber}</p>
                                        <p className="text-xs text-gray-500 font-mono">ID: {formatPatientId(selectedPatient.id, selectedPatient.registrationId)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Login Credentials Component */}
                            <PatientLoginCredentials
                                patientId={selectedPatient.id}
                                patientName={selectedPatient.fullName}
                                onLoginCreated={() => fetchPatients(searchQuery)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowLoginModal(false)} className="btn btn-ghost w-full">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Patient Modal */}
            {showAddModal && (
                <AddPatientModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); fetchPatients(searchQuery); }}
                />
            )}

            {/* Edit Patient Modal */}
            {showEditModal && selectedPatient && (
                <EditPatientModal
                    patient={selectedPatient}
                    onClose={() => { setShowEditModal(false); setSelectedPatient(null); }}
                    onSuccess={() => { setShowEditModal(false); setSelectedPatient(null); fetchPatients(searchQuery); }}
                />
            )}

            {/* Schedule Modal */}
            {showScheduleModal && selectedPatient && (
                <ScheduleModal
                    patient={selectedPatient}
                    onClose={() => { setShowScheduleModal(false); setSelectedPatient(null); }}
                    onSuccess={() => { setShowScheduleModal(false); setSelectedPatient(null); alert('Appointment scheduled!'); }}
                />
            )}
        </div>
    );
}

// =============================================
// Schedule Modal Component
// =============================================
function ScheduleModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({ appointmentDate: '', appointmentTime: '', duration: '30', reason: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId: patient.id, ...formData, duration: parseInt(formData.duration) }),
            });
            if (response.ok) onSuccess();
            else alert('Failed to schedule appointment');
        } catch (error) {
            alert('Failed to schedule appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">
                        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">{patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                                    <p className="text-sm text-gray-600">{patient.phoneNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Date <span className="text-red-500">*</span></label>
                                <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time <span className="text-red-500">*</span></label>
                                <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required className="form-select">
                                    <option value="">Select time</option>
                                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration</label>
                                <select name="duration" value={formData.duration} onChange={handleChange} className="form-select">
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason <span className="text-red-500">*</span></label>
                                <input type="text" name="reason" value={formData.reason} onChange={handleChange} required className="form-input" placeholder="e.g., Consultation" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="form-textarea" placeholder="Additional notes..." />
                        </div>
                    </div>

                    <div className="modal-footer flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Scheduling...' : 'Schedule'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================
// Add Patient Modal Component
// =============================================
function AddPatientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        fullName: '', dateOfBirth: '', age: '', gender: 'Male', phoneNumber: '', email: '', bloodGroup: '',
        addressLine1: '', addressLine2: '', postalCode: '', city: '', state: '', constitutionType: 'Not assessed yet', notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to add patient');
            }
        } catch (error) {
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'dateOfBirth' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
            setFormData((prev) => ({ ...prev, age: age.toString() }));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Patient</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" placeholder="Enter full name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth <span className="text-red-500">*</span></label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Age <span className="text-red-500">*</span></label>
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} required className="form-input" min="0" max="150" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender <span className="text-red-500">*</span></label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required className="form-select">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-select">
                                        <option value="">Select</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="form-input" placeholder="+91 9876543210" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="email@example.com" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Address Line 1</label>
                                    <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Medical Information</h3>
                            <div className="form-group">
                                <label className="form-label">Constitution Type</label>
                                <select name="constitutionType" value={formData.constitutionType} onChange={handleChange} className="form-select">
                                    {['Not assessed yet', 'Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="form-textarea" />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Adding...' : 'Add Patient'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================
// Edit Patient Modal Component
// =============================================
function EditPatientModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth.split('T')[0],
        age: patient.age.toString(),
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        email: patient.email || '',
        bloodGroup: patient.bloodGroup || '',
        addressLine1: patient.addressLine1 || '',
        city: patient.city || '',
        state: patient.state || '',
        constitutionType: patient.constitutionType,
        notes: patient.notes || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/patients/${patient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update patient');
            }
        } catch (error) {
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'dateOfBirth' && value) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
            setFormData((prev) => ({ ...prev, age: age.toString() }));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Patient</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">Patient ID: <span className="font-mono font-semibold">{formatPatientId(patient.id, patient.registrationId)}</span></p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group md:col-span-2">
                                <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Constitution Type</label>
                                <select name="constitutionType" value={formData.constitutionType} onChange={handleChange} className="form-select">
                                    {['Not assessed yet', 'Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="form-textarea" />
                        </div>
                    </div>

                    <div className="modal-footer flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Updating...' : 'Update Patient'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}