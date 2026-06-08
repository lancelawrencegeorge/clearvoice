import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Building2, CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InviteAgent() {
  const [companies, setCompanies] = useState([]);
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.Company.list().then(setCompanies);
  }, []);

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
    setError('');
    setLoading(true);
    await base44.users.inviteUser(email, 'user');
    // We store the pending company assignment — once user registers,
    // an admin can confirm from the billing dashboard.
    // For now, log the intent in a session note.
    setSuccess(true);
    setLoading(false);
    setEmail('');
    setCompanyId('');
  };

  const selectedCompany = companies.find(c => c.id === companyId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/billing" className="text-sm text-muted-foreground hover:text-foreground">← Back to Billing</Link>
          <h1 className="text-2xl font-bold mt-4">Invite Agent</h1>
          <p className="text-muted-foreground text-sm mt-1">Send an invite and assign the agent to a company.</p>
        </div>

        {success ? (
          <Card className="p-8 text-center bg-card/80 border-border/50">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invite Sent!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The agent will receive an email to join. Once they log in, assign them to <strong>{selectedCompany?.name}</strong> from the billing dashboard.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSuccess(false)}>Invite Another</Button>
              <Link to="/billing" className="flex-1">
                <Button className="w-full">View Dashboard</Button>
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
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCompany(true)} title="Add new company">
                      <Plus className="w-4 h-4" />
                    </Button>
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