// src/app/api/social/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/social/templates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where: any = {};
        if (category && category !== 'all') {
            where.category = category;
        }

        const templates = await prisma.postTemplate.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ templates });

    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

// POST /api/social/templates
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const template = await prisma.postTemplate.create({
            data: {
                name: body.name,
                description: body.description || null,
                content: body.content,
                platforms: body.platforms || [],
                mediaSlots: body.mediaSlots || 0,
                category: body.category || null,
                tags: body.tags || [],
            },
        });

        return NextResponse.json(template, { status: 201 });

    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}