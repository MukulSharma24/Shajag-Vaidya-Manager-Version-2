// src/lib/patient-password.ts

/**
 * Generate default password for patient
 * Pattern: Last 4 digits of phone + Patient ID
 * Example: Phone 8800990077, ID P000001 → 0077P000001
 */
export function generatePatientPassword(phoneNumber: string, patientId: string): string {
    // Clean phone number - remove spaces, dashes, +91 etc
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');

    // Get last 4 digits
    const last4 = cleanPhone.slice(-4);

    // Combine: last 4 digits + patient ID
    return `${last4}${patientId}`;
}

/**
 * Format patient ID from registration number
 * Example: 1 → P000001, 123 → P000123
 */
export function formatPatientId(registrationId: number): string {
    return `P${registrationId.toString().padStart(6, '0')}`;
}

/**
 * Get password hint to show staff (without revealing full password)
 * Example: "0077 + P000001"
 */
export function getPasswordHint(phoneNumber: string, patientId: string): string {
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');
    const last4 = cleanPhone.slice(-4);
    return `${last4} + ${patientId}`;
}