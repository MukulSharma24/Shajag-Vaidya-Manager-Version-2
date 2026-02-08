'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostTemplate {
    id: string;
    name: string;
    description?: string;
    content: string;
    platforms: string[];
    mediaSlots: number;
    category?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<PostTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;

        try {
            const res = await fetch(`/api/social/templates/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', 'Promotional', 'Educational', 'Announcement', 'Engagement'];

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Post Templates</h1>
                        <p className="text-sm text-gray-500">
                            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Template
                    </button>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="card-content">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-10"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="flex gap-2 overflow-x-auto">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`btn btn-sm whitespace-nowrap ${
                                            filterCategory === cat ? 'btn-primary' : 'btn-ghost'
                                        }`}
                                    >
                                        {cat === 'all' ? 'All' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <EmptyState onCreateTemplate={() => setShowCreateModal(true)} hasSearch={searchQuery.length > 0} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onDelete={() => handleDelete(template.id)}
                            onUse={() => alert('Use template feature coming soon!')}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTemplateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchTemplates();
                    }}
                />
            )}
        </div>
    );
}

function EmptyState({ onCreateTemplate, hasSearch }: { onCreateTemplate: () => void; hasSearch: boolean }) {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasSearch ? 'No templates match your search' : 'No templates yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                {hasSearch ? 'Try a different search term' : 'Create reusable templates to save time'}
            </p>
            {!hasSearch && (
                <button onClick={onCreateTemplate} className="btn btn-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Template
                </button>
            )}
        </div>
    );
}

function TemplateCard({ template, onDelete, onUse }: {
    template: PostTemplate;
    onDelete: () => void;
    onUse: () => void;
}) {
    return (
        <div className="card card-hover">
            <div className="card-content">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        {template.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>
                        )}
                    </div>
                    {template.category && (
                        <span className="badge bg-purple-100 text-purple-700 border-purple-200">
                            {template.category}
                        </span>
                    )}
                </div>

                {/* Content Preview */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                </div>

                {/* Platforms */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500">Platforms:</span>
                    {template.platforms.map((platform) => (
                        <span key={platform} className="text-sm">
                            {platform === 'FACEBOOK' && '📘'}
                            {platform === 'INSTAGRAM' && '📷'}
                            {platform === 'LINKEDIN' && '💼'}
                            {platform === 'TWITTER' && '🐦'}
                        </span>
                    ))}
                </div>

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {tag}
                            </span>
                        ))}
                        {template.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                +{template.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={onUse} className="flex-1 btn btn-sm btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Use Template
                    </button>
                    <button className="btn btn-sm btn-ghost">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
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

function CreateTemplateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Promotional');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const togglePlatform = (platform: string) => {
        setPlatforms(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !content || platforms.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/social/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    content,
                    category,
                    platforms,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            if (res.ok) {
                alert('Template created successfully!');
                onSuccess();
            } else {
                alert('Failed to create template');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating template');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold">Create Template</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div>
                            <label className="form-label">Template Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                                placeholder="e.g., Weekly Health Tip"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="form-input"
                                placeholder="Brief description of this template"
                            />
                        </div>

                        <div>
                            <label className="form-label">Content *</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                className="form-textarea"
                                placeholder="Template content... Use {variable} for placeholders"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
                                <option value="Promotional">Promotional</option>
                                <option value="Educational">Educational</option>
                                <option value="Announcement">Announcement</option>
                                <option value="Engagement">Engagement</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label mb-3">Platforms *</label>
                            <div className="grid grid-cols-4 gap-3">
                                {['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER'].map(platform => (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => togglePlatform(platform)}
                                        className={`p-3 rounded-lg border-2 transition-all ${
                                            platforms.includes(platform)
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <span className="text-2xl">
                                            {platform === 'FACEBOOK' && '📘'}
                                            {platform === 'INSTAGRAM' && '📷'}
                                            {platform === 'LINKEDIN' && '💼'}
                                            {platform === 'TWITTER' && '🐦'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="form-input"
                                placeholder="health, wellness, tips"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Creating...' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}