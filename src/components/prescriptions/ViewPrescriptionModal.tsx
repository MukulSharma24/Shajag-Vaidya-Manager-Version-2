// ViewPrescriptionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ViewPrescriptionModalProps {
    prescriptionId: string;
    onClose: () => void;
    onEdit: () => void;
    onDispense: () => void;
}

export default function ViewPrescriptionModal({ prescriptionId, onClose, onEdit, onDispense }: ViewPrescriptionModalProps) {
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

    const handlePrint = () => {
        window.print();
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
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

                    {/* Header Info */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="text-base font-semibold text-gray-900">{formatDate(prescription.createdAt)}</p>
                        </div>
                        <div>
                            {getStatusBadge(prescription.status)}
                        </div>
                    </div>

                    {/* Patient Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Patient Information</h3>
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-semibold text-white">
                                        {prescription.patient.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-semibold text-gray-900">{prescription.patient.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {prescription.patient.age}Y • {prescription.patient.gender} • {prescription.patient.phone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinical Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Clinical Assessment</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Chief Complaints</p>
                                <p className="text-sm text-gray-900">{prescription.chiefComplaints}</p>
                            </div>

                            {prescription.symptoms && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Symptoms</p>
                                    <p className="text-sm text-gray-900">{prescription.symptoms}</p>
                                </div>
                            )}

                            {prescription.diagnosis && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
                                    <p className="text-sm text-gray-900">{prescription.diagnosis}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Medicines Prescribed */}
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
                                                <div>
                                                    <span className="text-gray-500">Quantity:</span>
                                                    <span className="ml-1 font-medium text-gray-900">
                                                        {med.quantityNeeded} {med.unitType}
                                                    </span>
                                                </div>
                                            </div>

                                            {med.instructions && (
                                                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                                                    <p className="text-xs text-amber-900">
                                                        <span className="font-medium">Note:</span> {med.instructions}
                                                    </p>
                                                </div>
                                            )}

                                            {med.dispensed && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                        ✓ Dispensed
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Additional Instructions */}
                    {(prescription.instructions || prescription.dietaryAdvice) && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Instructions</h3>
                            <div className="space-y-3">
                                {prescription.instructions && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs font-medium text-blue-900 mb-1">General Instructions</p>
                                        <p className="text-sm text-blue-800">{prescription.instructions}</p>
                                    </div>
                                )}

                                {prescription.dietaryAdvice && (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-xs font-medium text-green-900 mb-1">Dietary Advice (Pathya-Apathya)</p>
                                        <p className="text-sm text-green-800">{prescription.dietaryAdvice}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Follow-up */}
                    {prescription.followUpDate && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-xs font-medium text-purple-900">Follow-up Date</p>
                                    <p className="text-sm text-purple-800">{formatDate(prescription.followUpDate)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="modal-footer">
                    <button onClick={handlePrint} className="btn btn-ghost">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                    {prescription.status === 'COMPLETED' && (
                        <button onClick={onDispense} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Dispense Medicine
                        </button>
                    )}
                    {prescription.status !== 'DISPENSED' && (
                        <button onClick={onEdit} className="btn btn-secondary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
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