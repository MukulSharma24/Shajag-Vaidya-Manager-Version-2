'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

interface ConstitutionData {
    labels: string[];
    data: number[];
}

interface PatientFlowData {
    labels: string[];
    newPatients: number[];
    followUps: number[];
}

export default function ChartsSection() {
    const constitutionChartRef = useRef<HTMLCanvasElement>(null);
    const patientFlowChartRef = useRef<HTMLCanvasElement>(null);
    const constitutionChartInstance = useRef<Chart | null>(null);
    const patientFlowChartInstance = useRef<Chart | null>(null);

    const [constitutionData, setConstitutionData] = useState<ConstitutionData | null>(null);
    const [patientFlowData, setPatientFlowData] = useState<PatientFlowData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch constitution distribution data
    const fetchConstitutionData = async () => {
        try {
            const response = await fetch('/api/dashboard/charts/constitution');
            if (response.ok) {
                const data = await response.json();
                setConstitutionData(data);
            }
        } catch (error) {
            console.error('Error fetching constitution data:', error);
        }
    };

    // Fetch patient flow data
    const fetchPatientFlowData = async () => {
        try {
            const response = await fetch('/api/dashboard/charts/patient-flow');
            if (response.ok) {
                const data = await response.json();
                setPatientFlowData(data);
            }
        } catch (error) {
            console.error('Error fetching patient flow data:', error);
        }
    };

    // Initial data fetch
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchConstitutionData(),
                fetchPatientFlowData()
            ]);
            setLoading(false);
        };

        loadData();

        // Refresh data every 60 seconds
        const interval = setInterval(() => {
            fetchConstitutionData();
            fetchPatientFlowData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Update Constitution Chart when data changes
    useEffect(() => {
        if (!constitutionData || !constitutionChartRef.current) return;

        const ctx = constitutionChartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (constitutionChartInstance.current) {
            constitutionChartInstance.current.destroy();
        }

        // Define colors for each constitution type
        const colorMap: Record<string, string> = {
            'Vata': 'rgba(34, 197, 94, 0.8)',      // Green
            'Pitta': 'rgba(239, 68, 68, 0.8)',     // Red
            'Kapha': 'rgba(245, 158, 11, 0.8)',    // Amber
            'Vata-Pitta': 'rgba(59, 130, 246, 0.8)', // Blue
            'Pitta-Kapha': 'rgba(168, 85, 247, 0.8)', // Purple
            'Vata-Kapha': 'rgba(236, 72, 153, 0.8)',  // Pink
            'Tridosha': 'rgba(20, 184, 166, 0.8)',    // Teal
            'No Data': 'rgba(156, 163, 175, 0.8)'     // Gray
        };

        const backgroundColors = constitutionData.labels.map(
            label => colorMap[label] || 'rgba(156, 163, 175, 0.8)'
        );

        const constitutionConfig: ChartConfiguration<'doughnut'> = {
            type: 'doughnut',
            data: {
                labels: constitutionData.labels,
                datasets: [{
                    data: constitutionData.data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        constitutionChartInstance.current = new Chart(ctx, constitutionConfig);
    }, [constitutionData]);

    // Update Patient Flow Chart when data changes
    useEffect(() => {
        if (!patientFlowData || !patientFlowChartRef.current) return;

        const ctx = patientFlowChartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (patientFlowChartInstance.current) {
            patientFlowChartInstance.current.destroy();
        }

        const patientFlowConfig: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels: patientFlowData.labels,
                datasets: [
                    {
                        label: 'New Patients',
                        data: patientFlowData.newPatients,
                        borderColor: 'rgba(251, 146, 60, 1)',
                        backgroundColor: 'rgba(251, 146, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Follow-ups',
                        data: patientFlowData.followUps,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            precision: 0 // Show whole numbers only
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        patientFlowChartInstance.current = new Chart(ctx, patientFlowConfig);
    }, [patientFlowData]);

    // Cleanup charts on unmount
    useEffect(() => {
        return () => {
            if (constitutionChartInstance.current) {
                constitutionChartInstance.current.destroy();
            }
            if (patientFlowChartInstance.current) {
                patientFlowChartInstance.current.destroy();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loading skeleton for Constitutional Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="relative h-[300px] flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse"></div>
                    </div>
                </div>

                {/* Loading skeleton for Monthly Patient Flow */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="relative h-[300px] flex items-center justify-center">
                        <div className="w-full h-full bg-gray-200 animate-pulse rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Constitutional Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Constitutional Distribution</h3>
                <div className="relative h-[300px]">
                    <canvas ref={constitutionChartRef}></canvas>
                </div>
            </div>

            {/* Monthly Patient Flow Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Monthly Patient Flow</h3>
                <div className="relative h-[300px]">
                    <canvas ref={patientFlowChartRef}></canvas>
                </div>
            </div>
        </div>
    );
}