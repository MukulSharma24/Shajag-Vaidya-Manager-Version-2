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
}

export default function CreateBillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);

    const [billData, setBillData] = useState({
        patientId: '',
        status: 'DRAFT',
        subtotal: 0,
        discountAmount: 0,
        discountPercentage: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: '',
    });

    const [billItems, setBillItems] = useState([
        {
            itemName: '',
            itemType: 'CONSULTATION',
            quantity: 1,
            unitPrice: 0,
            taxPercentage: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
        },
    ]);

    // Search patients with debounce
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
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchPatients, 300);
        return () => clearTimeout(timer);
    }, [patientSearch]);

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setBillData({ ...billData, patientId: patient.id });
        setPatientSearch(`${patient.fullName} (ID: ${patient.registrationId})`);
        setShowResults(false);
        setSearchResults([]);
    };

    const clearPatient = () => {
        setSelectedPatient(null);
        setPatientSearch('');
        setBillData({ ...billData, patientId: '' });
        setSearchResults([]);
        setShowResults(false);
    };

    const addBillItem = () => {
        setBillItems([
            ...billItems,
            {
                itemName: '',
                itemType: 'CONSULTATION',
                quantity: 1,
                unitPrice: 0,
                taxPercentage: 0,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: 0,
            },
        ]);
    };

    const removeBillItem = (index: number) => {
        if (billItems.length > 1) {
            const updated = billItems.filter((_, i) => i !== index);
            setBillItems(updated);
            calculateTotals(updated, billData.discountAmount, billData.discountPercentage);
        }
    };

    const updateBillItem = (index: number, field: string, value: any) => {
        const updated = [...billItems];
        updated[index] = { ...updated[index], [field]: value };

        const item = updated[index];
        const subtotal = item.quantity * item.unitPrice;
        const tax = (subtotal * item.taxPercentage) / 100;
        item.taxAmount = tax;
        item.totalAmount = subtotal + tax - item.discountAmount;

        setBillItems(updated);
        calculateTotals(updated, billData.discountAmount, billData.discountPercentage);
    };

    const calculateTotals = (items: typeof billItems, discountAmt: number, discountPct: number) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const itemDiscounts = items.reduce((sum, item) => sum + item.discountAmount, 0);

        let billDiscount = discountAmt;
        if (discountPct > 0) {
            billDiscount = (subtotal * discountPct) / 100;
        }

        const totalAmount = Math.max(0, subtotal + taxAmount - billDiscount - itemDiscounts);

        setBillData(prev => ({
            ...prev,
            subtotal,
            taxAmount,
            discountAmount: billDiscount,
            totalAmount,
        }));
    };

    const handleDiscountAmountChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        setBillData(prev => ({ ...prev, discountAmount: numValue, discountPercentage: 0 }));
        calculateTotals(billItems, numValue, 0);
    };

    const handleDiscountPercentageChange = (value: string) => {
        const numValue = Math.min(parseFloat(value) || 0, 100);
        const subtotal = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = (subtotal * numValue) / 100;
        setBillData(prev => ({ ...prev, discountPercentage: numValue, discountAmount }));
        calculateTotals(billItems, discountAmount, numValue);
    };

    const applyQuickDiscount = (percentage: number) => {
        const subtotal = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = (subtotal * percentage) / 100;
        setBillData(prev => ({ ...prev, discountPercentage: percentage, discountAmount }));
        calculateTotals(billItems, discountAmount, percentage);
    };

    const handleSubmit = async (status: 'DRAFT' | 'PENDING') => {
        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        if (billItems.some(item => !item.itemName || item.unitPrice <= 0)) {
            alert('Please fill in all bill items with valid prices');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/billing/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: billData.patientId,
                    billItems: billItems,
                    discountAmount: billData.discountAmount,
                    discountPercentage: billData.discountPercentage,
                    notes: billData.notes,
                    status,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Bill ${status === 'DRAFT' ? 'saved as draft' : 'created'} successfully!`);
                router.push('/dashboard/billing');
            } else {
                alert(data.error || 'Failed to create bill');
                console.error('Bill creation error:', data);
            }
        } catch (error) {
            console.error('Bill creation error:', error);
            alert('Failed to create bill. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    const quickDiscounts = [5, 10, 15, 20];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Bill</h1>
                        <p className="text-gray-600">Generate invoice for patient consultation and services</p>
                    </div>
                    <button onClick={() => router.back()} className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors">
                        ← Back
                    </button>
                </div>

                {/* Patient Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Information</h2>

                    {!selectedPatient ? (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Patient <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                placeholder="Type patient name, ID, phone, or email..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                autoFocus
                            />

                            {searching && (
                                <div className="absolute right-4 top-[42px] text-gray-400">
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
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{patient.fullName}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium text-teal-600">ID: {patient.registrationId}</span>
                                                            {' • '}📞 {patient.phoneNumber}
                                                            {patient.email && ` • ✉️ ${patient.email}`}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-xs text-gray-500">{patient.age} yrs • {patient.gender}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">No patients found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-500 rounded-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-teal-700 mb-1 font-semibold">✓ SELECTED PATIENT</p>
                                    <p className="text-2xl font-bold text-gray-900 mb-2">{selectedPatient.fullName}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-700">
                                        <span className="font-semibold text-teal-700">ID: {selectedPatient.registrationId}</span>
                                        <span>📞 {selectedPatient.phoneNumber}</span>
                                        <span>{selectedPatient.age} yrs</span>
                                        <span>{selectedPatient.gender}</span>
                                    </div>
                                    {selectedPatient.email && <p className="text-sm text-gray-600 mt-2">✉️ {selectedPatient.email}</p>}
                                </div>
                                <button onClick={clearPatient} className="px-4 py-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold transition-colors">
                                    Change
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bill Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Bill Items</h2>
                        <button onClick={addBillItem} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm hover:shadow">
                            + Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700 min-w-[200px]">Item Name</th>
                                <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700 min-w-[150px]">Type</th>
                                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 w-24">Qty</th>
                                <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700 w-32">Price (₹)</th>
                                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700 w-24">Tax (%)</th>
                                <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700 w-32">Total (₹)</th>
                                <th className="py-3 px-3 w-12"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {billItems.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-3">
                                        <input
                                            type="text"
                                            value={item.itemName}
                                            onChange={(e) => updateBillItem(index, 'itemName', e.target.value)}
                                            placeholder="e.g., Consultation"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-3">
                                        <select
                                            value={item.itemType}
                                            onChange={(e) => updateBillItem(index, 'itemType', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                        >
                                            <option value="CONSULTATION">Consultation</option>
                                            <option value="MEDICINE">Medicine</option>
                                            <option value="THERAPY">Therapy</option>
                                            <option value="LAB_TEST">Lab Test</option>
                                            <option value="PROCEDURE">Procedure</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </td>
                                    <td className="py-3 px-3">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                updateBillItem(index, 'quantity', parseInt(val) || 1);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-center transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-3">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={item.unitPrice || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                updateBillItem(index, 'unitPrice', parseFloat(val) || 0);
                                            }}
                                            placeholder="0"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-right transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-3">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={item.taxPercentage || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                const num = parseFloat(val) || 0;
                                                updateBillItem(index, 'taxPercentage', Math.min(num, 100));
                                            }}
                                            placeholder="0"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-center transition-all"
                                        />
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(item.totalAmount)}</td>
                                    <td className="py-3 px-3 text-center">
                                        {billItems.length > 1 && (
                                            <button
                                                onClick={() => removeBillItem(index)}
                                                className="text-red-600 hover:text-white hover:bg-red-600 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-xl transition-all"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Discount */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Discount</h3>
                            <div className="flex gap-2 mb-3">
                                {quickDiscounts.map((pct) => (
                                    <button
                                        key={pct}
                                        onClick={() => applyQuickDiscount(pct)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                            billData.discountPercentage === pct
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={billData.discountAmount || ''}
                                        onChange={(e) => handleDiscountAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Percentage (%)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={billData.discountPercentage || ''}
                                        onChange={(e) => handleDiscountPercentageChange(e.target.value.replace(/[^0-9.]/g, ''))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(billData.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Tax:</span>
                                    <span className="font-semibold">{formatCurrency(billData.taxAmount)}</span>
                                </div>
                                {billData.discountAmount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-{formatCurrency(billData.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                                    <span className="text-3xl font-bold text-teal-600">{formatCurrency(billData.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            value={billData.notes}
                            onChange={(e) => setBillData({ ...billData, notes: e.target.value })}
                            placeholder="Add any additional notes or special instructions..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-3.5 rounded-xl bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit('DRAFT')}
                        disabled={loading || !selectedPatient}
                        className="flex-1 px-6 py-3.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    >
                        💾 Save as Draft
                    </button>
                    <button
                        onClick={() => handleSubmit('PENDING')}
                        disabled={loading || !selectedPatient}
                        className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg"
                    >
                        {loading ? '⏳ Creating...' : '✓ Create Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
}