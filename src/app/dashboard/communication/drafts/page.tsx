'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SocialPost {
    id: string;
    content: string;
    hashtags: string[];
    status: string;
    scheduledFor?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    media: any[];
    platformPosts: any[];
}

export default function DraftsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const [drafts, setDrafts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated'>('newest');
    const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/posts?status=DRAFT');
            if (res.ok) {
                const data = await res.json();
                setDrafts(data.posts || []);
            }
        } catch (error) {
            console.error('Error fetching drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this draft?')) return;

        try {
            const res = await fetch(`/api/social/posts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setDrafts(drafts.filter(d => d.id !== id));
                setSelectedDrafts(selectedDrafts.filter(sid => sid !== id));
                alert('Draft deleted successfully!');
            } else {
                alert('Failed to delete draft');
            }
        } catch (error) {
            console.error('Error deleting draft:', error);
            alert('Error deleting draft');
        }
    };

    const handlePublish = async (id: string) => {
        if (!confirm('Publish this post now to all selected platforms?')) return;

        try {
            // First update status to PUBLISHED
            const updateRes = await fetch(`/api/social/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'PUBLISHED',
                    publishedAt: new Date().toISOString(),
                }),
            });

            if (!updateRes.ok) {
                throw new Error('Failed to update post status');
            }

            // Then trigger publishing
            const publishRes = await fetch(`/api/social/posts/${id}/publish`, {
                method: 'POST',
            });

            if (publishRes.ok) {
                const result = await publishRes.json();
                alert('Post published successfully!');
                // Remove from drafts list
                setDrafts(drafts.filter(d => d.id !== id));
                // Optionally redirect to published
                router.push('/dashboard/communication/published');
            } else {
                alert('Post status updated but publishing failed. Check published posts.');
                setDrafts(drafts.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Error publishing post');
        }
    };

    const handleEdit = (post: SocialPost) => {
        // For now, show alert. Later we can open edit modal
        alert('Edit functionality coming soon! For now, you can delete and create a new post.');
        // TODO: Open edit modal with post data pre-filled
    };

    const handleBulkDelete = async () => {
        if (selectedDrafts.length === 0) return;
        if (!confirm(`Delete ${selectedDrafts.length} draft(s)?`)) return;

        try {
            await Promise.all(
                selectedDrafts.map(id =>
                    fetch(`/api/social/posts/${id}`, { method: 'DELETE' })
                )
            );
            setDrafts(drafts.filter(d => !selectedDrafts.includes(d.id)));
            setSelectedDrafts([]);
            alert('Drafts deleted successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting drafts');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedDrafts(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedDrafts.length === filteredDrafts.length) {
            setSelectedDrafts([]);
        } else {
            setSelectedDrafts(filteredDrafts.map(d => d.id));
        }
    };

    const filteredDrafts = drafts
        .filter(draft =>
            draft.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            draft.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Draft Posts</h1>
                        <p className="text-sm text-gray-500">{filteredDrafts.length} draft(s) saved</p>
                    </div>
                    <Link href="/dashboard/communication" className="btn btn-secondary">
                        Back to All Posts
                    </Link>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <TabLink href="/dashboard/communication" label="All Posts" active={pathname === '/dashboard/communication'} />
                        <TabLink href="/dashboard/communication/drafts" label="Drafts" active={pathname === '/dashboard/communication/drafts'} />
                        <TabLink href="/dashboard/communication/scheduled" label="Scheduled" active={pathname === '/dashboard/communication/scheduled'} />
                        <TabLink href="/dashboard/communication/published" label="Published" active={pathname === '/dashboard/communication/published'} />
                        <TabLink href="/dashboard/communication/templates" label="Templates" active={pathname === '/dashboard/communication/templates'} />
                        <TabLink href="/dashboard/communication/accounts" label="Accounts" active={pathname === '/dashboard/communication/accounts'} />
                    </nav>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="card-content">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search drafts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-10"
                                />
                            </div>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-select md:w-48">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="updated">Recently Updated</option>
                            </select>
                            {selectedDrafts.length > 0 && (
                                <button onClick={handleBulkDelete} className="btn btn-ghost text-red-600">
                                    Delete {selectedDrafts.length}
                                </button>
                            )}
                        </div>
                        {filteredDrafts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDrafts.length === filteredDrafts.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-teal-600 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Select All ({filteredDrafts.length})
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : filteredDrafts.length === 0 ? (
                <EmptyState hasSearch={searchQuery.length > 0} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDrafts.map((draft) => (
                        <DraftCard
                            key={draft.id}
                            draft={draft}
                            isSelected={selectedDrafts.includes(draft.id)}
                            onToggleSelect={() => toggleSelect(draft.id)}
                            onDelete={() => handleDelete(draft.id)}
                            onEdit={() => handleEdit(draft)}
                            onPublish={() => handlePublish(draft.id)}
                        />
                    ))}
                </div>
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

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasSearch ? 'No drafts match your search' : 'No drafts yet'}
            </h3>
            <p className="text-sm text-gray-500">
                {hasSearch ? 'Try a different search term' : 'Create a post and save it as draft'}
            </p>
        </div>
    );
}

function DraftCard({ draft, isSelected, onToggleSelect, onDelete, onEdit, onPublish }: {
    draft: SocialPost;
    isSelected: boolean;
    onToggleSelect: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onPublish: () => void;
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`card card-hover relative ${isSelected ? 'ring-2 ring-teal-500' : ''}`}>
            <div className="absolute top-4 left-4 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-5 h-5 text-teal-600 rounded"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="card-content pl-12">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="badge bg-gray-100 text-gray-700 border-gray-200 mb-2">Draft</span>
                        <p className="text-xs text-gray-500">Saved {formatDate(draft.createdAt)}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-900 line-clamp-3 mb-3">{draft.content}</p>
                {draft.hashtags && draft.hashtags.length > 0 && (
                    <p className="text-xs text-teal-600 mb-3 line-clamp-1">
                        {draft.hashtags.map(tag => `#${tag}`).join(' ')}
                    </p>
                )}
                <div className="flex items-center gap-2 mb-4">
                    {draft.platformPosts.map((pp: any) => (
                        <span key={pp.id} className="text-sm">
                            {pp.platform === 'FACEBOOK' && '📘'}
                            {pp.platform === 'INSTAGRAM' && '📷'}
                            {pp.platform === 'LINKEDIN' && '💼'}
                            {pp.platform === 'TWITTER' && '🐦'}
                        </span>
                    ))}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={onEdit} className="flex-1 btn btn-sm btn-secondary">
                        Edit
                    </button>
                    <button onClick={onPublish} className="flex-1 btn btn-sm btn-primary">
                        Publish
                    </button>
                    <button onClick={onDelete} className="btn btn-sm btn-ghost text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}