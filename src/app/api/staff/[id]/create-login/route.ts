// src/app/api/staff/[id]/create-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, hashPassword } from '@/lib/auth';

// POST - Create login credentials for existing staff
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: staffId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owners can create login credentials' }, { status: 403 });
        }

        const { password } = await req.json();

        if (!password || password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Get staff record
        const staff = await prisma.staff.findUnique({
            where: { id: staffId },
            include: { user: true }
        });

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
        }

        // Check if already has login
        if (staff.userId && staff.user) {
            return NextResponse.json(
                { error: 'This staff member already has login credentials' },
                { status: 400 }
            );
        }

        // Check if email is already used
        const existingUser = await prisma.user.findUnique({
            where: { email: staff.email.toLowerCase() }
        });

        if (existingUser) {
            // Link existing user to staff
            await prisma.staff.update({
                where: { id: staffId },
                data: { userId: existingUser.id, canLogin: true }
            });

            return NextResponse.json({
                message: 'Staff linked to existing user account',
                user: { id: existingUser.id, email: existingUser.email }
            });
        }

        // Create new user account
        const hashedPassword = await hashPassword(password);
        const fullName = `${staff.firstName} ${staff.lastName}`.trim();

        const user = await prisma.user.create({
            data: {
                name: fullName,
                email: staff.email.toLowerCase(),
                password: hashedPassword,
                role: staff.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF',
                isActive: true,
            }
        });

        // Link user to staff
        await prisma.staff.update({
            where: { id: staffId },
            data: { userId: user.id, canLogin: true }
        });

        return NextResponse.json({
            message: 'Login credentials created successfully',
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        }, { status: 201 });

    } catch (error) {
        console.error('Create login error:', error);
        return NextResponse.json({ error: 'Failed to create login credentials' }, { status: 500 });
    }
}

// GET - Check if staff has login
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: staffId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId },
            include: { user: { select: { id: true, email: true, isActive: true } } }
        });

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
        }

        return NextResponse.json({
            hasLogin: !!staff.userId,
            canLogin: staff.canLogin,
            user: staff.user
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to check login status' }, { status: 500 });
    }
}