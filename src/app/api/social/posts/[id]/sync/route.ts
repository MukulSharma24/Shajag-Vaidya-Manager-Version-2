// src/app/api/social/posts/[id]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const post = await prisma.socialPost.findUnique({
            where: { id: params.id },
            include: {
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

        console.log(`🔄 Syncing engagement for post ${post.id}`);

        // Sync engagement for each platform
        const syncResults = await Promise.allSettled(
            post.platformPosts.map(async (platformPost) => {
                if (platformPost.status !== 'PUBLISHED' || !platformPost.platformPostId) {
                    return { success: false, platform: platformPost.platform };
                }

                try {
                    // TODO: Implement actual API calls
                    // For now, generate mock engagement data
                    const mockEngagement = {
                        likes: Math.floor(Math.random() * 1000),
                        comments: Math.floor(Math.random() * 100),
                        shares: Math.floor(Math.random() * 50),
                        views: Math.floor(Math.random() * 5000),
                    };

                    await prisma.platformPost.update({
                        where: { id: platformPost.id },
                        data: {
                            likes: mockEngagement.likes,
                            comments: mockEngagement.comments,
                            shares: mockEngagement.shares,
                            views: mockEngagement.views,
                            lastSyncedAt: new Date(),
                        },
                    });

                    console.log(`✅ Synced ${platformPost.platform}:`, mockEngagement);

                    return {
                        success: true,
                        platform: platformPost.platform,
                        engagement: mockEngagement,
                    };
                } catch (error) {
                    console.error(`❌ Error syncing ${platformPost.platform}:`, error);
                    return { success: false, platform: platformPost.platform };
                }
            })
        );

        const updatedPost = await prisma.socialPost.findUnique({
            where: { id: params.id },
            include: {
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: 'Engagement synced',
            post: updatedPost,
            results: syncResults.map(r =>
                r.status === 'fulfilled' ? r.value : { success: false }
            ),
        });

    } catch (error) {
        console.error('Error syncing engagement:', error);
        return NextResponse.json(
            { error: 'Failed to sync engagement' },
            { status: 500 }
        );
    }
}