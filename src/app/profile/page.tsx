'use client';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const [profile, setProfile] = useState({ title: '', bio: '', location: '', skills: [] as string[] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [exists, setExists] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [user, setUser] = useState<any>(null);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    setProfile({
                        title: data.profile.title || '',
                        bio: data.profile.bio || '',
                        location: data.profile.location || '',
                        skills: Array.isArray(data.profile.skills) ? data.profile.skills : []
                    });
                    setExists(true);
                } else {
                    setExists(false);
                }

                if (data.user) {
                    setUser(data.user);
                    // localStorage usage removed
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const formattedProfile = {
                ...profile,
                skills: profile.skills.filter(s => s !== '')
            };
            const res = await fetch('/api/profile', {
                method: 'POST',
                body: JSON.stringify(formattedProfile),
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                setMessage(exists ? 'Profile updated successfully!' : 'Profile created successfully!');
                setExists(true);
                setIsEditing(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete your profile?')) return;
        try {
            const res = await fetch('/api/profile', { method: 'DELETE' });
            if (res.ok) {
                setExists(false);
                setProfile({ title: '', bio: '', location: '', skills: [] });
                setMessage('Profile deleted successfully');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete profile');
        }
    };

    if (loading) return <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading...</div>;

    return (
        <div className="container animate-fade">
            <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                        {exists ? (isEditing ? 'Edit Profile' : 'Your Profile') : 'Create Your Profile'}
                    </h2>
                    {exists && !isEditing && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsEditing(true)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white' }}>Edit</button>
                            <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--danger)', color: 'white' }}>Delete</button>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Logged in as</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                        </div>
                        <span style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: user?.role === 'admin' ? 'var(--primary)' : 'var(--glass)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {user?.role}
                        </span>
                    </div>
                </div>

                {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--success)' }}>{message}</div>}
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>{error}</div>}

                {(!exists || isEditing) ? (
                    <form onSubmit={handleSave} style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Professional Title</label>
                                <input
                                    value={profile.title}
                                    onChange={e => setProfile({ ...profile, title: e.target.value })}
                                    placeholder="e.g. Full Stack Developer"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Location</label>
                                <input
                                    value={profile.location}
                                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                                    placeholder="e.g. San Francisco, CA"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', minHeight: '120px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Skills</label>
                            <input
                                value={profile.skills.join(', ')}
                                onChange={e => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                                placeholder="React, Next.js, Node.js"
                                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" disabled={saving} style={{ padding: '1rem 2rem', borderRadius: '0.75rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
                                {saving ? 'Saving...' : (exists ? 'Update Profile' : 'Create Profile')}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '1rem 2rem', borderRadius: '0.75rem', background: 'var(--glass)', color: 'white' }}>Cancel</button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Title</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{profile.title || 'Not specified'}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Location</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{profile.location || 'Not specified'}</p>
                            </div>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bio</p>
                            <p style={{ fontSize: '1.1rem' }}>{profile.bio || 'No bio provided yet.'}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Skills</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {profile.skills.length > 0 ? profile.skills.map((skill, i) => (
                                    <span key={i} style={{ background: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem' }}>{skill}</span>
                                )) : <p>No skills listed.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
