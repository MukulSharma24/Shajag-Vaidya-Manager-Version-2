// User and Authentication Types
export interface User {
    id: string;
    username: string;
    role: UserRole;
    name: string;
    email?: string;
    phone?: string;
}

export type UserRole = 'owner' | 'doctor' | 'patient' | 'nurse' | 'pharmacy' | 'assistant';

// Dashboard Types
export interface DashboardStats {
    totalPatients: number;
    todayAppointments: number;
    medicinesStock: number;
    therapyAssignments: number;
    totalStaff: number;
    totalRevenue: string;
}

// Patient Types
export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    email?: string;
    address?: string;
    constitution: Constitution;
    registrationDate: string;
    lastVisit?: string;
    medicalHistory?: string;
}

export type Constitution =
    | 'Vata'
    | 'Pitta'
    | 'Kapha'
    | 'Vata-Pitta'
    | 'Pitta-Kapha'
    | 'Vata-Kapha'
    | 'Tridosha';

// Appointment Types
export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    type: AppointmentType;
    status: AppointmentStatus;
    notes?: string;
    constitution?: Constitution;
}

export type AppointmentType =
    | 'Consultation'
    | 'Follow-up'
    | 'Emergency'
    | 'Therapy Session'
    | 'General Consultation';

export type AppointmentStatus =
    | 'scheduled'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

// Medicine Types
export interface Medicine {
    id: string;
    name: string;
    company?: string;
    category: MedicineCategory;
    stock: number;
    price: number;
    expiryDate?: string;
    description?: string;
}

export type MedicineCategory =
    | 'Classical Formulations'
    | 'Single Herbs'
    | 'Proprietary Medicines';

// Prescription Types
export interface Prescription {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    medicines: PrescriptionMedicine[];
    notes?: string;
    createdBy: string;
}

export interface PrescriptionMedicine {
    medicineId: string;
    medicineName: string;
    dosage: string;
    timing: string;
    duration: string;
    isExternal?: boolean;
    company?: string;
    notes?: string;
}

// Therapy Types
export interface TherapySession {
    id: string;
    patientId: string;
    patientName: string;
    therapyType: TherapyType;
    date: string;
    time: string;
    duration: string;
    status: 'scheduled' | 'in-progress' | 'completed';
    notes?: string;
}

export type TherapyType =
    | 'Vamana'
    | 'Virechana'
    | 'Basti'
    | 'Nasya'
    | 'Raktamokshana';

// Diet Plan Types
export interface DietPlan {
    id: string;
    patientId: string;
    patientName: string;
    constitution: Constitution;
    season?: Season;
    date: string;
    recommendations: string;
    restrictions?: string;
    notes?: string;
}

export type Season =
    | 'Spring (Vasant)'
    | 'Summer (Grishma)'
    | 'Monsoon (Varsha)'
    | 'Autumn (Sharad)'
    | 'Winter (Shishir)';

// Staff Types
export interface StaffMember {
    id: string;
    name: string;
    age: number;
    email: string;
    contact: string;
    emergencyContact?: string;
    address?: string;
    role: string;
    qualification: string;
    responsibility: string;
    experience?: string;
    specialization?: string;
    joiningDate: string;
    employmentType: EmploymentType;
    salary: number;
    shift?: string;
    status: StaffStatus;
}

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

// Billing Types
export interface Invoice {
    id: string;
    invoiceNumber: string;
    patientName: string;
    patientPhone: string;
    date: string;
    services: InvoiceService[];
    subtotal: number;
    tax: number;
    total: number;
    amountPaid: number;
    balance: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string;
}

export interface InvoiceService {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Net Banking' | 'Insurance';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

// Communication Types
export interface Message {
    id: string;
    patientId: string;
    patientName: string;
    template: MessageTemplate;
    customMessage?: string;
    date: string;
    status: 'sent' | 'failed' | 'pending';
}

export type MessageTemplate =
    | 'appointment_reminder'
    | 'follow_up_reminder'
    | 'treatment_completion'
    | 'therapy_reminder'
    | 'prescription_ready'
    | 'diet_plan_update';

// Chart Data Types
export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
}