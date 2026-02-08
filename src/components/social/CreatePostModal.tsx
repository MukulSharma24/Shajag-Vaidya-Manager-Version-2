'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Platform {
    id: string;
    platform: string;
    accountId: string;
    accountName: string;
    isSelected: boolean;
}

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface UploadedMedia {
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO';
    thumbnail?: string;
}

export default function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [platforms, setPlatforms] = useState<Platform[]>([
        { id: '1', platform: 'FACEBOOK', accountId: 'fb-1', accountName: 'My Facebook Page', isSelected: false },
        { id: '2', platform: 'INSTAGRAM', accountId: 'ig-1', accountName: 'My Instagram', isSelected: false },
        { id: '3', platform: 'LINKEDIN', accountId: 'li-1', accountName: 'My LinkedIn', isSelected: false },
        { id: '4', platform: 'TWITTER', accountId: 'tw-1', accountName: 'My Twitter', isSelected: false },
    ]);
    const [postType, setPostType] = useState<'now' | 'draft' | 'schedule'>('draft');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Media upload states
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
    const [uploading, setUploading] = useState(false);

    const togglePlatform = (id: string) => {
        setPlatforms(platforms.map(p =>
            p.id === id ? { ...p, isSelected: !p.isSelected } : p
        ));
    };

    const getHashtagsArray = () => {
        if (!hashtags.trim()) return [];
        return hashtags
            .split(/[\s,]+/)
            .map(tag => tag.replace('#', '').trim())
            .filter(tag => tag.length > 0);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset || 'social_uploads');

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const newMedia: UploadedMedia = {
                        id: data.public_id,
                        url: data.secure_url,
                        type: data.resource_type === 'video' ? 'VIDEO' : 'IMAGE',
                        thumbnail: data.resource_type === 'video' ? data.secure_url.replace(/\.[^.]+$/, '.jpg') : undefined,
                    };
                    setUploadedMedia(prev => [...prev, newMedia]);
                } else {
                    console.error('Upload failed for file:', file.name);
                    alert(`Failed to upload ${file.name}`);
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files');
        } finally {
            setUploading(false);
        }
    };

    const removeMedia = (id: string) => {
        setUploadedMedia(prev => prev.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            alert('Please enter post content');
            return;
        }

        const selectedPlatforms = platforms.filter(p => p.isSelected);
        if (selectedPlatforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        if (postType === 'schedule' && (!scheduledDate || !scheduledTime)) {
            alert('Please select date and time for scheduled post');
            return;
        }

        setSubmitting(true);

        try {
            const postData = {
                content: content.trim(),
                hashtags: getHashtagsArray(),
                platforms: selectedPlatforms.map(p => ({
                    platform: p.platform,
                    accountId: p.accountId,
                })),
                media: uploadedMedia.map(m => ({
                    type: m.type,
                    url: m.url,
                    publicId: m.id,
                    thumbnail: m.thumbnail,
                })),
                status: postType === 'draft' ? 'DRAFT' : postType === 'schedule' ? 'SCHEDULED' : 'PUBLISHED',
                scheduledFor: postType === 'schedule' ? `${scheduledDate}T${scheduledTime}` : null,
                createdBy: 'current-user-id',
            };

            const res = await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (res.ok) {
                alert('Post created successfully!');
                onSuccess();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post');
        } finally {
            setSubmitting(false);
        }
    };

    const characterCount = content.length;
    const maxChars = 2000;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">
                        {/* Content Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="form-label">Post Content <span className="text-red-500">*</span></label>
                                <span className={`text-xs ${characterCount > maxChars ? 'text-red-500' : 'text-gray-500'}`}>
                                    {characterCount} / {maxChars}
                                </span>
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                className="form-textarea"
                                placeholder="What's on your mind? Share your thoughts..."
                                maxLength={maxChars}
                                required
                            />
                        </div>

                        {/* Hashtags */}
                        <div>
                            <label className="form-label">Hashtags (optional)</label>
                            <input
                                type="text"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                className="form-input"
                                placeholder="#health #wellness #ayurveda"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Separate hashtags with spaces or commas
                            </p>
                        </div>

                        {/* Platform Selection */}
                        <div>
                            <label className="form-label mb-3">Select Platforms <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {platforms.map((platform) => (
                                    <button
                                        key={platform.id}
                                        type="button"
                                        onClick={() => togglePlatform(platform.id)}
                                        className={`
                                            p-4 rounded-lg border-2 transition-all
                                            ${platform.isSelected
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }
                                        `}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">
                                                {platform.platform === 'FACEBOOK' && '📘'}
                                                {platform.platform === 'INSTAGRAM' && '📷'}
                                                {platform.platform === 'LINKEDIN' && '💼'}
                                                {platform.platform === 'TWITTER' && '🐦'}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {platform.platform.charAt(0) + platform.platform.slice(1).toLowerCase()}
                                            </span>
                                            {platform.isSelected && (
                                                <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {platforms.filter(p => p.isSelected).length} platform(s) selected
                            </p>
                        </div>

                        {/* Media Upload - NOW WORKING! */}
                        <div>
                            <label className="form-label">Add Media</label>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                                <input
                                    type="file"
                                    id="media-upload"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <label htmlFor="media-upload" className="cursor-pointer">
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-600 border-t-transparent"></div>
                                            <p className="text-sm text-gray-600">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="mx-auto w-12 h-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="text-teal-600 font-medium">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">Images or videos (Max 10MB)</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            {/* Uploaded Media Preview */}
                            {uploadedMedia.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {uploadedMedia.map((media) => (
                                        <div key={media.id} className="relative group">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                {media.type === 'IMAGE' ? (
                                                    <img
                                                        src={media.url}
                                                        alt="Uploaded"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(media.id)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Publishing Options */}
                        <div>
                            <label className="form-label mb-3">Publishing Options</label>
                            <div className="space-y-3">
                                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                                    <input
                                        type="radio"
                                        checked={postType === 'draft'}
                                        onChange={() => setPostType('draft')}
                                        className="w-4 h-4 text-teal-600"
                                    />
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Save as Draft</p>
                                        <p className="text-xs text-gray-500">Save for later and publish when ready</p>
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                                    <input
                                        type="radio"
                                        checked={postType === 'schedule'}
                                        onChange={() => setPostType('schedule')}
                                        className="w-4 h-4 text-teal-600"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className="font-medium text-gray-900">Schedule for Later</p>
                                        <p className="text-xs text-gray-500 mb-2">Choose when to publish</p>

                                        {postType === 'schedule' && (
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <input
                                                    type="date"
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="form-input text-sm"
                                                    required
                                                />
                                                <input
                                                    type="time"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="form-input text-sm"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                                    <input
                                        type="radio"
                                        checked={postType === 'now'}
                                        onChange={() => setPostType('now')}
                                        className="w-4 h-4 text-teal-600"
                                    />
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Publish Now</p>
                                        <p className="text-xs text-gray-500">Post immediately to selected platforms</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                            disabled={submitting || uploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || uploading}
                        >
                            {submitting ? 'Creating...' :
                                postType === 'draft' ? 'Save Draft' :
                                    postType === 'schedule' ? 'Schedule Post' :
                                        'Publish Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}