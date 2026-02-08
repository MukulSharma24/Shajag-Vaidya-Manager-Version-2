// src/app/api/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all categories
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || '';

        const where: any = {};

        if (type) {
            where.type = type;
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { medicines: true },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST: Create new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, type, color } = body;

        const category = await prisma.category.create({
            data: {
                name,
                description,
                type: type || 'Disease',
                color,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        console.error('Error creating category:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Category with this name already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}