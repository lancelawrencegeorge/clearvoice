import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Building2, CheckCircle2, Plus, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentAgent, getTenantDomain } from '@/lib/customAuth';

const ALLOWED_ROLES = ['admin', 'super_user'];

export default function InviteAgent() {
  const navigate = useNavigate();
  const currentAgent = getCurrentAgent();
  const [companies, setCompanies] = useState([]);
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [inviteRole, setInviteRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentAgent?.role === 'admin';
  const isSuperUser = currentAgent?.role === 'super_user';

  useEffect(() => {
    if (!currentAgent || !ALLOWED_ROLES.includes(currentAgent.role)) return;
    const domain = currentAgent.tenant_domain || getTenantDomain(currentAgent.email);
    base44.entities.Company.list().then(list => {
      if (currentAgent.role === 'super_user') {
        const mine = list.filter(c => c.domain === domain || c.name === currentAgent.company);
        setCompanies(mine);
        if (mine[0]) setCompanyId(mine[0].id);
      } else {
        setCompanies(list);
      }
    }).catch(() => {});
  }, [currentAgent?.id, currentAgent?.role]);

  if (!currentAgent || !ALLOWED_ROLES.includes(currentAgent.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your session appears to have stale credentials. Refresh your session to continue.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { localStorage.clear(); navigate('/login'); }} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Re-login
            </Button>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    const company = await base44.entities.Company.create({ name: newCompanyName.trim(), plan: 'trial', is_active: true });
    setCompanies(prev => [...prev, company]);
    setCompanyId(company.id);
    setNewCompanyName('');
    setShowNewCompany(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !companyId) { setError('Please fill in all fields.'); return; }
    // Domain guard for super_user
    if (currentAgent.role === 'super_user') {
      const company = companies.find(c => c.id === companyId);
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (company?.domain && emailDomain !== company.domain) {
        setError(`Email must be from the @${company.domain} domain.`);
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bulkInviteUsers', {
        users: [{ email, role: inviteRole }],
        company_id: companyId,
        agent_id: currentAgent.id,
      });
      if (res?.data?.failed?.length > 0) {
        setError(res.data.failed[0].reason || 'Failed to send invite');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err?.message || 'Failed to send invite');
    }
    setLoading(false);
  };

  const selectedCompany = companies.find(c => c.id === companyId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold mt-4">Invite Agent</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? 'Invite a new tenant super user or add agents to an existing company.'
              : 'Send an invite and assign the agent to your company.'}
          </p>
        </div>

        {success ? (
          <Card className="p-8 text-center bg-card/80 border-border/50">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Agent Ready!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The agent's account is created and assigned to <strong>{selectedCompany?.name}</strong>. They can sign in now at the login page using their email — no password needed.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSuccess(false)}>Invite Another</Button>
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-card/80 border-border/50">
            <form onSubmit={handleInvite} className="space-y-5">
              <div className="space-y-2">
                <Label>Agent Email</Label>
                <Input
                  type="email"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <p className="text-xs text-muted-foreground mb-2">Choose <strong>Super User</strong> to create a new tenant who can manage their own company. Choose <strong>Agent</strong> to add to an existing company.</p>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Agent</SelectItem>
                      <SelectItem value="super_user">Super User (Tenant Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Assign to Company</Label>
                {!showNewCompany ? (
                  <div className="flex gap-2">
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a company..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentAgent.role === 'admin' && (
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCompany(true)} title="Add new company">
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New company name..."
                      value={newCompanyName}
                      onChange={e => setNewCompanyName(e.target.value)}
                    />
                    <Button type="button" onClick={handleCreateCompany} disabled={!newCompanyName.trim()}>Create</Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewCompany(false)}>Cancel</Button>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <UserPlus className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}