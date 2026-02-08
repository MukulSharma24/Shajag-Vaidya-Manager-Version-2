'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Staff {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    designation: string;
    status: string;
    basicSalary: number;
    joiningDate: string;
    department: string;
    qualification: string;
}

export default function ViewStaffPage() {
    const router = useRouter();
    const params = useParams();
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchStaff();
        }
    }, [params.id]);

    const fetchStaff = async () => {
        try {
            const res = await fetch(`/api/staff/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setStaff(data.staff);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    };

    if (loading || !staff) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.back()} className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border">← Back</button>
                    <div className="flex gap-3">
                        <button onClick={() => router.push(`/dashboard/staff/${staff.id}/edit`)} className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border">✏️ Edit</button>
                        <button onClick={() => router.push('/dashboard/staff/attendance')} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white">Mark Attendance</button>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">👤</div>
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{staff.firstName} {staff.lastName}</h1>
                            <p className="text-teal-100 text-lg">{staff.designation || staff.role}</p>
                            <p className="text-teal-100 mt-1">Employee ID: {staff.employeeId}</p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                        <div className="space-y-3">
                            <div><span className="text-gray-600 text-sm">Email:</span> <p className="font-medium text-gray-900">{staff.email}</p></div>
                            <div><span className="text-gray-600 text-sm">Phone:</span> <p className="font-medium text-gray-900">{staff.phone}</p></div>
                            <div><span className="text-gray-600 text-sm">Role:</span> <p className="font-medium text-gray-900">{staff.role}</p></div>
                            <div><span className="text-gray-600 text-sm">Department:</span> <p className="font-medium text-gray-900">{staff.department || 'N/A'}</p></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Employment Details</h2>
                        <div className="space-y-3">
                            <div><span className="text-gray-600 text-sm">Joining Date:</span> <p className="font-medium text-gray-900">{new Date(staff.joiningDate).toLocaleDateString()}</p></div>
                            <div><span className="text-gray-600 text-sm">Status:</span> <p className="font-medium text-gray-900">{staff.status}</p></div>
                            <div><span className="text-gray-600 text-sm">Qualification:</span> <p className="font-medium text-gray-900">{staff.qualification || 'N/A'}</p></div>
                            <div><span className="text-gray-600 text-sm">Monthly Salary:</span> <p className="font-medium text-teal-600 text-xl">{formatCurrency(staff.basicSalary)}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}