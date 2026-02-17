'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    // Exact colors from app: header/buttons use teal-600 = #0d9488, hover = teal-700 = #0f766e
    const TEAL      = '#0d9488'; // teal-600 — matches app buttons, logo bg, active states
    const TEAL_DARK = '#0f766e'; // teal-700 — matches app hover states
    const TEAL_DEEP = '#134e4a'; // teal-900 — for gradient depth

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>

            {/* ── Left branding panel — exact app teal ── */}
            <div
                className="login-left-panel"
                style={{
                    display: 'none',
                    width: '420px',
                    flexShrink: 0,
                    background: `linear-gradient(150deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '52px 44px',
                }}
            >
                {/* dot-grid texture */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                }} />
                {/* top-right glow */}
                <div style={{
                    position: 'absolute', top: '-80px', right: '-80px',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />
                {/* bottom-left glow */}
                <div style={{
                    position: 'absolute', bottom: '-60px', left: '-40px',
                    width: '250px', height: '250px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Top: brand + headline */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Logo — same style as app header logo box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '44px' }}>
                        <div style={{
                            width: '42px', height: '42px',
                            background: 'rgba(255,255,255,0.18)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>Shajag Vaidya Manager</div>
                            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>Ayurvedic Clinic Management</div>
                        </div>
                    </div>

                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', lineHeight: '1.25', letterSpacing: '-0.3px', marginBottom: '14px' }}>
                        Manage your clinic<br />
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>with clarity.</span>
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>
                        A complete Ayurvedic practice management system built for modern clinics.
                    </div>
                </div>

                {/* Bottom: feature list */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px',
                    }}>
                        Everything you need
                    </div>
                    {[
                        'Patient records & prescriptions',
                        'Appointments & therapy sessions',
                        'Billing, invoices & P&L reports',
                        'Staff management & attendance',
                        'Diet plans & patient portal',
                    ].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '4px',
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.8)" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                padding: '40px 24px',
                minHeight: '100vh',
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '44px 40px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)',
                }}>

                    {/* Mobile-only brand (hidden on desktop) */}
                    <div className="login-mob-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                        {/* Exact same logo box style as app header */}
                        <div style={{
                            width: '34px', height: '34px',
                            background: TEAL,
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Shajag Vaidya Manager</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>Ayurvedic Clinic Management</div>
                        </div>
                    </div>

                    {/* Heading */}
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '5px' }}>
                        Welcome back
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
                        Sign in to your account to continue
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '9px',
                            padding: '11px 13px', background: '#fef2f2',
                            border: '1px solid #fecaca', borderRadius: '10px',
                            marginBottom: '18px', fontSize: '13px', color: '#b91c1c',
                            fontWeight: 500, lineHeight: '1.5',
                        }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '1px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '18px' }}>
                            <label htmlFor="lp-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                Email address
                            </label>
                            <input
                                id="lp-email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={loading}
                                autoComplete="email"
                                style={{
                                    width: '100%', padding: '11px 13px',
                                    fontFamily: 'inherit', fontSize: '14px',
                                    color: '#0f172a', background: '#fff',
                                    border: '1.5px solid #e2e8f0', borderRadius: '9px',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label htmlFor="lp-password" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    Password
                                </label>
                                <Link href="/forgot-password" style={{ fontSize: '12.5px', color: TEAL, fontWeight: 600, textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="lp-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 13px',
                                        fontFamily: 'inherit', fontSize: '14px',
                                        color: '#0f172a', background: '#fff',
                                        border: '1.5px solid #e2e8f0', borderRadius: '9px',
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                    style={{
                                        position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Sign in button — same teal-600 as app's primary buttons */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '12px',
                                background: TEAL,
                                color: '#fff',
                                fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
                                border: 'none', borderRadius: '9px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: loading ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (!loading) (e.currentTarget).style.background = TEAL_DARK; }}
                            onMouseLeave={e => { if (!loading) (e.currentTarget).style.background = TEAL; }}
                        >
                            {loading ? (
                                <>
                                    <svg style={{ animation: 'lp-spin 0.7s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Signing in…
                                </>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>New to the platform?</span>
                        <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                    </div>

                    {/* Register link */}
                    <div style={{ textAlign: 'center' }}>
                        <Link href="/register" style={{ fontSize: '13.5px', color: TEAL, fontWeight: 700, textDecoration: 'none' }}>
                            Register for a patient account
                        </Link>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#94a3b8', marginTop: '20px' }}>
                        © {new Date().getFullYear()} Shajag Vaidya Clinic. All rights reserved.
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes lp-spin { to { transform: rotate(360deg); } }
                @media (min-width: 1024px) {
                    .login-left-panel { display: flex !important; }
                    .login-mob-brand  { display: none  !important; }
                }
            `}</style>
        </div>
    );
}