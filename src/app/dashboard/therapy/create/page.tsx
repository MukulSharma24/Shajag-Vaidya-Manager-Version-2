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
    { id: 'VAMANA', name: 'Vamana', description: 'Therapeutic vomiting for Kapha disorders' },
    { id: 'VIRECHANA', name: 'Virechana', description: 'Purgation therapy for Pitta disorders' },
    { id: 'BASTI', name: 'Basti', description: 'Medicated enema for Vata disorders' },
    { id: 'NASYA', name: 'Nasya', description: 'Nasal administration of medicines' },
    { id: 'RAKTAMOKSHANA', name: 'Raktamokshana', description: 'Bloodletting therapy' },
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

    const [sessionTimes, setSessionTimes] = useState<string[]>(['10:00']);

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
        setSessionTimes([...sessionTimes, '10:00']);
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
            case 'DAILY': sessionsPerTherapy = duration; break;
            case 'ALTERNATE_DAYS': sessionsPerTherapy = Math.ceil(duration / 2); break;
            case 'WEEKLY': sessionsPerTherapy = duration; break;
            default: sessionsPerTherapy = duration;
        }
        return sessionsPerTherapy * therapyTypes.length;
    };

    const calculateTotalAmount = () => {
        return formData.pricePerSession * calculateTotalSessions();
    };

    const handleSubmit = async () => {
        if (!selectedPatient) { alert('Please select a patient'); return; }
        if (formData.therapyTypes.length === 0) { alert('Please select at least one therapy type'); return; }

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
            <div className="max-w-3xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Create Therapy Plan</h1>
                        <p className="text-sm text-gray-500 mt-1">Schedule and manage Panchakarma therapy sessions</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                </div>

                <div className="space-y-5">

                    {/* Step 1: Patient */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">
                            Patient <span className="text-red-400">*</span>
                        </h2>

                        {!selectedPatient ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    placeholder="Search by name, phone, or ID..."
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                                {searching && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-200 border-t-teal-600 rounded-full" />
                                    </div>
                                )}
                                {showResults && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => selectPatient(patient)}
                                                    className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 transition-colors"
                                                >
                                                    <p className="text-sm font-medium text-gray-800">{patient.fullName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        ID: {patient.registrationId} · {patient.age} yrs · {patient.gender} · {patient.phoneNumber}
                                                    </p>
                                                    {patient.constitutionType && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs">
                                                            {patient.constitutionType}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-4 py-3 text-sm text-gray-400 text-center">No patients found</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{selectedPatient.fullName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        ID: {selectedPatient.registrationId} · {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.phoneNumber}
                                    </p>
                                    {selectedPatient.constitutionType && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs">
                                            {selectedPatient.constitutionType}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Therapies */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-1">
                            Therapy Types <span className="text-red-400">*</span>
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">Select one or more therapy types</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {THERAPY_TYPES.map(therapy => (
                                <button
                                    key={therapy.id}
                                    onClick={() => toggleTherapy(therapy.id)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${
                                        formData.therapyTypes.includes(therapy.id)
                                            ? 'border-teal-400 bg-teal-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-800">{therapy.name}</p>
                                        {formData.therapyTypes.includes(therapy.id) && (
                                            <span className="text-teal-600 text-xs font-semibold">✓</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{therapy.description}</p>
                                </button>
                            ))}
                        </div>

                        {formData.therapyTypes.length > 0 && (
                            <p className="text-xs text-teal-700 mt-3 font-medium">
                                Selected: {formData.therapyTypes.join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Step 3: Schedule */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Schedule</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Start Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Duration <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        max="365"
                                        className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    />
                                    <span className="text-sm text-gray-500">days</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Frequency <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                                    <option value="WEEKLY">Weekly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Price per Session (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.pricePerSession}
                                    onChange={(e) => setFormData({ ...formData, pricePerSession: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="100"
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Session Times */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-gray-600">Session Times (Optional)</label>
                                <button
                                    onClick={addSessionTime}
                                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                                >
                                    + Add Time
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">Times will cycle through sessions if multiple are added.</p>
                            <div className="space-y-2">
                                {sessionTimes.map((time, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => updateSessionTime(index, e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                        />
                                        {sessionTimes.length > 1 && (
                                            <button
                                                onClick={() => removeSessionTime(index)}
                                                className="text-red-400 hover:text-red-600 text-sm px-2"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Total Sessions</p>
                                    <p className="text-xl font-bold text-gray-800">{calculateTotalSessions()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Per Session</p>
                                    <p className="text-xl font-bold text-gray-800">₹{formData.pricePerSession}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                                    <p className="text-xl font-bold text-teal-600">₹{calculateTotalAmount().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Notes */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Additional Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Patient Instructions
                                </label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    placeholder="E.g., Come empty stomach, avoid cold water..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Internal Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Private notes for staff/doctors..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedPatient || formData.therapyTypes.length === 0}
                            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Therapy Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}