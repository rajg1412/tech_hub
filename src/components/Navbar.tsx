'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const router = useRouter();
    const { user, logout, loading } = useAuth();

    return (
        <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)' }}>
            <h1 onClick={() => router.push('/')} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', cursor: 'pointer' }}>TechHub</h1>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <a href="/">Home</a>

                {!loading && user ? (
                    <>
                        <a href="/profile">Profile</a>
                        {user.role === 'admin' && <a href="/admin">Admin Panel</a>}
                        <button
                            onClick={logout}
                            style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>
                            Logout
                        </button>
                    </>
                ) : !loading && (
                    <>
                        <a href="/login" style={{ color: 'var(--primary)' }}>Login</a>
                        <a href="/register" style={{ border: '1px solid var(--primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Register</a>
                    </>
                )}
            </div>
        </nav>
    );
}
