'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
    id: string;
    registrationId: number;
    fullName: string;
    phoneNumber: string;
    email?: string;
    age: number;
    gender: string;
    constitutionType: string;
}

const THERAPY_TYPES = [
    { id: 'VAMANA', name: 'Vamana', icon: '🤮', description: 'Therapeutic vomiting for Kapha disorders' },
    { id: 'VIRECHANA', name: 'Virechana', icon: '💊', description: 'Purgation therapy for Pitta disorders' },
    { id: 'BASTI', name: 'Basti', icon: '💧', description: 'Medicated enema for Vata disorders' },
    { id: 'NASYA', name: 'Nasya', icon: '👃', description: 'Nasal administration of medicines' },
    { id: 'RAKTAMOKSHANA', name: 'Raktamokshana', icon: '🩸', description: 'Bloodletting therapy' },
];

export default function CreateTherapyPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);

    const [formData, setFormData] = useState({
        therapyTypes: [] as string[],
        startDate: new Date().toISOString().split('T')[0],
        duration: 21,
        frequency: 'DAILY',
        pricePerSession: 1000,
        notes: '',
        instructions: '',
    });

    // Session timing (flexible)
    const [sessionTimes, setSessionTimes] = useState<string[]>(['10:00 AM']);

    // Search patients
    useEffect(() => {
        const searchPatients = async () => {
            if (patientSearch.trim().length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            try {
                setSearching(true);
                const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.patients || []);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Error searching patients:', error);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchPatients, 300);
        return () => clearTimeout(timer);
    }, [patientSearch]);

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setPatientSearch(`${patient.fullName} (ID: ${patient.registrationId})`);
        setShowResults(false);
    };

    const toggleTherapy = (therapyId: string) => {
        setFormData(prev => ({
            ...prev,
            therapyTypes: prev.therapyTypes.includes(therapyId)
                ? prev.therapyTypes.filter(t => t !== therapyId)
                : [...prev.therapyTypes, therapyId],
        }));
    };

    const addSessionTime = () => {
        setSessionTimes([...sessionTimes, '10:00 AM']);
    };

    const removeSessionTime = (index: number) => {
        if (sessionTimes.length > 1) {
            setSessionTimes(sessionTimes.filter((_, i) => i !== index));
        }
    };

    const updateSessionTime = (index: number, value: string) => {
        const updated = [...sessionTimes];
        updated[index] = value;
        setSessionTimes(updated);
    };

    const calculateTotalSessions = () => {
        const { duration, frequency, therapyTypes } = formData;
        let sessionsPerTherapy = 0;

        switch (frequency) {
            case 'DAILY':
                sessionsPerTherapy = duration;
                break;
            case 'ALTERNATE_DAYS':
                sessionsPerTherapy = Math.ceil(duration / 2);
                break;
            case 'WEEKLY':
                sessionsPerTherapy = duration;
                break;
            default:
                sessionsPerTherapy = duration;
        }

        return sessionsPerTherapy * therapyTypes.length;
    };

    const calculateTotalAmount = () => {
        return formData.pricePerSession * calculateTotalSessions();
    };

    const handleSubmit = async () => {
        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        if (formData.therapyTypes.length === 0) {
            alert('Please select at least one therapy type');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                patientId: selectedPatient.id,
                ...formData,
                sessionTimes,
            };

            const res = await fetch('/api/therapy/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                alert('Therapy plan created successfully!');
                router.push(`/dashboard/therapy/plans/${data.plan.id}`);
            } else {
                alert(data.error || 'Failed to create therapy plan');
            }
        } catch (error) {
            console.error('Error creating plan:', error);
            alert('Failed to create therapy plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Therapy Plan</h1>
                        <p className="text-gray-600">Schedule and manage Panchakarma therapy sessions</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Step 1: Patient Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            1. Select Patient <span className="text-red-500">*</span>
                        </h2>

                        {!selectedPatient ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    placeholder="Search by name, phone, or ID..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    autoFocus
                                />

                                {searching && (
                                    <div className="absolute right-4 top-3.5">
                                        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-teal-600 rounded-full"></div>
                                    </div>
                                )}

                                {showResults && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => selectPatient(patient)}
                                                    className="w-full px-4 py-3 hover:bg-teal-50 text-left border-b last:border-b-0 transition-colors"
                                                >
                                                    <div className="font-semibold text-gray-900">{patient.fullName}</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        ID: {patient.registrationId} • {patient.age} yrs • {patient.gender} • 📞 {patient.phoneNumber}
                                                    </div>
                                                    {patient.constitutionType && (
                                                        <div className="mt-1">
                                                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                                                {patient.constitutionType}
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">No patients found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-500 rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-teal-700 mb-1 font-semibold">✓ SELECTED PATIENT</p>
                                        <p className="text-xl font-bold text-gray-900 mb-2">{selectedPatient.fullName}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-700">
                                            <span>ID: {selectedPatient.registrationId}</span>
                                            <span>{selectedPatient.age} yrs</span>
                                            <span>{selectedPatient.gender}</span>
                                            <span>📞 {selectedPatient.phoneNumber}</span>
                                        </div>
                                        {selectedPatient.constitutionType && (
                                            <div className="mt-2">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                                    {selectedPatient.constitutionType}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setPatientSearch('');
                                        }}
                                        className="px-4 py-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Step 2: Therapy Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            2. Select Therapies <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">Select one or more therapy types for this plan</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {THERAPY_TYPES.map(therapy => (
                                <button
                                    key={therapy.id}
                                    onClick={() => toggleTherapy(therapy.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        formData.therapyTypes.includes(therapy.id)
                                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-green-50 shadow-md'
                                            : 'border-gray-200 hover:border-teal-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-3xl">{therapy.icon}</span>
                                        {formData.therapyTypes.includes(therapy.id) && (
                                            <span className="text-teal-600 text-xl">✓</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{therapy.name}</h3>
                                    <p className="text-xs text-gray-600">{therapy.description}</p>
                                </button>
                            ))}
                        </div>

                        {formData.therapyTypes.length > 0 && (
                            <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                                <p className="text-sm font-medium text-teal-900">
                                    Selected: {formData.therapyTypes.map(id => THERAPY_TYPES.find(t => t.id === id)?.name).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Schedule */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Schedule Sessions</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        max="365"
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-700 font-medium">days</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frequency <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                                    <option value="WEEKLY">Weekly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per Session (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.pricePerSession}
                                    onChange={(e) => setFormData({ ...formData, pricePerSession: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="100"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Session Times (Flexible) */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Session Times (Optional)
                                </label>
                                <button
                                    onClick={addSessionTime}
                                    className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    + Add Time
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                Add multiple times if sessions occur at different times. Times will cycle through sessions.
                            </p>

                            <div className="space-y-2">
                                {sessionTimes.map((time, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => updateSessionTime(index, e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        {sessionTimes.length > 1 && (
                                            <button
                                                onClick={() => removeSessionTime(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Sessions</p>
                                    <p className="text-2xl font-bold text-gray-900">{calculateTotalSessions()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Per Session</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{formData.pricePerSession}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold text-teal-600">₹{calculateTotalAmount().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. Additional Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instructions for Patient
                                </label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    placeholder="E.g., Come empty stomach, avoid cold water, bring loose clothes..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Internal Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Private notes for staff/doctors..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedPatient || formData.therapyTypes.length === 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            {loading ? '⏳ Creating...' : '✓ Create Therapy Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}