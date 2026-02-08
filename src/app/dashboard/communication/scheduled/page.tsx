'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SocialPost {
    id: string;
    content: string;
    hashtags: string[];
    status: string;
    scheduledFor?: string;
    createdAt: string;
    media: any[];
    platformPosts: any[];
}

export default function ScheduledPage() {
    const pathname = usePathname();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    useEffect(() => {
        fetchScheduled();
    }, []);

    const fetchScheduled = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/posts?status=SCHEDULED');
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            }
        } catch (error) {
            console.error('Error fetching scheduled posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this scheduled post?')) return;

        try {
            const res = await fetch(`/api/social/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DRAFT', scheduledFor: null }),
            });
            if (res.ok) fetchScheduled();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const groupByDate = (posts: SocialPost[]) => {
        const groups: Record<string, SocialPost[]> = {};
        posts.forEach(post => {
            if (post.scheduledFor) {
                const date = new Date(post.scheduledFor).toDateString();
                if (!groups[date]) groups[date] = [];
                groups[date].push(post);
            }
        });
        return groups;
    };

    const sortedDates = Object.keys(groupByDate(posts)).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    );

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Scheduled Posts</h1>
                        <p className="text-sm text-gray-500">{posts.length} post(s) scheduled</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Calendar
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <TabLink href="/dashboard/communication" label="All Posts" active={pathname === '/dashboard/communication'} />
                        <TabLink href="/dashboard/communication/drafts" label="Drafts" active={pathname === '/dashboard/communication/drafts'} />
                        <TabLink href="/dashboard/communication/scheduled" label="Scheduled" active={pathname === '/dashboard/communication/scheduled'} />
                        <TabLink href="/dashboard/communication/published" label="Published" active={pathname === '/dashboard/communication/published'} />
                        <TabLink href="/dashboard/communication/templates" label="Templates" active={pathname === '/dashboard/communication/templates'} />
                        <TabLink href="/dashboard/communication/accounts" label="Accounts" active={pathname === '/dashboard/communication/accounts'} />
                    </nav>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : posts.length === 0 ? (
                <EmptyState />
            ) : viewMode === 'list' ? (
                <ListView posts={posts} onCancel={handleCancel} />
            ) : (
                <CalendarView groupedPosts={groupByDate(posts)} sortedDates={sortedDates} onCancel={handleCancel} />
            )}
        </div>
    );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link href={href} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${active ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
        </Link>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled posts</h3>
            <p className="text-sm text-gray-500">Schedule posts to publish at optimal times</p>
        </div>
    );
}

function ListView({ posts, onCancel }: { posts: SocialPost[]; onCancel: (id: string) => void }) {
    const sortedPosts = [...posts].sort((a, b) =>
        new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime()
    );

    return (
        <div className="space-y-4">
            {sortedPosts.map(post => (
                <ScheduledCard key={post.id} post={post} onCancel={onCancel} />
            ))}
        </div>
    );
}

function CalendarView({ groupedPosts, sortedDates, onCancel }: {
    groupedPosts: Record<string, SocialPost[]>;
    sortedDates: string[];
    onCancel: (id: string) => void;
}) {
    return (
        <div className="space-y-8">
            {sortedDates.map(date => (
                <div key={date}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedPosts[date]
                            .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                            .map(post => (
                                <ScheduledCard key={post.id} post={post} onCancel={onCancel} compact />
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ScheduledCard({ post, onCancel, compact = false }: {
    post: SocialPost;
    onCancel: (id: string) => void;
    compact?: boolean;
}) {
    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeUntil = (date: string) => {
        const now = new Date().getTime();
        const scheduled = new Date(date).getTime();
        const diff = scheduled - now;

        if (diff < 0) return 'Overdue';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'soon';
    };

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="badge bg-amber-100 text-amber-700 border-amber-200 mb-2">
                            {post.scheduledFor && formatDateTime(post.scheduledFor)}
                        </span>
                        <p className="text-xs text-gray-600 font-medium">
                            {post.scheduledFor && getTimeUntil(post.scheduledFor)}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-900 line-clamp-3 mb-3">{post.content}</p>

                {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-xs text-teal-600 mb-3 line-clamp-1">
                        {post.hashtags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
                    </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                    {post.platformPosts.map((pp: any) => (
                        <span key={pp.id} className="text-lg">
                            {pp.platform === 'FACEBOOK' && '📘'}
                            {pp.platform === 'INSTAGRAM' && '📷'}
                            {pp.platform === 'LINKEDIN' && '💼'}
                            {pp.platform === 'TWITTER' && '🐦'}
                        </span>
                    ))}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button className="flex-1 btn btn-sm btn-secondary">Edit</button>
                    <button onClick={() => onCancel(post.id)} className="flex-1 btn btn-sm btn-ghost text-red-600">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}