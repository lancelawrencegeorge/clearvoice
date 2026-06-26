import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Pencil, Trash2, UserPlus, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ALLOWED_ROLES = ['admin', 'super_user'];
const EDITABLE_ROLES = ['user', 'manager', 'super_user'];
const ROLE_LABELS = { admin: 'Super User', super_user: 'Company Admin', manager: 'Manager', user: 'User' };
const roleLabel = (role) => ROLE_LABELS[role] || role;

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'user', job_title: '', phone: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
    );
    Promise.race([
      Promise.all([
        base44.entities.User.list(),
        base44.entities.Company.list(),
      ]),
      timeout,
    ]).then(([u, c]) => {
      setUsers(u);
      setCompanies(c);
      setLoading(false);
    }).catch(err => {
      console.error('User data load failed:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">You need Super User or Company Admin access to manage users.</p>
          <Link to="/" className="text-primary text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const companyName = (id) => companies.find(c => c.id === id)?.name || 'Unassigned';
  const isAdmin = user.role === 'admin';

  // Super users only see their own domain's users
  const scopedUsers = isAdmin
    ? users
    : users.filter(u => u.domain === user.domain);

  const filtered = scopedUsers.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.job_title || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({ role: u.role, job_title: u.job_title || '', phone: u.phone || '', is_active: u.is_active !== false });
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(editing.id, {
      role: editForm.role,
      job_title: editForm.job_title,
      phone: editForm.phone,
      is_active: editForm.is_active,
    });
    setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...editForm } : u));
    setEditing(null);
    setSaving(false);
  };

  const handleDelete = async (u) => {
    if (!confirm(`Remove ${u.email}? This will revoke their access.`)) return;
    setDeletingId(u.id);
    try {
      await base44.entities.User.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      alert('Failed to remove user: ' + (e?.message || 'unknown error'));
    }
    setDeletingId(null);
  };

  const roleColors = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    super_user: 'bg-primary/10 text-primary border-primary/20',
    manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    user: 'bg-secondary text-muted-foreground border-border',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Failed to Load Users</h2>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button onClick={loadData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-3">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? 'Manage all users across tenants' : `Managing users in your company (${user.domain})`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/bulk-import">
              <Button variant="outline" className="gap-2"><Users className="w-4 h-4" /> Bulk Import</Button>
            </Link>
            <Link to="/invite">
              <Button className="gap-2"><UserPlus className="w-4 h-4" /> Invite User</Button>
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-card/80 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Total Users</p><p className="text-xl font-bold">{scopedUsers.length}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Active Seats</p><p className="text-xl font-bold">{scopedUsers.filter(u => u.is_active !== false).length}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 border-border/50 sm:col-span-1 col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Mail className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Onboarded</p><p className="text-xl font-bold">{scopedUsers.filter(u => u.onboarding_complete).length}</p></div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, or title..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="super_user">Company Admin</SelectItem>
                                  {isAdmin && <SelectItem value="admin">Super User</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card/80 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Company</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/20 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                      {u.job_title && <p className="text-xs text-muted-foreground mt-0.5">{u.job_title}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{companyName(u.company_id)}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-xs ${roleColors[u.role] || roleColors.user}`}>{roleLabel(u.role)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_active === false ? (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">Inactive</Badge>
                      ) : u.onboarding_complete ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {u.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-sm font-medium">{editing.full_name || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground font-mono">{editing.email}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDITABLE_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input value={editForm.job_title} onChange={e => setEditForm(p => ({ ...p, job_title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Seat Status</Label>
                <Select value={editForm.is_active ? 'active' : 'inactive'} onValueChange={v => setEditForm(p => ({ ...p, is_active: v === 'active' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive (revoked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}