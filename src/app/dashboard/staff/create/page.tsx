'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateStaffPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');

    // Salary type state
    const [salaryType, setSalaryType] = useState<'CONSOLIDATED' | 'DIVIDED'>('CONSOLIDATED');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'DOCTOR',
        dateOfBirth: '',
        gender: 'MALE',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        aadhaarNumber: '',
        panNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        department: '',
        designation: '',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        qualification: '',
        specialization: '',
        experienceYears: 0,
        // Consolidated salary
        consolidatedSalary: 0,
        // Divided salary components
        basicSalary: 0,
        hra: 0,
        da: 0,
        pf: 0,
        otherAllowances: 0,
        // Banking
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        // Access
        canLogin: false,
        userPassword: '',
        status: 'ACTIVE'
    });

    const autoCalculateHRA = () => {
        setFormData(prev => ({ ...prev, hra: Math.round(prev.basicSalary * 0.4) }));
    };

    const autoCalculateDA = () => {
        setFormData(prev => ({ ...prev, da: Math.round(prev.basicSalary * 0.1) }));
    };

    const autoCalculatePF = () => {
        setFormData(prev => ({ ...prev, pf: Math.round(prev.basicSalary * 0.12) }));
    };

    const calculateDividedTotal = () => {
        return formData.basicSalary + formData.hra + formData.da + formData.otherAllowances - formData.pf;
    };

    // ✅ Validate step 5 before submitting
    const validateStep5 = (): string | null => {
        if (formData.canLogin) {
            if (!formData.userPassword) return 'Please enter a password for system login.';
            if (formData.userPassword.length < 6) return 'Password must be at least 6 characters.';
        }
        return null;
    };

    const handleSubmit = async (e?: React.MouseEvent | React.FormEvent) => {
        e?.preventDefault();
        setErrorMessage('');

        // Only run actual submission on step 5
        if (currentStep !== 5) {
            return;
        }

        // Validate step 5 fields
        const step5Error = validateStep5();
        if (step5Error) {
            setErrorMessage(step5Error);
            return;
        }

        try {
            setLoading(true);

            // ✅ FIXED: Get clinicId safely — try localStorage first, then cookie
            let clinicId = 'default-clinic';
            if (typeof window !== 'undefined') {
                clinicId = localStorage.getItem('clinicId') ||
                    sessionStorage.getItem('clinicId') ||
                    'default-clinic';
            }

            // Prepare salary data based on type
            let salaryData = {};
            if (salaryType === 'CONSOLIDATED') {
                salaryData = {
                    basicSalary: formData.consolidatedSalary,
                    hra: 0,
                    allowances: 0,
                    otherAllowances: 0
                };
            } else {
                salaryData = {
                    basicSalary: formData.basicSalary,
                    hra: formData.hra,
                    allowances: formData.da,
                    otherAllowances: formData.otherAllowances
                };
            }

            const payload = {
                ...formData,
                ...salaryData,
                clinicId,
                experienceYears: parseInt(formData.experienceYears.toString()) || 0,
            };

            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/dashboard/staff');
            } else {
                // ✅ Show error inline instead of alert
                setErrorMessage(data.error || data.details || 'Failed to add staff member');
            }
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        setErrorMessage('');
    };

    const steps = [
        { number: 1, title: 'Personal Info', icon: '👤' },
        { number: 2, title: 'Employment', icon: '💼' },
        { number: 3, title: 'Salary', icon: '💰' },
        { number: 4, title: 'Banking', icon: '🏦' },
        { number: 5, title: 'Access', icon: '🔐' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors"
                    >
                        ← Back
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Staff Member</h1>
                            <p className="text-gray-600">Complete the onboarding process</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-teal-600">{currentStep}/5</div>
                            <div className="text-sm text-gray-500">Steps Complete</div>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                                        currentStep >= step.number
                                            ? 'bg-teal-600 text-white shadow-lg scale-110'
                                            : 'bg-gray-200 text-gray-400'
                                    }`}>
                                        {currentStep > step.number ? '✓' : step.icon}
                                    </div>
                                    <div className={`mt-2 text-xs font-medium ${
                                        currentStep >= step.number ? 'text-teal-600' : 'text-gray-400'
                                    }`}>
                                        {step.title}
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 transition-all ${
                                        currentStep > step.number ? 'bg-teal-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">👤</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                                    <p className="text-sm text-gray-600">Basic details about the staff member</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="+91 XXXXX XXXXX"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Street address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Employment Details */}
                    {currentStep === 2 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">💼</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Employment Details</h2>
                                    <p className="text-sm text-gray-600">Role and professional information</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="DOCTOR">Doctor</option>
                                        <option value="RECEPTIONIST">Receptionist</option>
                                        <option value="THERAPIST">Therapist</option>
                                        <option value="PHARMACIST">Pharmacist</option>
                                        <option value="NURSE">Nurse</option>
                                        <option value="LAB_TECHNICIAN">Lab Technician</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="e.g., Senior Doctor, Head Nurse"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="e.g., Cardiology, Administration"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Joining Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.joiningDate}
                                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Employment Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="INTERN">Intern</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (Years)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Qualification</label>
                                    <input
                                        type="text"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="e.g., MBBS, B.Pharm, M.Sc"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="e.g., Cardiologist, Pediatrics"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Salary Details */}
                    {currentStep === 3 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Salary Structure</h2>
                                    <p className="text-sm text-gray-600">Choose salary type and enter details</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setSalaryType('CONSOLIDATED')}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                                        salaryType === 'CONSOLIDATED'
                                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-green-50 shadow-lg scale-105'
                                            : 'border-gray-200 hover:border-teal-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">💵</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">Consolidated Salary</h3>
                                            <p className="text-sm text-gray-600">Single fixed amount (all-inclusive)</p>
                                            {salaryType === 'CONSOLIDATED' && <div className="mt-3 text-teal-600 font-semibold text-sm">✓ Selected</div>}
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSalaryType('DIVIDED')}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                                        salaryType === 'DIVIDED'
                                            ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-green-50 shadow-lg scale-105'
                                            : 'border-gray-200 hover:border-teal-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">📊</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">Divided Salary</h3>
                                            <p className="text-sm text-gray-600">Break down into components (Basic, HRA, DA, PF)</p>
                                            {salaryType === 'DIVIDED' && <div className="mt-3 text-teal-600 font-semibold text-sm">✓ Selected</div>}
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {salaryType === 'CONSOLIDATED' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Consolidated Salary (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.consolidatedSalary || ''}
                                            onChange={(e) => setFormData({ ...formData, consolidatedSalary: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-lg font-semibold"
                                            placeholder="Enter total fixed salary"
                                        />
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
                                        <p className="text-sm text-gray-600 mb-1">Total Monthly Salary</p>
                                        <p className="text-4xl font-bold text-teal-600">₹{formData.consolidatedSalary.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {salaryType === 'DIVIDED' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Basic Salary (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.basicSalary || ''}
                                            onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                            placeholder="Enter basic salary"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-gray-700">HRA (₹)</label>
                                                <button type="button" onClick={autoCalculateHRA} className="px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-xs font-medium">Auto (40%)</button>
                                            </div>
                                            <input type="number" min="0" value={formData.hra || ''} onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="House Rent Allowance" />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-gray-700">DA (₹)</label>
                                                <button type="button" onClick={autoCalculateDA} className="px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-xs font-medium">Auto (10%)</button>
                                            </div>
                                            <input type="number" min="0" value={formData.da || ''} onChange={(e) => setFormData({ ...formData, da: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Dearness Allowance" />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-gray-700">PF Deduction (₹)</label>
                                                <button type="button" onClick={autoCalculatePF} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium">Auto (12%)</button>
                                            </div>
                                            <input type="number" min="0" value={formData.pf || ''} onChange={(e) => setFormData({ ...formData, pf: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Provident Fund" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Other Allowances (₹)</label>
                                            <input type="number" min="0" value={formData.otherAllowances || ''} onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Medical, Transport, etc." />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-gray-900 mb-4">Salary Breakdown</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-gray-600">Basic:</span><span className="font-semibold">₹{formData.basicSalary.toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">HRA:</span><span className="font-semibold text-green-600">+ ₹{formData.hra.toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">DA:</span><span className="font-semibold text-green-600">+ ₹{formData.da.toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Other:</span><span className="font-semibold text-green-600">+ ₹{formData.otherAllowances.toLocaleString()}</span></div>
                                            <div className="flex justify-between text-red-600"><span>PF:</span><span className="font-semibold">- ₹{formData.pf.toLocaleString()}</span></div>
                                            <div className="pt-2 border-t-2 border-gray-300 flex justify-between">
                                                <span className="font-bold">Total:</span>
                                                <span className="text-2xl font-bold text-teal-600">₹{calculateDividedTotal().toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Banking Details */}
                    {currentStep === 4 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🏦</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Banking Information</h2>
                                    <p className="text-sm text-gray-600">Account details for salary payment (optional)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                                    <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g., State Bank of India" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                                    <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="XXXXXXXXXXXX" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                                    <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="SBIN0001234" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: System Access */}
                    {currentStep === 5 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">🔐</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">System Access</h2>
                                    <p className="text-sm text-gray-600">Set up login credentials now, or skip and do it later</p>
                                </div>
                            </div>

                            {/* Inline error message */}
                            {errorMessage && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <span className="text-red-500 text-lg">⚠️</span>
                                    <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                                </div>
                            )}

                            {/* Choice Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Option: Create Login Now */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, canLogin: true, userPassword: '' });
                                        setErrorMessage('');
                                    }}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                                        formData.canLogin
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">🔓</div>
                                        <div>
                                            <p className="font-bold text-gray-900 mb-1">Create Login Now</p>
                                            <p className="text-sm text-gray-500">Set a password so this staff member can log in immediately</p>
                                            {formData.canLogin && <p className="mt-2 text-blue-600 text-xs font-semibold">✓ Selected</p>}
                                        </div>
                                    </div>
                                </button>

                                {/* Option: Skip */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, canLogin: false, userPassword: '' });
                                        setErrorMessage('');
                                    }}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                                        !formData.canLogin
                                            ? 'border-gray-400 bg-gray-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">🔒</div>
                                        <div>
                                            <p className="font-bold text-gray-900 mb-1">Skip for Now</p>
                                            <p className="text-sm text-gray-500">Add the staff profile first — create login credentials later from their profile page</p>
                                            {!formData.canLogin && <p className="mt-2 text-gray-500 text-xs font-semibold">✓ Selected</p>}
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Password field — only shown when Create Login is selected */}
                            {formData.canLogin && (
                                <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-2">
                                        <span>🔑</span>
                                        <span>Login Email: <strong>{formData.email || '(set in Step 1)'}</strong></span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.userPassword}
                                            onChange={(e) => {
                                                setFormData({ ...formData, userPassword: e.target.value });
                                                setErrorMessage('');
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                            placeholder="Enter a secure password (min. 6 characters)"
                                            autoFocus
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                                    </div>

                                    {/* Password strength indicator */}
                                    {formData.userPassword.length > 0 && (
                                        <div>
                                            <div className="flex gap-1 mt-2">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                                                        formData.userPassword.length >= i * 3
                                                            ? i <= 1 ? 'bg-red-400'
                                                                : i <= 2 ? 'bg-yellow-400'
                                                                    : i <= 3 ? 'bg-blue-400'
                                                                        : 'bg-green-500'
                                                            : 'bg-gray-200'
                                                    }`} />
                                                ))}
                                            </div>
                                            <p className={`text-xs mt-1 ${
                                                formData.userPassword.length < 6 ? 'text-red-500' : 'text-green-600'
                                            }`}>
                                                {formData.userPassword.length < 6
                                                    ? `Need ${6 - formData.userPassword.length} more characters`
                                                    : '✓ Password length is good'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Skip info box */}
                            {!formData.canLogin && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <span className="text-amber-500 text-lg">💡</span>
                                    <p className="text-amber-800 text-sm">
                                        You can always create login credentials later by opening the staff profile and clicking the <strong>"Create Login"</strong> button.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex-1 px-6 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                            >
                                ← Previous
                            </button>
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                Next Step →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                            >
                                {loading
                                    ? '⏳ Adding Staff...'
                                    : formData.canLogin
                                        ? '✓ Add Staff & Create Login'
                                        : '✓ Add Staff Member'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}