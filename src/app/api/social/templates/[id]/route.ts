// src/app/api/social/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/social/templates/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const template = await prisma.postTemplate.findUnique({
            where: { id: params.id },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(template);

    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template' },
            { status: 500 }
        );
    }
}

// PATCH /api/social/templates/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const template = await prisma.postTemplate.update({
            where: { id: params.id },
            data: {
                name: body.name,
                description: body.description,
                content: body.content,
                platforms: body.platforms,
                category: body.category,
                tags: body.tags,
            },
        });

        return NextResponse.json(template);

    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

// DELETE /api/social/templates/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.postTemplate.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}