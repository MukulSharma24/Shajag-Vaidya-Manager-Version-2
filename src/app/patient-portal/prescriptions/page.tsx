// src/app/patient-portal/prescriptions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientPrescriptionsPage() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrescriptions();
    }, [user?.patientId]);

    const fetchPrescriptions = async () => {
        try {
            if (!user?.patientId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/prescriptions?patientId=${user.patientId}`);
            if (res.ok) {
                const data = await res.json();
                setPrescriptions(data.prescriptions || []);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                <p className="text-gray-600">View your prescriptions and medication history</p>
            </div>

            {prescriptions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">💊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No prescriptions yet</h3>
                    <p className="text-gray-600">
                        Your prescriptions will appear here after your doctor creates them.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                        <div
                            key={prescription.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">
                                                Prescription #{prescription.prescriptionNo}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                prescription.status === 'FINALIZED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {prescription.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(prescription.createdAt)}
                                        </p>
                                    </div>
                                    <button className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg font-medium transition-colors">
                                        View Full
                                    </button>
                                </div>

                                {prescription.diagnosis && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Diagnosis</p>
                                        <p className="text-sm text-gray-800">{prescription.diagnosis}</p>
                                    </div>
                                )}
                            </div>

                            {prescription.medicines && prescription.medicines.length > 0 && (
                                <div className="p-5">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Medications ({prescription.medicines.length})</p>
                                    <div className="space-y-2">
                                        {prescription.medicines.slice(0, 3).map((med: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                    💊
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{med.medicineName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {med.dosageMorning}-{med.dosageAfternoon}-{med.dosageEvening}-{med.dosageNight} | {med.duration} {med.durationUnit}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {prescription.medicines.length > 3 && (
                                            <p className="text-sm text-gray-500 text-center">
                                                +{prescription.medicines.length - 3} more medicines
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {prescription.followUpDate && (
                                <div className="px-5 pb-5">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-blue-800">
                                            Follow-up: {formatDate(prescription.followUpDate)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}