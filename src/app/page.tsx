'use client';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth(); // Use global auth state instead of localStorage

  return (
    <div className="container animate-fade" style={{ textAlign: 'center', paddingTop: '10vh' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, var(--primary), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Next-Gen Tech Hub
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
        A premium platform for developers to manage profiles and showcase their skills.
        Built with Next.js, TypeScript, and Supabase.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {user ? (
          <>
            <a href="/profile" style={{ padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '0.5rem', fontWeight: 'bold' }}>Go to Profile</a>
            {user.role === 'admin' && (
              <a href="/admin" style={{ padding: '1rem 2rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', fontWeight: 'bold' }}>Admin Dashboard</a>
            )}
          </>
        ) : (
          <>
            <a href="/register" style={{ padding: '1rem 2rem', background: 'var(--primary)', borderRadius: '0.5rem', fontWeight: 'bold' }}>Get Started</a>
            <a href="/login" style={{ padding: '1rem 2rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', fontWeight: 'bold' }}>Sign In</a>
          </>
        )}
      </div>
    </div>
  );
}
