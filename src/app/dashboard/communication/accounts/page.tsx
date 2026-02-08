'use client';

import { useState, useEffect } from 'react';

interface SocialAccount {
    id: string;
    platform: string;
    accountName: string;
    username?: string;
    profilePicture?: string;
    followers?: number;
    isActive: boolean;
    lastSync?: string;
    createdAt: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = (platform: string) => {
        alert(`OAuth connection for ${platform} coming soon!`);
        // Will redirect to: `/api/social/accounts/connect/${platform.toLowerCase()}`
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Disconnect this account?')) return;

        try {
            const res = await fetch(`/api/social/accounts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAccounts(accounts.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Error disconnecting account:', error);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/social/accounts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            });
            if (res.ok) {
                fetchAccounts();
            }
        } catch (error) {
            console.error('Error toggling account:', error);
        }
    };

    const availablePlatforms = [
        { name: 'Facebook', platform: 'FACEBOOK', icon: '📘', color: 'bg-blue-500', description: 'Connect your Facebook Page' },
        { name: 'Instagram', platform: 'INSTAGRAM', icon: '📷', color: 'bg-pink-500', description: 'Connect your Instagram Business Account' },
        { name: 'LinkedIn', platform: 'LINKEDIN', icon: '💼', color: 'bg-blue-700', description: 'Connect your LinkedIn Profile or Page' },
        { name: 'Twitter', platform: 'TWITTER', icon: '🐦', color: 'bg-sky-500', description: 'Connect your Twitter Account' },
    ];

    const connectedPlatforms = accounts.map(a => a.platform);
    const availableToConnect = availablePlatforms.filter(p => !connectedPlatforms.includes(p.platform));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-6 py-8 max-w-[1400px] mx-auto">
                {/* Modern Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Accounts</h1>
                            <p className="text-base text-gray-600">
                                Manage and monitor your social media connections
                            </p>
                        </div>
                        {accounts.length > 0 && (
                            <div className="flex items-center gap-6 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-200">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
                                    <div className="text-xs text-gray-500 mt-1">Connected</div>
                                </div>
                                <div className="h-12 w-px bg-gray-200"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-teal-600">
                                        {accounts.filter(a => a.isActive).length}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Active</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-teal-600 rounded-full opacity-20"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Connected Accounts */}
                        {accounts.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Your Accounts</h2>
                                    <button className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh All
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {accounts.map((account) => (
                                        <ConnectedAccountCard
                                            key={account.id}
                                            account={account}
                                            onDisconnect={handleDisconnect}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available to Connect */}
                        {availableToConnect.length > 0 && (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        {accounts.length > 0 ? 'Add More Accounts' : 'Connect Your First Account'}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Expand your reach by connecting additional social media platforms
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {availableToConnect.map((platform) => (
                                        <PlatformCard
                                            key={platform.platform}
                                            platform={platform}
                                            onConnect={handleConnect}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConnectedAccountCard({ account, onDisconnect, onToggleActive }: {
    account: SocialAccount;
    onDisconnect: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
}) {
    const getPlatformIcon = (platform: string) => {
        const icons: Record<string, string> = {
            FACEBOOK: '📘',
            INSTAGRAM: '📷',
            LINKEDIN: '💼',
            TWITTER: '🐦',
        };
        return icons[platform] || '🌐';
    };

    const getPlatformColor = (platform: string) => {
        const colors: Record<string, string> = {
            FACEBOOK: 'from-blue-500 to-blue-600',
            INSTAGRAM: 'from-pink-500 to-purple-600',
            LINKEDIN: 'from-blue-700 to-blue-800',
            TWITTER: 'from-sky-400 to-sky-500',
        };
        return colors[platform] || 'from-gray-500 to-gray-600';
    };

    const formatNumber = (num: number) => {
        if (num == null || num === undefined) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-teal-300 overflow-hidden">
            {/* Premium Header with Gradient */}
            <div className={`h-24 bg-gradient-to-br ${getPlatformColor(account.platform)} flex items-center justify-between px-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl shadow-lg">
                        {getPlatformIcon(account.platform)}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg tracking-tight">{account.platform}</h3>
                        <p className="text-white/90 text-sm font-medium">@{account.username || account.accountName}</p>
                    </div>
                </div>
                <div className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg relative z-10 ${
                    account.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-white/90 text-gray-700'
                }`}>
                    {account.isActive ? '● Active' : '○ Paused'}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{account.accountName}</div>
                    </div>
                    {account.followers !== undefined && (
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4 border border-teal-200">
                            <div className="text-xs font-medium text-teal-700 uppercase tracking-wide mb-1">Followers</div>
                            <div className="text-sm font-bold text-teal-900">{formatNumber(account.followers)}</div>
                        </div>
                    )}
                </div>

                {/* Last Sync */}
                {account.lastSync && (
                    <div className="flex items-center gap-2 mb-5 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last synced: {new Date(account.lastSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2.5">
                    <button
                        onClick={() => onToggleActive(account.id, account.isActive)}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                            account.isActive
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                        }`}
                    >
                        {account.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync
                    </button>
                    <button
                        onClick={() => onDisconnect(account.id)}
                        className="px-4 py-2.5 rounded-xl font-medium text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlatformCard({ platform, onConnect }: {
    platform: { name: string; platform: string; icon: string; color: string; description: string };
    onConnect: (platform: string) => void;
}) {
    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-dashed border-gray-300 hover:border-teal-400 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-16 h-16 ${platform.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {platform.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-1.5">{platform.name}</h3>
                        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{platform.description}</p>

                        {/* Connect Button */}
                        <button
                            onClick={() => onConnect(platform.platform)}
                            className="w-full px-4 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Connect {platform.name}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}