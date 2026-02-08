// src/app/api/cron/publish-scheduled/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();
        console.log(`⏰ Running scheduled posts check at ${now.toISOString()}`);

        // Find posts scheduled for now or earlier
        const scheduledPosts = await prisma.socialPost.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledFor: {
                    lte: now,
                },
            },
            include: {
                platformPosts: {
                    include: {
                        account: true,
                    },
                },
                media: true,
            },
        });

        console.log(`📋 Found ${scheduledPosts.length} post(s) to publish`);

        if (scheduledPosts.length === 0) {
            return NextResponse.json({
                message: 'No posts to publish',
                count: 0,
            });
        }

        // Publish each post
        const results = await Promise.allSettled(
            scheduledPosts.map(async (post) => {
                try {
                    // Call the publish API internally
                    const publishUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/posts/${post.id}/publish`;
                    const response = await fetch(publishUrl, {
                        method: 'POST',
                    });

                    if (response.ok) {
                        console.log(`✅ Published post ${post.id}`);
                        return { success: true, postId: post.id };
                    } else {
                        console.error(`❌ Failed to publish post ${post.id}`);
                        return { success: false, postId: post.id };
                    }
                } catch (error) {
                    console.error(`❌ Error publishing post ${post.id}:`, error);
                    return { success: false, postId: post.id };
                }
            })
        );

        const successCount = results.filter(
            r => r.status === 'fulfilled' && r.value.success
        ).length;

        console.log(`🎉 Published ${successCount}/${scheduledPosts.length} posts`);

        return NextResponse.json({
            message: 'Scheduled posts processed',
            total: scheduledPosts.length,
            successful: successCount,
            failed: scheduledPosts.length - successCount,
        });

    } catch (error) {
        console.error('Error in cron job:', error);
        return NextResponse.json(
            { error: 'Cron job failed' },
            { status: 500 }
        );
    }
}