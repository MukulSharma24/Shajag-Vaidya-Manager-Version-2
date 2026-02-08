'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function EditTemplatePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [template, setTemplate] = useState<PostTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Promotional');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [tags, setTags] = useState('');

    useEffect(() => {
        fetchTemplate();
    }, [params.id]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/social/templates/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
                setName(data.name);
                setDescription(data.description || '');
                setContent(data.content);
                setCategory(data.category || 'Promotional');
                setPlatforms(data.platforms || []);
                setTags(data.tags?.join(', ') || '');
            } else {
                alert('Template not found');
                router.push('/dashboard/communication/templates');
            }
        } catch (error) {
            console.error('Error fetching template:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlatform = (platform: string) => {
        setPlatforms(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !content || platforms.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/social/templates/${params.id}`, {
                method: 'PATCH',
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
                alert('Template updated successfully!');
                router.push('/dashboard/communication/templates');
            } else {
                alert('Failed to update template');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this template?')) return;

        try {
            const res = await fetch(`/api/social/templates/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('Template deleted successfully!');
                router.push('/dashboard/communication/templates');
            } else {
                alert('Failed to delete template');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting template');
        }
    };

    if (loading) {
        return (
            <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
                <div className="text-center py-20">
                    <h3 className="text-lg font-medium text-gray-900">Template not found</h3>
                    <Link href="/dashboard/communication/templates" className="btn btn-primary mt-4">
                        Back to Templates
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 py-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Template</h1>
                    <Link href="/dashboard/communication/templates" className="btn btn-secondary">
                        Back to Templates
                    </Link>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6">
                <div className="card">
                    <div className="card-content space-y-4">
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
                                rows={8}
                                className="form-textarea"
                                placeholder="Template content... Use {variable} for placeholders"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {content.length} characters
                            </p>
                        </div>

                        <div>
                            <label className="form-label">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="form-select"
                            >
                                <option value="Promotional">Promotional</option>
                                <option value="Educational">Educational</option>
                                <option value="Announcement">Announcement</option>
                                <option value="Engagement">Engagement</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label mb-3">Platforms *</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER'].map(platform => (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => togglePlatform(platform)}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            platforms.includes(platform)
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">
                                                {platform === 'FACEBOOK' && '📘'}
                                                {platform === 'INSTAGRAM' && '📷'}
                                                {platform === 'LINKEDIN' && '💼'}
                                                {platform === 'TWITTER' && '🐦'}
                                            </span>
                                            <span className="text-xs font-medium text-gray-700">
                                                {platform.charAt(0) + platform.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {platforms.length} platform(s) selected
                            </p>
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
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="btn btn-ghost text-red-600"
                    >
                        Delete Template
                    </button>
                    <div className="flex-1" />
                    <Link
                        href="/dashboard/communication/templates"
                        className="btn btn-secondary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}