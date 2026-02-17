// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, hashPassword } from '@/lib/auth';

// GET - Get single user
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                staff: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PATCH - Update user
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owners can update users' }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role, isActive } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deactivating own account
        if (id === currentUser.userId && isActive === false) {
            return NextResponse.json(
                { error: 'You cannot deactivate your own account' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase().trim();
        if (role && ['OWNER', 'DOCTOR', 'STAFF'].includes(role)) updateData.role = role;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (password) updateData.password = await hashPassword(password);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            }
        });

        return NextResponse.json({
            message: 'User updated successfully',
            user
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE - Delete user (soft delete by deactivating)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'OWNER') {
            return NextResponse.json({ error: 'Only owners can delete users' }, { status: 403 });
        }

        // Prevent deleting own account
        if (id === currentUser.userId) {
            return NextResponse.json(
                { error: 'You cannot delete your own account' },
                { status: 400 }
            );
        }

        // Soft delete - just deactivate
        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}