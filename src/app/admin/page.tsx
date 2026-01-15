'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');

            // Check for redirect or unauth before parsing JSON
            if (res.status === 401 || res.status === 403) {
                console.warn('Unauthorized access to admin panel.');
                router.push('/login');
                return;
            }

            // Ensure response is JSON
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Received non-JSON response from API:', await res.text());
                setUsers([]);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                console.error('Failed to fetch users:', data);
                setUsers([]);
                return;
            }

            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error('API returned non-array data:', data);
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                fetchUsers();
            }
        };
        checkAuth();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchUsers();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`/api/admin/users?id=${editingUser._id}`, {
            method: 'PUT',
            body: JSON.stringify(editingUser),
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
            setEditingUser(null);
            fetchUsers();
        }
    };

    if (loading) return <div className="container">Loading users...</div>;

    return (
        <div className="container animate-fade">
            <h2 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Admin Dashboard</h2>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ background: 'var(--glass)', textAlign: 'left' }}>
                            <th style={{ padding: '1.2rem' }}>Name</th>
                            <th style={{ padding: '1.2rem' }}>Email</th>
                            <th style={{ padding: '1.2rem' }}>Role</th>
                            <th style={{ padding: '1.2rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1.2rem' }}>{user.name}</td>
                                <td style={{ padding: '1.2rem' }}>{user.email}</td>
                                <td style={{ padding: '1.2rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: user.role === 'admin' ? 'var(--primary)' : 'var(--glass)', fontSize: '0.8rem' }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <button onClick={() => setEditingUser(user)} style={{ marginRight: '0.5rem', color: 'var(--primary)' }}>Edit</button>
                                    <button onClick={() => handleDelete(user._id)} style={{ color: 'var(--danger)' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
                    <form onSubmit={handleUpdate} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit User & Profile</h3>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Name</label>
                                <input
                                    value={editingUser.name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Role</label>
                                <select
                                    value={editingUser.role || 'user'}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem' }}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.5rem 0' }} />
                            <h4 style={{ color: 'var(--primary)' }}>Profile Data</h4>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Professional Title</label>
                                <input
                                    value={editingUser.profile?.title || ''}
                                    onChange={e => setEditingUser({ ...editingUser, profile: { ...editingUser.profile, title: e.target.value } })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Location</label>
                                <input
                                    value={editingUser.profile?.location || ''}
                                    onChange={e => setEditingUser({ ...editingUser, profile: { ...editingUser.profile, location: e.target.value } })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Bio</label>
                                <textarea
                                    value={editingUser.profile?.bio || ''}
                                    onChange={e => setEditingUser({ ...editingUser, profile: { ...editingUser.profile, bio: e.target.value } })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem', minHeight: '80px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Skills (comma separated)</label>
                                <input
                                    value={Array.isArray(editingUser.profile?.skills) ? editingUser.profile.skills.join(', ') : (editingUser.profile?.skills || '')}
                                    onChange={e => setEditingUser({ ...editingUser, profile: { ...editingUser.profile, skills: e.target.value.split(',').map((s: string) => s.trim()) } })}
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '0.4rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '0.5rem', fontWeight: 'bold' }}>Save Changes</button>
                            <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '0.8rem', background: 'var(--glass)', color: 'white', borderRadius: '0.5rem' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
