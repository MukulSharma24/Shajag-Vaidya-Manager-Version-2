// src/app/api/social/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/social/posts/[id]
// Get single post by ID
// ============================================
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const post = await prisma.socialPost.findUnique({
            where: { id: params.id },
            include: {
                media: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(post);

    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

// ============================================
// PATCH /api/social/posts/[id]
// Update post
// ============================================
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const post = await prisma.socialPost.update({
            where: { id: params.id },
            data: {
                content: body.content,
                hashtags: body.hashtags,
                status: body.status,
                scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
            },
            include: {
                media: true,
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
            },
        });

        return NextResponse.json(post);

    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json(
            { error: 'Failed to update post' },
            { status: 500 }
        );
    }
}

// ============================================
// DELETE /api/social/posts/[id]
// Delete post
// ============================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Delete post (cascade will delete media and platform posts)
        await prisma.socialPost.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        );
    }
}