'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateLoginButton from '@/components/staff/CreateLoginButton';

export default function StaffViewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [hasLogin, setHasLogin] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'SICK',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        fetchStaff();
        checkLoginStatus();
    }, [params.id]);

    const fetchStaff = async () => {
        try {
            const res = await fetch(`/api/staff/${params.id}`);
            const data = await res.json();
            setStaff(data.staff);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkLoginStatus = async () => {
        try {
            const res = await fetch(`/api/staff/${params.id}/create-login`);
            if (res.ok) {
                const data = await res.json();
                setHasLogin(data.hasLogin);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/staff/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Staff deleted successfully!');
                router.push('/dashboard/staff');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete staff');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting staff');
        }
    };

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const clinicId = localStorage.getItem('clinicId') || 'default-clinic';
            const res = await fetch('/api/staff/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: params.id,
                    ...leaveForm,
                    clinicId
                }),
            });

            if (res.ok) {
                alert('Leave application submitted successfully!');
                setShowLeaveModal(false);
                setLeaveForm({
                    leaveType: 'SICK',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to apply leave');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error applying leave');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Staff not found</p>
                    <button
                        onClick={() => router.push('/dashboard/staff')}
                        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg"
                    >
                        Back to Staff
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/dashboard/staff')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <span className="text-xl mr-2">←</span> Back
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6 justify-end flex-wrap">
                    {/* ✅ Create Login Button - shows inline with other actions */}
                    <CreateLoginButton
                        staffId={params.id}
                        staffName={`${staff.firstName} ${staff.lastName}`}
                        staffEmail={staff.email}
                        hasLogin={hasLogin || staff.canLogin}
                        onSuccess={() => {
                            checkLoginStatus();
                            fetchStaff();
                        }}
                    />
                    <button
                        onClick={() => router.push(`/dashboard/staff/${params.id}/edit`)}
                        className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-all shadow-sm flex items-center gap-2"
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/staff/attendance`)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium transition-all shadow-sm"
                    >
                        Mark Attendance
                    </button>
                </div>

                {/* Staff Header Card */}
                <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl p-8 mb-6 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <span className="text-4xl text-white font-bold">
                                    {staff.firstName?.[0]}{staff.lastName?.[0]}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {staff.firstName} {staff.lastName}
                                </h1>
                                <p className="text-white/90 text-lg">{staff.role}</p>
                                <p className="text-white/80 text-sm mt-1">
                                    Employee ID: {staff.employeeId}
                                </p>
                            </div>
                        </div>
                        {/* Login status badge */}
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            (hasLogin || staff.canLogin)
                                ? 'bg-white/20 text-white border border-white/40'
                                : 'bg-white/10 text-white/70 border border-white/20'
                        }`}>
                            {(hasLogin || staff.canLogin) ? '🔓 Login Enabled' : '🔒 No Login Access'}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
                        <div className="space-y-4">
                            <InfoRow label="Email" value={staff.email} />
                            <InfoRow label="Phone" value={staff.phone} />
                            {staff.alternatePhone && (
                                <InfoRow label="Alternate Phone" value={staff.alternatePhone} />
                            )}
                            <InfoRow label="Role" value={staff.role} />
                            <InfoRow label="Department" value={staff.department || staff.designation || 'N/A'} />
                            {staff.gender && <InfoRow label="Gender" value={staff.gender} />}
                            {staff.bloodGroup && <InfoRow label="Blood Group" value={staff.bloodGroup} />}
                            {staff.dateOfBirth && (
                                <InfoRow
                                    label="Date of Birth"
                                    value={new Date(staff.dateOfBirth).toLocaleDateString()}
                                />
                            )}
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Employment Details</h2>
                        <div className="space-y-4">
                            <InfoRow
                                label="Joining Date"
                                value={new Date(staff.joiningDate).toLocaleDateString()}
                            />
                            <InfoRow
                                label="Status"
                                value={
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        staff.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {staff.status}
                                    </span>
                                }
                            />
                            {staff.qualification && (
                                <InfoRow label="Qualification" value={staff.qualification} />
                            )}
                            {staff.specialization && (
                                <InfoRow label="Specialization" value={staff.specialization} />
                            )}
                            {staff.experienceYears > 0 && (
                                <InfoRow label="Experience" value={`${staff.experienceYears} years`} />
                            )}
                            <InfoRow
                                label="Monthly Salary"
                                value={`₹${(Number(staff.basicSalary) + Number(staff.allowances || 0)).toLocaleString()}`}
                                valueClass="text-teal-600 font-bold"
                            />
                            <InfoRow
                                label="System Access"
                                value={
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        (hasLogin || staff.canLogin)
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {(hasLogin || staff.canLogin) ? 'Login Enabled' : 'No Login'}
                                    </span>
                                }
                            />
                            {staff.user && (
                                <InfoRow label="Login Email" value={staff.user.email} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                {(staff.addressLine1 || staff.city || staff.state) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Address</h2>
                        <div className="space-y-2">
                            {staff.addressLine1 && <p className="text-gray-700">{staff.addressLine1}</p>}
                            {staff.addressLine2 && <p className="text-gray-700">{staff.addressLine2}</p>}
                            <p className="text-gray-700">
                                {[staff.city, staff.state, staff.pincode].filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bank Details */}
                {staff.bankName && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoRow label="Bank Name" value={staff.bankName} />
                            <InfoRow label="Account Number" value={staff.accountNumber} />
                            <InfoRow label="IFSC Code" value={staff.ifscCode} />
                            <InfoRow label="Account Holder" value={staff.accountHolderName} />
                        </div>
                    </div>
                )}

                {/* Action Buttons at Bottom */}
                <div className="flex gap-4 mt-8">
                    <button
                        onClick={() => setShowLeaveModal(true)}
                        className="flex-1 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        📝 Apply Leave
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        🗑️ Delete Staff
                    </button>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Apply for Leave</h3>

                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                                <select
                                    value={leaveForm.leaveType}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    <option value="SICK">Sick Leave</option>
                                    <option value="CASUAL">Casual Leave</option>
                                    <option value="EARNED">Earned Leave</option>
                                    <option value="UNPAID">Unpaid Leave</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={leaveForm.startDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={leaveForm.endDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    min={leaveForm.startDate}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                                <textarea
                                    value={leaveForm.reason}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                    placeholder="Reason for leave..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowLeaveModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Staff Member?</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{staff.firstName} {staff.lastName}</strong>?
                                <br />
                                <span className="text-red-600">This action cannot be undone.</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({
                     label,
                     value,
                     valueClass = "text-gray-900"
                 }: {
    label: string;
    value: React.ReactNode;
    valueClass?: string;
}) {
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}:</dt>
            <dd className={`mt-1 text-sm ${valueClass}`}>{value}</dd>
        </div>
    );
}