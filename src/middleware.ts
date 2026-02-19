// middleware.ts (place in project root, NOT in src folder)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTEdge, getTokenFromCookieString } from '@/lib/auth-edge';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/validate-reset-token',
];

// Define base paths each role can access
const ROLE_BASE_ACCESS: Record<string, string[]> = {
    OWNER: ['/dashboard', '/api'],
    DOCTOR: ['/dashboard', '/api'],
    STAFF: ['/dashboard', '/api'],
    PATIENT: ['/patient-portal', '/api'],
};

// Specific routes STAFF cannot access (more granular control)
const STAFF_BLOCKED_ROUTES = [
    '/dashboard/prescriptions',
    '/dashboard/pharmacy',
    '/dashboard/therapy',
    '/dashboard/diet',
    '/dashboard/reports',
    '/dashboard/communication',
    '/dashboard/staff',
];

// Specific routes only OWNER can access
const OWNER_ONLY_ROUTES = [
    '/dashboard/staff',
    '/api/users',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if public route
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Get token
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookieString(cookieHeader);

    // Handle public routes
    // Handle public routes
    if (isPublicRoute) {
        // If user explicitly visits /login, always clear the cookie and let them log in fresh
        // This prevents a previous user's session from auto-redirecting a new person (privacy fix)
        if (pathname === '/login') {
            if (token) {
                const response = NextResponse.next();
                response.cookies.delete('auth-token');
                return response;
            }
            return NextResponse.next();
        }

        // For /register and other public routes, redirect if already logged in
        if (pathname === '/register' && token) {
            const payload = await verifyJWTEdge(token);
            if (payload) {
                const redirectPath = payload.role === 'PATIENT' ? '/patient-portal' : '/dashboard';
                return NextResponse.redirect(new URL(redirectPath, request.url));
            }
        }

        return NextResponse.next();
    }

    // Protected routes - require authentication
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    const payload = await verifyJWTEdge(token);
    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
    }

    const userRole = payload.role;

    // Handle root path
    if (pathname === '/') {
        const redirectPath = userRole === 'PATIENT' ? '/patient-portal' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Check base access
    const allowedBasePaths = ROLE_BASE_ACCESS[userRole] || [];
    const canAccessBase = allowedBasePaths.some(base => pathname.startsWith(base));

    if (!canAccessBase) {
        const redirectPath = userRole === 'PATIENT' ? '/patient-portal' : '/dashboard';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // PATIENT trying to access /dashboard
    if (userRole === 'PATIENT' && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/patient-portal', request.url));
    }

    // Non-PATIENT trying to access /patient-portal
    if (userRole !== 'PATIENT' && pathname.startsWith('/patient-portal')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // STAFF blocked routes
    if (userRole === 'STAFF') {
        const isBlocked = STAFF_BLOCKED_ROUTES.some(route => pathname.startsWith(route));
        if (isBlocked) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // OWNER only routes
    if (userRole !== 'OWNER') {
        const isOwnerOnly = OWNER_ONLY_ROUTES.some(route => pathname.startsWith(route));
        if (isOwnerOnly) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};