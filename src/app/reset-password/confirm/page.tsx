'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { EmailOtpType } from '@supabase/supabase-js';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const handleVerification = async () => {
            // Method 1: Check for session directly (handled by detectSessionInUrl for hash fragments)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setMessage('Identity verified. Please enter your new password.');
                setLoading(false);
                return;
            }

            // Method 2: Check for explicit token in URL (for custom template)
            const token = searchParams.get('token') || searchParams.get('token_hash');
            const type = (searchParams.get('type') as EmailOtpType) || 'recovery';

            if (token) {
                const { error } = await supabase.auth.verifyOtp({ token_hash: token, type });
                if (error) {
                    setError(`Verification failed: ${error.message}`);
                } else {
                    setMessage('Identity verified. Please enter your new password.');
                }
                setLoading(false);
                return;
            }

            // If neither worked immediately, listen for the PAWWORD_RECOVERY event
            // which usually fires shortly after the page loads if using hash fragments
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'PASSWORD_RECOVERY' || session) {
                    setMessage('Identity verified. Please enter your new password.');
                    setLoading(false);
                }
            });

            // Set a timeout to show error if nothing happens
            const timer = setTimeout(() => {
                if (loading) { // logic here is tricky with closures, but sufficient for simple fallback
                    setLoading(false);
                    // Only set error if we haven't found a way to verify yet
                    // We check the "message" state effectively by proxy or verify current session one last time
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (!session && !token) {
                            setError('Invalid reset link: Missing token.');
                        }
                    });
                }
            }, 2000);

            return () => {
                subscription.unsubscribe();
                clearTimeout(timer);
            };
        };

        handleVerification();
    }, [searchParams, supabase.auth]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            router.push('/login?message=Password updated successfully');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Verifying reset link...</div>;
    }

    if (error && !message) {
        return (
            <div className="animate-fade" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Error</h2>
                <p style={{ marginBottom: '1.5rem' }}>{error}</p>
                <a href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Try sending a new link</a>
            </div>
        );
    }

    return (
        <form onSubmit={handleUpdatePassword} className="animate-fade" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Set New Password</h2>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
            {message && <p style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>New Password</label>
                <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
            </div>

            <button
                type="submit"
                disabled={updating}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: updating ? 'var(--text-muted)' : 'var(--primary)',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: updating ? 'not-allowed' : 'pointer'
                }}>
                {updating ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordConfirmPage() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
