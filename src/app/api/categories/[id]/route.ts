// src/app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single category with medicines
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                medicines: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
    }
}

// PUT: Update category
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, description, type, color } = body;

        const category = await prisma.category.update({
            where: { id: params.id },
            data: {
                name,
                description,
                type,
                color,
            },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error('Error updating category:', error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Category with this name already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

// DELETE: Delete category
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if category has medicines
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { medicines: true },
                },
            },
        });

        if (category && category._count.medicines > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with associated medicines' },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}