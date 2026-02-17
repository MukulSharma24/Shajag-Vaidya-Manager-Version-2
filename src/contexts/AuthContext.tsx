'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    patientId?: string | null;
    staffId?: string | null;
    employeeId?: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isPatient: boolean;
    isDoctor: boolean;
    isStaff: boolean;
    isOwner: boolean;
    roleLabel: string; // ADD THIS
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
    isPatient: false,
    isDoctor: false,
    isStaff: false,
    isOwner: false,
    roleLabel: '', // ADD THIS
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await res.json();
        setUser(data.user);

        const redirectTo = data.redirectTo ?? (data.user?.role === 'PATIENT' ? '/patient-portal' : '/dashboard');
        router.push(redirectTo);
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    };

    const isPatient = user?.role === 'PATIENT';
    const isDoctor  = user?.role === 'DOCTOR';
    const isStaff   = user?.role === 'STAFF';
    const isOwner   = user?.role === 'OWNER';

    // ADD THIS - Human readable role label
    const getRoleLabel = (role: string | undefined): string => {
        switch (role) {
            case 'OWNER': return 'Practice Owner';
            case 'DOCTOR': return 'Doctor';
            case 'STAFF': return 'Staff';
            case 'PATIENT': return 'Patient';
            default: return '';
        }
    };
    const roleLabel = getRoleLabel(user?.role);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isPatient,
            isDoctor,
            isStaff,
            isOwner,
            roleLabel, // ADD THIS
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);