'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreatePostModal from '@/components/social/CreatePostModal';

interface SocialPost {
    id: string;
    content: string;
    hashtags: string[];
    status: string;
    scheduledFor?: string;
    publishedAt?: string;
    createdAt: string;
    media: any[];
    platformPosts: any[];
}

interface Stats {
    total: number;
    drafts: number;
    scheduled: number;
    published: number;
}

// Custom Toast Notification Component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`rounded-lg shadow-lg p-4 min-w-[300px] ${
                type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        {type === 'success' ? (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <p className="text-white font-medium">{message}</p>
                    <button onClick={onClose} className="ml-auto text-white hover:text-gray-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Confirmation Modal Component
function ConfirmModal({
                          title,
                          message,
                          onConfirm,
                          onCancel,
                          confirmText = 'Confirm',
                          cancelText = 'Cancel',
                          type = 'danger'
                      }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning';
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            type === 'danger' ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                            <svg className={`w-6 h-6 ${type === 'danger' ? 'text-red-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-600">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
                    <button onClick={onCancel} className="btn btn-ghost">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'} text-white`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CommunicationPage() {
    const pathname = usePathname();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        drafts: 0,
        scheduled: 0,
        published: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        try {
            // Fetch stats
            const statsRes = await fetch('/api/social/posts/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch ALL posts
            const postsRes = await fetch('/api/social/posts');
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setPosts(postsData.posts || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setToast({ message: 'Failed to load posts', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = (id: string) => {
        setConfirmModal({
            show: true,
            title: 'Delete Post',
            message: 'Are you sure you want to delete this post? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const res = await fetch(`/api/social/posts/${id}`, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        fetchData();
                        setToast({ message: 'Post deleted successfully!', type: 'success' });
                    } else {
                        setToast({ message: 'Failed to delete post', type: 'error' });
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    setToast({ message: 'Error deleting post', type: 'error' });
                }
            }
        });
    };

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirmation Modal */}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                    confirmText="Delete"
                    type="danger"
                />
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                            Communication Center
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage social media posts across all platforms
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Post
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatsCard
                        title="Total Posts"
                        value={stats.total}
                        icon="📄"
                        bgColor="bg-blue-100"
                        textColor="text-blue-600"
                    />
                    <StatsCard
                        title="Drafts"
                        value={stats.drafts}
                        icon="💾"
                        bgColor="bg-gray-100"
                        textColor="text-gray-600"
                    />
                    <StatsCard
                        title="Scheduled"
                        value={stats.scheduled}
                        icon="📅"
                        bgColor="bg-amber-100"
                        textColor="text-amber-600"
                    />
                    <StatsCard
                        title="Published"
                        value={stats.published}
                        icon="✅"
                        bgColor="bg-green-100"
                        textColor="text-green-600"
                    />
                </div>

                {/* Tabs Navigation */}
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

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : posts.length === 0 ? (
                <EmptyState onCreatePost={() => setShowCreateModal(true)} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDelete={handleDeletePost}
                        />
                    ))}
                </div>
            )}

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchData();
                        setToast({ message: 'Post created successfully!', type: 'success' });
                    }}
                />
            )}
        </div>
    );
}

function StatsCard({ title, value, icon, bgColor, textColor }: {
    title: string;
    value: number;
    icon: string;
    bgColor: string;
    textColor: string;
}) {
    return (
        <div className="card">
            <div className="card-content">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">{title}</p>
                        <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    </div>
                    <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center text-2xl`}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${active
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
            `}
        >
            {label}
        </Link>
    );
}

function EmptyState({ onCreatePost }: { onCreatePost: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500 mb-6">
                Get started by creating your first social media post
            </p>
            <button onClick={onCreatePost} className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Post
            </button>
        </div>
    );
}

function PostCard({ post, onDelete }: {
    post: SocialPost;
    onDelete: (id: string) => void;
}) {
    const getStatusBadge = () => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
            SCHEDULED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Scheduled' },
            PUBLISHED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
            PUBLISHING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Publishing...' },
            FAILED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
        };
        const badge = badges[post.status] || badges.DRAFT;
        return <span className={`badge ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        {getStatusBadge()}
                        <p className="text-xs text-gray-500 mt-2">
                            {post.status === 'PUBLISHED' && post.publishedAt
                                ? `Published ${formatDate(post.publishedAt)}`
                                : post.status === 'SCHEDULED' && post.scheduledFor
                                    ? `Scheduled for ${formatDate(post.scheduledFor)}`
                                    : `Created ${formatDate(post.createdAt)}`
                            }
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-900 line-clamp-3 mb-3">{post.content}</p>

                {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-xs text-teal-600 mb-3 line-clamp-1">
                        {post.hashtags.map(tag => `#${tag}`).join(' ')}
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

                {post.media && post.media.length > 0 && (
                    <div className="mb-4 grid grid-cols-3 gap-2">
                        {post.media.slice(0, 3).map((media: any) => (
                            <div key={media.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button className="flex-1 btn btn-sm btn-secondary">
                        View
                    </button>
                    <button onClick={() => onDelete(post.id)} className="btn btn-sm btn-ghost text-red-600">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}