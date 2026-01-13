'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(form),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json().catch(() => ({ message: 'Registration failed' }));

            if (res.ok) {
                router.push('/login');
            } else {
                setError(data.message || 'Failed to register');
                setLoading(false);
            }
        } catch (err) {
            console.error('Register error:', err);
            setError('Connection failed. Please check your internet.');
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <form onSubmit={handleSubmit} className="animate-fade" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h2>
                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Name</label>
                    <input
                        type="text"
                        required
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                    />
                </div>
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
                        transition: '0.2s',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}>
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <a href="/login" style={{ color: 'var(--primary)' }}>Login</a>
                </p>
            </form>
        </div>
    );
}
