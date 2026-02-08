import { format, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as +91-XXXXX-XXXXX
    if (cleaned.length === 10) {
        return `+91-${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }

    return phone;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomStr}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
        'scheduled': 'bg-blue-100 text-blue-700',
        'in-progress': 'bg-yellow-100 text-yellow-700',
        'completed': 'bg-green-100 text-green-700',
        'cancelled': 'bg-red-100 text-red-700',
        'Paid': 'bg-green-100 text-green-700',
        'Partial': 'bg-yellow-100 text-yellow-700',
        'Pending': 'bg-red-100 text-red-700',
        'Active': 'bg-green-100 text-green-700',
        'Inactive': 'bg-gray-100 text-gray-700',
        'On Leave': 'bg-yellow-100 text-yellow-700',
    };

    return statusColors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleaned = phone.replace(/\D/g, '');
    return phoneRegex.test(cleaned);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get constitution color
 */
export function getConstitutionColor(constitution: string): string {
    const colors: { [key: string]: string } = {
        'Vata': 'bg-purple-100 text-purple-700',
        'Pitta': 'bg-red-100 text-red-700',
        'Kapha': 'bg-blue-100 text-blue-700',
        'Vata-Pitta': 'bg-pink-100 text-pink-700',
        'Pitta-Kapha': 'bg-orange-100 text-orange-700',
        'Vata-Kapha': 'bg-indigo-100 text-indigo-700',
        'Tridosha': 'bg-green-100 text-green-700',
    };

    return colors[constitution] || 'bg-gray-100 text-gray-700';
}

/**
 * Local storage helpers
 */
export const storage = {
    get: <T>(key: string): T | null => {
        if (typeof window === 'undefined') return null;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting item ${key} from localStorage:`, error);
            return null;
        }
    },

    set: <T>(key: string, value: T): void => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting item ${key} to localStorage:`, error);
        }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing item ${key} from localStorage:`, error);
        }
    },

    clear: (): void => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
};

/**
 * Print helper
 */
export function printElement(elementId: string): void {
    if (typeof window === 'undefined') return;

    const printContents = document.getElementById(elementId)?.innerHTML;
    if (!printContents) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
}

/**
 * Download as CSV
 */
export function downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                return typeof value === 'string' && value.includes(',')
                    ? `"${value.replace(/"/g, '""')}"`
                    : value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}