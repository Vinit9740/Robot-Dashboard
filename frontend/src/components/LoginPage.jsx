import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── Handle Login ──────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: sbError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (sbError) throw sbError;

            const accessToken = data?.session?.access_token;
            if (!accessToken) throw new Error('Auth failed');

            // Check if user is verified by making a quick test call to backend
            try {
                const res = await fetch('http://127.0.0.1:5000/health', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const resData = await res.json();
                if (res.status === 403 && resData.error_code === 'USER_NOT_VERIFIED') {
                    throw new Error("Account awaiting admin approval.");
                }
            } catch (e) {
                if (e.message.includes("approval")) throw e;
            }

            localStorage.setItem('token', accessToken);
            localStorage.setItem('userEmail', email);
            onLoginSuccess(accessToken);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Handle Signup ─────────────────────────────────────────────────────
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: sbError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username: username }
                }
            });
            if (sbError) throw sbError;

            setStep('otp');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Verify OTP ────────────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: sbError } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'signup',
            });
            if (sbError) throw sbError;

            setStep('form');
            setMode('login');
            setError("Email verified! Please wait for an admin to approve your account.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container-v2">
            <div className="login-box-v2 glass-card">
                <div className="login-header-v2">
                    <span className="login-logo-v2">🤖</span>
                    <h1 className="glow-text">Robot Control</h1>
                    <p>{mode === 'login' ? 'Secure Nexus Access' : 'Register New Operative'}</p>
                </div>

                {step === 'form' ? (
                    <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="modern-login-form">
                        {mode === 'signup' && (
                            <div className="input-group-v2">
                                <label>Username</label>
                                <input
                                    type="text"
                                    placeholder="ghost_operator"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="input-group-v2">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="operator@nexus.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group-v2">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="login-submit-btn">
                            {loading ? 'Processing...' : (mode === 'login' ? 'Establish Connection →' : 'Initialize Signup →')}
                        </button>

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="otp-back-btn"
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                            >
                                {mode === 'login' ? 'Need an account? Signup' : 'Already registered? Login'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="modern-login-form">
                        <div className="otp-sent-notice">
                            <span className="otp-sent-icon">📧</span>
                            <p>Verification code sent to<br /><strong>{email}</strong></p>
                        </div>
                        <div className="input-group-v2">
                            <label>Verification Code</label>
                            <input
                                className="otp-code-input"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="login-submit-btn">
                            {loading ? 'Verifying...' : 'Complete Registration'}
                        </button>

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="otp-back-btn"
                                onClick={() => setStep('form')}
                            >
                                ← Back to Signup
                            </button>
                        </div>
                    </form>
                )}

                {error && <p className={`login-error-v2 ${error.includes('verified') ? 'success-msg' : ''}`}>{error}</p>}

                <div className="login-footer-v2">
                    <p>Authorized personnel only. Data-link encrypted.</p>
                </div>
            </div>
        </div>
    );
}
