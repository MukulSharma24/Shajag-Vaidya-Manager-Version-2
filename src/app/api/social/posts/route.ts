// src/app/api/social/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/social/posts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        const posts = await prisma.socialPost.findMany({
            where,
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
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.socialPost.count({ where });

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Error fetching social posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

// POST /api/social/posts
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            content,
            hashtags,
            media,
            platforms,
            status = 'DRAFT',
            scheduledFor,
            createdBy,
        } = body;

        // Validate required fields
        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        if (!platforms || platforms.length === 0) {
            return NextResponse.json(
                { error: 'At least one platform is required' },
                { status: 400 }
            );
        }

        console.log('📝 Creating social post...');
        console.log('Platforms:', platforms);

        // Create or get accounts for each platform
        const accountIds = await Promise.all(
            platforms.map(async (platform: any) => {
                // Try to find existing account
                let account = await prisma.socialAccount.findFirst({
                    where: {
                        platform: platform.platform,
                    },
                });

                // If no account exists, create a mock one
                if (!account) {
                    console.log(`Creating mock account for ${platform.platform}`);
                    account = await prisma.socialAccount.create({
                        data: {
                            platform: platform.platform,
                            accountName: `My ${platform.platform} Account`,
                            accountId: `${platform.platform.toLowerCase()}-${Date.now()}`,
                            username: platform.platform.toLowerCase(),
                            isActive: true,
                        },
                    });
                }

                return {
                    accountId: account.id,
                    platform: platform.platform,
                };
            })
        );

        console.log('Account IDs:', accountIds);

        // Create post with media and platform posts
        const post = await prisma.socialPost.create({
            data: {
                content,
                hashtags: hashtags || [],
                status,
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
                createdBy: createdBy || null,

                // Create media attachments
                media: media && media.length > 0 ? {
                    create: media.map((m: any, index: number) => ({
                        type: m.type,
                        url: m.url,
                        publicId: m.publicId || null,
                        thumbnail: m.thumbnail || null,
                        altText: m.altText || null,
                        duration: m.duration || null,
                        size: m.size || null,
                        width: m.width || null,
                        height: m.height || null,
                        order: index,
                    })),
                } : undefined,

                // Create platform post entries
                platformPosts: {
                    create: accountIds.map((acc: any) => ({
                        accountId: acc.accountId,
                        platform: acc.platform,
                        status: 'PENDING',
                    })),
                },
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

        console.log('✅ Social post created:', post.id);

        return NextResponse.json(post, { status: 201 });

    } catch (error: any) {
        console.error('❌ Error creating social post:', error);
        console.error('Error details:', error.message);
        return NextResponse.json(
            {
                error: 'Failed to create post',
                message: error.message,
            },
            { status: 500 }
        );
    }
}