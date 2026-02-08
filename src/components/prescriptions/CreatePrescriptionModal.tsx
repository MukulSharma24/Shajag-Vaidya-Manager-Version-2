// CreatePrescriptionModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Patient {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email?: string;
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

interface CreatePrescriptionModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePrescriptionModal({ onClose, onSuccess }: CreatePrescriptionModalProps) {
    // Patient selection
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // Patient history (Phase 2)
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Form data
    const [chiefComplaints, setChiefComplaints] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [instructions, setInstructions] = useState('');
    const [dietaryAdvice, setDietaryAdvice] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'COMPLETED'>('COMPLETED');

    // Medicines
    const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
    const [editingMedicineIndex, setEditingMedicineIndex] = useState<number | null>(null);

    const [submitting, setSubmitting] = useState(false);

    // Refs for dropdowns
    const patientDropdownRef = useRef<HTMLDivElement>(null);
    const medicineDropdownRef = useRef<HTMLDivElement>(null);

    // Search patients
    useEffect(() => {
        if (patientSearch.length >= 2) {
            searchPatients(patientSearch);
        } else {
            setPatients([]);
        }
    }, [patientSearch]);

    // Search medicines
    useEffect(() => {
        if (medicineSearch.length >= 2) {
            searchMedicines(medicineSearch);
        } else {
            setMedicineResults([]);
        }
    }, [medicineSearch]);

    // Load patient history when patient selected (Phase 2)
    useEffect(() => {
        if (selectedPatient) {
            loadPatientHistory(selectedPatient.id);
        }
    }, [selectedPatient]);

    // Close dropdowns on outside click
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

    const searchPatients = async (query: string) => {
        try {
            const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.patients || data || []);
                setShowPatientDropdown(true);
            }
        } catch (error) {
            console.error('Error searching patients:', error);
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
        setPatientSearch(patient.name);
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
            quantityNeeded: calculateQuantity(1, 0, 1, 0, 5),
            unitType: medicine.unit,
            stockAvailable: medicine.currentStock,
        };

        setMedicines([...medicines, newMedicine]);
        setMedicineSearch('');
        setShowMedicineDropdown(false);
    };

    const calculateQuantity = (morning: number, afternoon: number, evening: number, night: number, days: number) => {
        const perDay = morning + afternoon + evening + night;
        return Math.ceil(perDay * days);
    };

    const updateMedicine = (index: number, field: string, value: any) => {
        const updated = [...medicines];
        updated[index] = { ...updated[index], [field]: value };

        // Recalculate quantity if dosage or duration changes
        if (['dosageMorning', 'dosageAfternoon', 'dosageEvening', 'dosageNight', 'duration'].includes(field)) {
            const med = updated[index];
            updated[index].quantityNeeded = calculateQuantity(
                med.dosageMorning,
                med.dosageAfternoon,
                med.dosageEvening,
                med.dosageNight,
                med.duration
            );
        }

        setMedicines(updated);
    };

    const setDosageTemplate = (index: number, template: string) => {
        const templates: { [key: string]: [number, number, number, number] } = {
            '1-0-1': [1, 0, 1, 0],
            '1-1-1': [1, 1, 1, 0],
            '0-0-1': [0, 0, 1, 0],
            '1-0-0': [1, 0, 0, 0],
            '0-1-0': [0, 1, 0, 0],
            '1-1-0': [1, 1, 0, 0],
            '0-1-1': [0, 1, 1, 0],
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

        updated[index].quantityNeeded = calculateQuantity(morning, afternoon, evening, night, updated[index].duration);
        setMedicines(updated);
    };

    const removeMedicine = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    // Copy from previous prescription (Phase 2)
    const copyFromPrevious = (prescription: any) => {
        setChiefComplaints(prescription.chiefComplaints || '');
        setDiagnosis(prescription.diagnosis || '');

        // Copy medicines
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

        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        if (!chiefComplaints.trim()) {
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
                    symptoms: symptoms || null,
                    diagnosis: diagnosis || null,
                    medicines,
                    instructions: instructions || null,
                    dietaryAdvice: dietaryAdvice || null,
                    followUpDate: followUpDate || null,
                    status,
                    createdBy: 'current-user-id', // Replace with actual user ID
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
                                    onFocus={() => patientSearch.length >= 2 && setShowPatientDropdown(true)}
                                    placeholder="Type patient name or phone..."
                                    className="form-input"
                                    required
                                />

                                {/* Patient Dropdown */}
                                {showPatientDropdown && patients.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {patients.map((patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={() => selectPatient(patient)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-teal-700">
                                                            {patient.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {patient.age}Y • {patient.gender} • {patient.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Patient Info */}
                            {selectedPatient && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-teal-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                                <span className="text-base font-semibold text-teal-700">
                                                    {selectedPatient.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                                                <p className="text-xs text-gray-600">
                                                    {selectedPatient.age}Y • {selectedPatient.gender} • {selectedPatient.phone}
                                                </p>
                                            </div>
                                        </div>
                                        {patientHistory.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="btn btn-sm btn-ghost text-teal-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                View History ({patientHistory.length})
                                            </button>
                                        )}
                                    </div>

                                    {/* Patient History (Phase 2) */}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Symptoms</label>
                                        <textarea
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            rows={2}
                                            className="form-textarea"
                                            placeholder="Additional symptoms..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Diagnosis</label>
                                        <textarea
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            rows={2}
                                            className="form-textarea"
                                            placeholder="e.g., Viral Fever, Upper Respiratory Infection..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Medicines Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Medicines Prescribed</h3>
                                <span className="text-xs text-gray-500">{medicines.length} medicine(s) added</span>
                            </div>

                            {/* Medicine Search */}
                            <div className="relative mb-4" ref={medicineDropdownRef}>
                                <label className="form-label">Search & Add Medicine</label>
                                <input
                                    type="text"
                                    value={medicineSearch}
                                    onChange={(e) => setMedicineSearch(e.target.value)}
                                    onFocus={() => medicineSearch.length >= 2 && setShowMedicineDropdown(true)}
                                    placeholder="Type medicine name..."
                                    className="form-input"
                                />

                                {/* Medicine Dropdown with Stock Info (Phase 2) */}
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

                            {/* Added Medicines List */}
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
                                                        Stock: {med.stockAvailable} {med.unitType} • Need: {med.quantityNeeded} {med.unitType}
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

                                            {/* Dosage Templates */}
                                            <div className="mb-3">
                                                <label className="form-label text-xs">Dosage</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', '1-1-0', '0-1-1'].map((template) => (
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

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                                                    <label className="form-label text-xs">Unit</label>
                                                    <select
                                                        value={med.durationUnit}
                                                        onChange={(e) => updateMedicine(index, 'durationUnit', e.target.value)}
                                                        className="form-select text-sm"
                                                    >
                                                        <option value="DAYS">Days</option>
                                                        <option value="WEEKS">Weeks</option>
                                                        <option value="MONTHS">Months</option>
                                                    </select>
                                                </div>

                                                <div className="form-group md:col-span-2">
                                                    <label className="form-label text-xs">Timing</label>
                                                    <select
                                                        value={med.timing}
                                                        onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                                                        className="form-select text-sm"
                                                    >
                                                        <option>After Food</option>
                                                        <option>Before Food</option>
                                                        <option>Empty Stomach</option>
                                                        <option>With Food</option>
                                                        <option>Anytime</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-group mt-3">
                                                <label className="form-label text-xs">Instructions</label>
                                                <input
                                                    type="text"
                                                    value={med.instructions}
                                                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                                                    placeholder="e.g., Take with warm water..."
                                                    className="form-input text-sm"
                                                />
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
                                        placeholder="e.g., Take complete rest, avoid cold beverages..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Dietary Advice (Pathya-Apathya)</label>
                                    <textarea
                                        value={dietaryAdvice}
                                        onChange={(e) => setDietaryAdvice(e.target.value)}
                                        rows={2}
                                        className="form-textarea"
                                        placeholder="e.g., Light, warm food. Avoid spicy and oily food..."
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