'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Bill {
    id: string;
    billNumber: string;
    patient: { id: string; fullName: string; phoneNumber: string; };
    status: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    createdAt: string;
}

interface QuickIncomeEntry {
    id: string;
    entryNumber: string;
    amount: number;
    description?: string;
    patientName?: string;
    paymentMethod: string;
    referenceNumber?: string;
    category: string;
    receivedDate: string;
}

interface Stats {
    totalBills: number;
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    quickIncomeTotal: number;
    combinedCollected: number;
}

interface PatientSuggestion {
    id: string;
    fullName: string;
    phoneNumber: string;
    registrationId: number;
}

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 border border-gray-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    PARTIAL: 'bg-blue-50 text-blue-700 border border-blue-200',
    PAID: 'bg-green-50 text-green-700 border border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
    OVERDUE: 'bg-red-50 text-red-700 border border-red-200',
};

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER'];
const INCOME_CATEGORIES = [
    { value: 'DIRECT_PAYMENT', label: 'Direct Payment (QR/UPI)' },
    { value: 'CONSULTATION', label: 'Consultation Fee' },
    { value: 'THERAPY', label: 'Therapy Payment' },
    { value: 'MEDICINE', label: 'Medicine Sale' },
    { value: 'OTHER', label: 'Other Income' },
];

const EMPTY_INCOME_FORM = {
    amount: '',
    description: '',
    patientName: '',
    patientId: '',
    paymentMethod: 'UPI',
    referenceNumber: '',
    category: 'DIRECT_PAYMENT',
    receivedDate: new Date().toISOString().split('T')[0],
};

// ── Patient Autocomplete Input ────────────────────────────────────────────────
function PatientAutocomplete({
                                 value,
                                 onChange,
                                 onSelect,
                             }: {
    value: string;
    onChange: (val: string) => void;
    onSelect: (patient: PatientSuggestion) => void;
}) {
    const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInput = (val: string) => {
        onChange(val);
        clearTimeout(debounceRef.current);

        if (val.trim().length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const res = await fetch(`/api/patients?search=${encodeURIComponent(val)}&limit=8`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.patients || []);
                    setShowDropdown(true);
                }
            } catch {
                setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 250);
    };

    const handleSelect = (patient: PatientSuggestion) => {
        onSelect(patient);
        setSuggestions([]);
        setShowDropdown(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Type patient name..."
                    value={value}
                    onChange={(e) => handleInput(e.target.value)}
                    onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none pr-8"
                    autoComplete="off"
                    required
                />
                {searching && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                    {suggestions.map((patient) => (
                        <button
                            key={patient.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(patient); }}
                            className="w-full px-3 py-2.5 text-left hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <p className="text-sm font-medium text-gray-900">{patient.fullName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{patient.phoneNumber} · ID #{patient.registrationId}</p>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && !searching && value.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-center">
                    <p className="text-xs text-gray-500">No patients found for "{value}"</p>
                </div>
            )}
        </div>
    );
}

// ── Quick Income Modal ────────────────────────────────────────────────────────
function QuickIncomeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ ...EMPTY_INCOME_FORM });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handlePatientSelect = (patient: PatientSuggestion) => {
        setForm(f => ({ ...f, patientName: patient.fullName, patientId: patient.id }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (!form.patientName.trim()) {
            setError('Please select a patient');
            return;
        }
        if (!form.patientId) {
            setError('Please select a patient from the dropdown — only existing patients are allowed');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/billing/quick-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Failed to record income');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Record Income</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Log cash, UPI or offline payments received</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Amount + Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) <span className="text-red-400">*</span></label>
                            <input
                                type="number"
                                placeholder="0"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none font-semibold"
                                min="0.01"
                                step="0.01"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-400">*</span></label>
                            <input
                                type="date"
                                value={form.receivedDate}
                                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Patient Autocomplete */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Patient <span className="text-red-400">*</span>
                            <span className="text-gray-400 font-normal ml-1">(existing patients only)</span>
                        </label>
                        <PatientAutocomplete
                            value={form.patientName}
                            onChange={(val) => setForm(f => ({ ...f, patientName: val, patientId: '' }))}
                            onSelect={handlePatientSelect}
                        />
                        {form.patientId && (
                            <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Patient selected
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        >
                            {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setForm({ ...form, paymentMethod: method })}
                                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                                        form.paymentMethod === method
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {method.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reference + Note */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">UPI / Ref No.</label>
                            <input
                                type="text"
                                placeholder="Transaction ID"
                                value={form.referenceNumber}
                                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                            <input
                                type="text"
                                placeholder="Brief description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {form.amount && parseFloat(form.amount) > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-green-700 font-medium">Will be added to profit</span>
                            <span className="text-lg font-bold text-green-700">
                                ₹{parseFloat(form.amount).toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                            {submitting ? 'Recording...' : '+ Record Income'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Billing Page ─────────────────────────────────────────────────────────
export default function BillingPage() {
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [quickIncomeEntries, setQuickIncomeEntries] = useState<QuickIncomeEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'bills' | 'income'>('bills');
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [incomeSuccess, setIncomeSuccess] = useState('');
    const [filter, setFilter] = useState({ status: 'ALL', fromDate: '', toDate: '' });

    useEffect(() => { fetchAll(); }, [filter]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.status !== 'ALL') params.append('status', filter.status);
            if (filter.fromDate) params.append('fromDate', filter.fromDate);
            if (filter.toDate) params.append('toDate', filter.toDate);

            // Fetch bills and quick income in parallel
            const [billsRes, incomeRes] = await Promise.all([
                fetch(`/api/billing/bills?${params.toString()}`),
                fetch(`/api/billing/quick-income?${params.toString()}`),
            ]);

            let quickTotal = 0;
            let billData: any = {};

            if (billsRes.ok) {
                billData = await billsRes.json();
                setBills(billData.bills || []);
            }

            if (incomeRes.ok) {
                const incomeData = await incomeRes.json();
                setQuickIncomeEntries(incomeData.entries || []);
                quickTotal = Number(incomeData.stats?.totalAmount || 0);
            }

            if (billData.stats) {
                const s = billData.stats;
                setStats({
                    totalBills: s.totalBills,
                    totalRevenue: s.totalRevenue,
                    totalPaid: s.totalPaid,
                    totalPending: s.totalPending,
                    quickIncomeTotal: quickTotal,
                    combinedCollected: s.totalPaid + quickTotal,
                });
            }
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIncomeSuccess = () => {
        setIncomeSuccess('Income recorded! It now appears in your P&L report.');
        setTimeout(() => setIncomeSuccess(''), 4000);
        fetchAll();
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

    const getPatientName = (patient: any): string => {
        if (!patient) return '—';
        return patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || '—';
    };

    const getPatientPhone = (patient: any): string => {
        if (!patient) return '';
        return patient.phoneNumber || patient.phone || '';
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Billing & Invoices</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage patient bills and payments</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowIncomeModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Income
                        </button>
                        <button onClick={() => router.push('/dashboard/billing/expenses')} className="px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            Expenses
                        </button>
                        <button onClick={() => router.push('/dashboard/billing/profit-loss')} className="px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            P&L Report
                        </button>
                        <button onClick={() => router.push('/dashboard/billing/create')} className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
                            + Create Bill
                        </button>
                    </div>
                </div>

                {/* Success toast */}
                {incomeSuccess && (
                    <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">{incomeSuccess}</span>
                    </div>
                )}

                {/* Stats Cards — now includes quick income */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Total Bills</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Bill Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Bills Collected</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                        </div>
                        {/* NEW: Quick Income stat */}
                        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                            <p className="text-xs text-green-600 mb-1 font-medium">Direct Income</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.quickIncomeTotal)}</p>
                            <p className="text-xs text-green-500 mt-0.5">QR / Cash / UPI</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            >
                                <option value="ALL">All Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PAID">Paid</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" value={filter.fromDate} onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                                   className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" value={filter.toDate} onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                                   className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => setFilter({ status: 'ALL', fromDate: '', toDate: '' })}
                                    className="w-full px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs: Bills | Direct Income */}
                <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('bills')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bills' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Bills ({bills.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Direct Income
                        {quickIncomeEntries.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                                {quickIncomeEntries.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Bills Table */}
                {activeTab === 'bills' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin h-8 w-8 border-2 border-teal-200 border-t-teal-600 rounded-full" />
                            </div>
                        ) : bills.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-base font-medium text-gray-700 mb-1">No bills found</p>
                                <p className="text-sm text-gray-400">Create your first bill to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {bills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">{bill.billNumber}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{getPatientName(bill.patient)}</p>
                                                {getPatientPhone(bill.patient) && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{getPatientPhone(bill.patient)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(bill.createdAt)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(bill.totalAmount)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(bill.paidAmount)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-yellow-600">{formatCurrency(bill.balanceAmount)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[bill.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {bill.status}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="View">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                                                        <button onClick={() => router.push(`/dashboard/billing/${bill.id}/payment`)}
                                                                className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-500 hover:text-teal-700 transition-colors" title="Record Payment">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Direct Income Table */}
                {activeTab === 'income' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin h-8 w-8 border-2 border-teal-200 border-t-teal-600 rounded-full" />
                            </div>
                        ) : quickIncomeEntries.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-base font-medium text-gray-700 mb-1">No direct income recorded</p>
                                <p className="text-sm text-gray-400 mb-4">Use the green "Income" button to log cash or UPI payments</p>
                                <button onClick={() => setShowIncomeModal(true)}
                                        className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                    + Record Income
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref No.</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {quickIncomeEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-700">{entry.entryNumber}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{entry.patientName || '—'}</p>
                                                {entry.description && <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.receivedDate)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                                                        {INCOME_CATEGORIES.find(c => c.value === entry.category)?.label || entry.category}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.paymentMethod}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">{entry.referenceNumber || '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">{formatCurrency(entry.amount)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    <tfoot>
                                    <tr className="bg-green-50 border-t-2 border-green-200">
                                        <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-green-700">Total Direct Income</td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-700">
                                            {formatCurrency(quickIncomeEntries.reduce((s, e) => s + e.amount, 0))}
                                        </td>
                                    </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showIncomeModal && (
                <QuickIncomeModal
                    onClose={() => setShowIncomeModal(false)}
                    onSuccess={handleIncomeSuccess}
                />
            )}
        </div>
    );
}