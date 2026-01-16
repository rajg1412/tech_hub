'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password/confirm`,
            });
            if (error) throw error;
            setMessage('Check your email for the password reset link.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <form onSubmit={handleSubmit} className="animate-fade" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h2>
                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
                {message && <p style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: loading ? 'var(--text-muted)' : 'var(--primary)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}>
                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Remember your password? <a href="/login" style={{ color: 'var(--primary)' }}>Login</a>
                </p>
            </form>
        </div>
    );
}
