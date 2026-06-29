import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Pencil, Trash2, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCurrentAgent } from '@/lib/customAuth';

const ROLE_LABELS = { super_user: 'Super User', agent: 'Agent' };
const roleLabel = (role) => ROLE_LABELS[role] || role;

export default function UserManagement() {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'agent', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCurrentAgent();
    if (!cached) {
      setAuthChecking(false);
      return;
    }
    setCurrentAgent(cached);
    base44.entities.Agent.get(cached.id)
      .then((fresh) => setCurrentAgent(fresh))
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(null);
    base44.entities.Agent.list('-created_date', 500)
      .then(a => {
        const scoped = (currentAgent?.role === 'admin' || !currentAgent?.tenant_domain)
          ? a
          : a.filter(x => x.tenant_domain === currentAgent.tenant_domain);
        setAgents(scoped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Agent data load failed:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      });
  };

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if ((currentAgent?.role === 'super_user' || currentAgent?.role === 'admin') && !dataLoaded) {
      setDataLoaded(true);
      loadData();
    }
  }, [currentAgent, dataLoaded]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAgent || (currentAgent.role !== 'super_user' && currentAgent.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">You need Super User access to manage users.</p>
          <Link to="/dashboard" className="text-primary text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openEdit = (a) => {
    setEditing(a);
    setEditForm({ role: a.role || 'agent', status: a.status || 'Active' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Agent.update(editing.id, {
        role: editForm.role,
        status: editForm.status,
      });
      setAgents(prev => prev.map(a => a.id === editing.id ? { ...a, ...editForm } : a));
      setEditing(null);
    } catch (e) {
      alert('Failed to save: ' + (e?.message || 'unknown error'));
    }
    setSaving(false);
  };

  const handleDelete = async (a) => {
    if (!confirm(`Remove ${a.email}? This will revoke their access.`)) return;
    setDeletingId(a.id);
    try {
      await base44.entities.Agent.delete(a.id);
      setAgents(prev => prev.filter(x => x.id !== a.id));
    } catch (e) {
      alert('Failed to remove user: ' + (e?.message || 'unknown error'));
    }
    setDeletingId(null);
  };

  const roleColors = {
    super_user: 'bg-primary/10 text-primary border-primary/20',
    agent: 'bg-secondary text-muted-foreground border-border',
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-3">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage agents in your tenant</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-card/80 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Total Agents</p><p className="text-xl font-bold">{agents.length}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{agents.filter(a => a.status !== 'Suspended').length}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80 border-border/50 sm:col-span-1 col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Mail className="w-4 h-4 text-muted-foreground" /></div>
              <div><p className="text-xs text-muted-foreground">Super Users</p><p className="text-xl font-bold">{agents.filter(a => a.role === 'super_user').length}</p></div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="super_user">Super User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card/80 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Agent</th>
                  <th className="text-left px-5 py-3 font-medium">Tenant</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-border/20 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{a.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{a.email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{a.tenant_domain || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-xs ${roleColors[a.role] || roleColors.agent}`}>{roleLabel(a.role)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {a.status === 'Suspended' ? (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Active</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {a.role !== 'super_user' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(a)}
                            disabled={deletingId === a.id}
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
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No agents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
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
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="super_user">Super User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Account Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
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