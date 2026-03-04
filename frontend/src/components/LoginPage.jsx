import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // ── Step 1: Request OTP via Supabase ──────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log('📡 Attempting Supabase OTP for:', email);
            const { error: sbError } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false }, // only allow existing users
            });
            if (sbError) {
                console.error('❌ Supabase Auth Error:', sbError);
                throw new Error(sbError.message);
            }
            setStep('otp');
            startResendCooldown();
        } catch (err) {
            console.error('❌ Login error:', err);
            setError(err.message || 'Failed to send code. Check your email address.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP via Supabase ───────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: sbError } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'email',
            });
            if (sbError) throw new Error(sbError.message);

            const accessToken = data?.session?.access_token;
            if (!accessToken) throw new Error('No session returned. Please try again.');

            localStorage.setItem('token', accessToken);
            localStorage.setItem('userEmail', email);
            onLoginSuccess(accessToken);
        } catch (err) {
            setError(err.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend code ───────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setCode('');
        setLoading(true);
        try {
            const { error: sbError } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            });
            if (sbError) throw new Error(sbError.message);
            startResendCooldown();
        } catch (err) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = () => {
        setResendCooldown(30);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleBack = () => {
        setStep('email');
        setCode('');
        setError('');
    };

    return (
        <div className="login-container-v2">
            <div className="login-box-v2 glass-card">
                <div className="login-header-v2">
                    <span className="login-logo-v2">🤖</span>
                    <h1 className="glow-text">Robot Control</h1>
                    <p>Secure Nexus Access</p>
                </div>

                {/* ── Step 1: Email ──────────────────────────────────── */}
                {step === 'email' && (
                    <form onSubmit={handleSendOtp} className="modern-login-form otp-animate-in">
                        <div className="input-group-v2">
                            <label>Identity (Email)</label>
                            <input
                                type="email"
                                placeholder="operator@nexus.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={loading} className="login-submit-btn">
                            {loading ? 'Sending Code...' : 'Send One-Time Code →'}
                        </button>
                    </form>
                )}

                {/* ── Step 2: OTP Code ───────────────────────────────── */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="modern-login-form otp-animate-in">
                        <div className="otp-sent-notice">
                            <span className="otp-sent-icon">📧</span>
                            <p>Code sent to<br /><strong>{email}</strong></p>
                        </div>
                        <div className="input-group-v2">
                            <label>One-Time Code</label>
                            <input
                                className="otp-code-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={10}
                                placeholder="_ _ _ _ _ _ _ _"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                required
                                autoFocus
                            />
                            <p className="input-hint">Enter the 6 or 8 digit code from your email.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="login-submit-btn"
                        >
                            {loading ? 'Verifying...' : 'Establish Connection'}
                        </button>
                        <div className="otp-actions">
                            <button type="button" className="otp-back-btn" onClick={handleBack}>
                                ← Change Email
                            </button>
                            <button
                                type="button"
                                className={`otp-resend-btn ${resendCooldown > 0 ? 'disabled' : ''}`}
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || loading}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                            </button>
                        </div>
                    </form>
                )}

                {error && <p className="login-error-v2">{error}</p>}

                <div className="login-footer-v2">
                    <p>Authorized personnel only. Data-link encrypted.</p>
                </div>
            </div>
        </div>
    );
}
