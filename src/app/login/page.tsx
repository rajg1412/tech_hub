'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('verified')) {
            setSuccess('Email verified successfully! You can now log in.');
        }
        if (searchParams.get('error')) {
            setError(searchParams.get('error') || 'An error occurred');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(form),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json().catch(() => ({ message: 'Unexpected server response' }));

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/profile');
                router.refresh();
                // We don't setLoading(false) here because we are redirecting
            } else {
                setError(data.message || 'Login failed');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection failed. Please check your network.');
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <form onSubmit={handleSubmit} className="animate-fade" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>
                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
                {success && <p style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{success}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
                    <input
                        type="email"
                        required
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                    <input
                        type="password"
                        required
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Don't have an account? <a href="/register" style={{ color: 'var(--primary)' }}>Register</a>
                </p>
            </form>
        </div>
    );
}
