'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateStaffPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', role: 'RECEPTIONIST',
        dateOfBirth: '', gender: 'MALE', addressLine1: '', city: '', state: '', pincode: '',
        aadhaarNumber: '', panNumber: '', emergencyContactName: '', emergencyContactPhone: '',
        department: '', designation: '', joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME', qualification: '', specialization: '', experienceYears: 0,
        basicSalary: 0, allowances: 0, hra: 0, bankName: '', accountNumber: '', ifscCode: '',
        canLogin: false, userPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert('Staff added successfully!');
                router.push('/dashboard/staff');
            } else {
                alert('Failed to add staff');
            }
        } catch (error) {
            alert('Error adding staff');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Staff Member</h1>
                        <p className="text-gray-600">Complete staff onboarding form</p>
                    </div>
                    <button onClick={() => router.back()} className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border">← Back</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="First Name *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                            <input type="text" placeholder="Last Name *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                            <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                            <input type="tel" placeholder="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                            <input type="date" placeholder="Date of Birth" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="px-4 py-3 rounded-xl border" />
                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="px-4 py-3 rounded-xl border">
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Employment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="px-4 py-3 rounded-xl border" required>
                                <option value="DOCTOR">Doctor</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                                <option value="THERAPIST">Therapist</option>
                                <option value="PHARMACIST">Pharmacist</option>
                                <option value="NURSE">Nurse</option>
                                <option value="LAB_TECHNICIAN">Lab Technician</option>
                                <option value="MANAGER">Manager</option>
                                <option value="OTHER">Other</option>
                            </select>
                            <input type="text" placeholder="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="px-4 py-3 rounded-xl border" />
                            <input type="date" placeholder="Joining Date *" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="px-4 py-3 rounded-xl border" required />
                            <select value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} className="px-4 py-3 rounded-xl border">
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERN">Intern</option>
                            </select>
                        </div>
                    </div>

                    {/* Salary Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Salary Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="number" placeholder="Basic Salary *" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })} className="px-4 py-3 rounded-xl border" required />
                            <input type="number" placeholder="HRA" value={formData.hra} onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) })} className="px-4 py-3 rounded-xl border" />
                            <input type="number" placeholder="Other Allowances" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })} className="px-4 py-3 rounded-xl border" />
                        </div>
                    </div>

                    {/* Access */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">System Access</h2>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={formData.canLogin} onChange={(e) => setFormData({ ...formData, canLogin: e.target.checked })} className="w-5 h-5 rounded" />
                                <span className="text-gray-700">Allow system login</span>
                            </label>
                            {formData.canLogin && (
                                <input type="password" placeholder="Set Password" value={formData.userPassword} onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border" required={formData.canLogin} />
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold disabled:opacity-50">{loading ? 'Adding...' : 'Add Staff Member'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}