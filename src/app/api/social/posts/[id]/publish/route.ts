// src/app/api/social/posts/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SocialPublisher } from '@/lib/social/publisher';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get post with accounts
        const post = await prisma.socialPost.findUnique({
            where: { id: params.id },
            include: {
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
                media: true,
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        console.log(`🚀 Publishing post ${post.id} to ${post.platformPosts.length} platform(s)`);

        // Publish to each platform
        const results = await Promise.allSettled(
            post.platformPosts.map(async (platformPost) => {
                // Update status to publishing
                await prisma.platformPost.update({
                    where: { id: platformPost.id },
                    data: { status: 'PUBLISHING' },
                });

                // Publish
                const result = await SocialPublisher.publish({
                    platform: platformPost.platform,
                    accountId: platformPost.account.accountId,
                    accessToken: platformPost.account.accessToken || '',
                    content: post.content,
                    mediaUrls: post.media.map(m => m.url),
                });

                // Update platform post with result
                await prisma.platformPost.update({
                    where: { id: platformPost.id },
                    data: {
                        status: result.success ? 'PUBLISHED' : 'FAILED',
                        platformPostId: result.platformPostId,
                        platformUrl: result.platformUrl,
                        error: result.error,
                        publishedAt: result.success ? new Date() : null,
                    },
                });

                return { platformPost, result };
            })
        );

        // Check if all succeeded
        const allSucceeded = results.every(
            r => r.status === 'fulfilled' && r.value.result.success
        );

        // Update main post status
        await prisma.socialPost.update({
            where: { id: params.id },
            data: {
                status: allSucceeded ? 'PUBLISHED' : 'FAILED',
                publishedAt: allSucceeded ? new Date() : null,
            },
        });

        // Get updated post
        const updatedPost = await prisma.socialPost.findUnique({
            where: { id: params.id },
            include: {
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
                media: true,
            },
        });

        console.log(`✅ Publishing complete. Success: ${allSucceeded}`);

        return NextResponse.json({
            success: allSucceeded,
            post: updatedPost,
            results: results.map(r =>
                r.status === 'fulfilled'
                    ? { success: r.value.result.success, platform: r.value.platformPost.platform }
                    : { success: false, error: 'Failed' }
            ),
        });

    } catch (error: any) {
        console.error('Error publishing post:', error);
        return NextResponse.json(
            { error: 'Failed to publish post', message: error.message },
            { status: 500 }
        );
    }
}