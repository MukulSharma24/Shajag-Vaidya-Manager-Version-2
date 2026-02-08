'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SocialPost {
    id: string;
    content: string;
    hashtags: string[];
    status: string;
    publishedAt?: string;
    createdAt: string;
    media: any[];
    platformPosts: Array<{
        id: string;
        platform: string;
        platformUrl?: string;
        likes?: number;
        comments?: number;
        shares?: number;
        views?: number;
        account: {
            accountName: string;
        };
    }>;
}

export default function PublishedPage() {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPlatform, setFilterPlatform] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');

    useEffect(() => {
        fetchPublished();
    }, [dateRange]);

    const fetchPublished = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/posts?status=PUBLISHED');
            if (res.ok) {
                const data = await res.json();
                let posts = data.posts || [];

                // Filter by date range
                const now = new Date();
                if (dateRange !== 'all') {
                    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
                    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                    posts = posts.filter((p: SocialPost) =>
                        new Date(p.publishedAt || p.createdAt) >= cutoff
                    );
                }

                setPosts(posts);
            }
        } catch (error) {
            console.error('Error fetching published posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesPlatform = filterPlatform === 'all' ||
            post.platformPosts.some(pp => pp.platform === filterPlatform);

        return matchesSearch && matchesPlatform;
    });

    const getTotalEngagement = (post: SocialPost) => {
        return post.platformPosts.reduce((sum, pp) =>
            sum + (pp.likes || 0) + (pp.comments || 0) + (pp.shares || 0), 0
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Published Posts</h1>
                        <p className="text-sm text-gray-500">
                            {filteredPosts.length} published post{filteredPosts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/dashboard/communication" className="btn btn-secondary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to All Posts
                    </Link>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="card-content">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-10"
                                />
                            </div>

                            {/* Platform Filter */}
                            <select
                                value={filterPlatform}
                                onChange={(e) => setFilterPlatform(e.target.value)}
                                className="form-select"
                            >
                                <option value="all">All Platforms</option>
                                <option value="FACEBOOK">📘 Facebook</option>
                                <option value="INSTAGRAM">📷 Instagram</option>
                                <option value="LINKEDIN">💼 LinkedIn</option>
                                <option value="TWITTER">🐦 Twitter</option>
                            </select>

                            {/* Date Range */}
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="form-select"
                            >
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchQuery || filterPlatform !== 'all' ? 'No posts match your filters' : 'No published posts yet'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {searchQuery || filterPlatform !== 'all' ? 'Try adjusting your filters' : 'Publish your first post to see it here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <PublishedPostCard
                            key={post.id}
                            post={post}
                            getTotalEngagement={getTotalEngagement}
                            formatDate={formatDate}
                            formatNumber={formatNumber}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PublishedPostCard({ post, getTotalEngagement, formatDate, formatNumber }: {
    post: SocialPost;
    getTotalEngagement: (post: SocialPost) => number;
    formatDate: (date: string) => string;
    formatNumber: (num: number) => string;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="badge bg-green-100 text-green-700 border-green-200 mb-2">
                                    Published
                                </span>
                                <p className="text-xs text-gray-500">
                                    {post.publishedAt && formatDate(post.publishedAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <p className={`text-sm text-gray-900 mb-3 ${expanded ? '' : 'line-clamp-2'}`}>
                            {post.content}
                        </p>

                        {post.hashtags && post.hashtags.length > 0 && (
                            <p className="text-xs text-teal-600 mb-4 line-clamp-1">
                                {post.hashtags.map(tag => `#${tag}`).join(' ')}
                            </p>
                        )}

                        {/* Platform Performance */}
                        <div className="space-y-2">
                            {post.platformPosts.map((pp) => (
                                <div key={pp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                            {pp.platform === 'FACEBOOK' && '📘'}
                                            {pp.platform === 'INSTAGRAM' && '📷'}
                                            {pp.platform === 'LINKEDIN' && '💼'}
                                            {pp.platform === 'TWITTER' && '🐦'}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {pp.platform.charAt(0) + pp.platform.slice(1).toLowerCase()}
                                            </p>
                                            <p className="text-xs text-gray-500">{pp.account.accountName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {pp.likes !== undefined && pp.likes > 0 && (
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-gray-900">{formatNumber(pp.likes)}</p>
                                                <p className="text-xs text-gray-500">Likes</p>
                                            </div>
                                        )}
                                        {pp.comments !== undefined && pp.comments > 0 && (
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-gray-900">{formatNumber(pp.comments)}</p>
                                                <p className="text-xs text-gray-500">Comments</p>
                                            </div>
                                        )}
                                        {pp.shares !== undefined && pp.shares > 0 && (
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-gray-900">{formatNumber(pp.shares)}</p>
                                                <p className="text-xs text-gray-500">Shares</p>
                                            </div>
                                        )}
                                        {pp.platformUrl && (
                                            <a
                                                href={pp.platformUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-ghost"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Summary */}
                    <div className="md:w-48 flex md:flex-col gap-4">
                        <div className="flex-1 text-center p-4 bg-teal-50 rounded-lg">
                            <p className="text-2xl font-bold text-teal-600">{formatNumber(getTotalEngagement(post))}</p>
                            <p className="text-xs text-gray-600 mt-1">Total Engagement</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}