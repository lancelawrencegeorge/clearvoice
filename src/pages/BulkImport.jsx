import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Upload, Download, AlertCircle, CheckCircle2, XCircle, Users, ChevronRight, Loader2 } from 'lucide-react';

const ROLES = ['user', 'manager', 'admin'];
const ALLOWED_ROLES = ['admin', 'super_user'];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line, idx) => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
}

function validateRow(row) {
  const errors = [];
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email');
  if (row.role && !ROLES.includes(row.role)) errors.push(`Role must be one of: ${ROLES.join(', ')}`);
  return errors;
}

const SAMPLE_CSV = `email,role,job_title
alice@acme.com,user,Customer Support Agent
bob@acme.com,manager,Team Lead
carol@acme.com,user,Support Specialist`;

export default function BulkImport() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [defaultRole, setDefaultRole] = useState('user');
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user && ALLOWED_ROLES.includes(user.role)) {
      base44.entities.Company.list().then(list => {
        // Super users are locked to their own company (by domain)
        if (user.role === 'super_user') {
          const mine = list.filter(c => c.domain === user.domain);
          setCompanies(mine);
          if (mine[0]) setSelectedCompany(mine[0].id);
        } else {
          setCompanies(list);
        }
      });
    }
  }, [user]);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <Link to="/" className="text-primary text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      const enriched = parsed.map(row => ({
        ...row,
        role: row.role || defaultRole,
        _errors: validateRow({ ...row, role: row.role || defaultRole }),
      }));
      setRows(enriched);
      setResults(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const validRows = rows.filter(r => r._errors.length === 0);
  const invalidRows = rows.filter(r => r._errors.length > 0);

  const handleImport = async () => {
    if (!validRows.length || !selectedCompany) return;
    setImporting(true);
    const company = companies.find(c => c.id === selectedCompany);

    try {
      const res = await base44.functions.invoke('bulkInviteUsers', {
        users: validRows.map(r => ({ email: r.email, role: r.role || defaultRole })),
        company_id: selectedCompany,
      });
      const data = res.data || res;
      setResults({
        succeeded: (data.succeeded || []).map(s => s.email),
        failed: data.failed || [],
      });
    } catch (err) {
      setResults({ succeeded: [], failed: validRows.map(r => ({ email: r.email, reason: err?.message || 'Request failed' })) });
    }
    setImporting(false);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clearvoice_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-3">Bulk Import Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload a CSV to invite multiple agents at once with assigned roles.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: config + upload */}
          <div className="lg:col-span-2 space-y-5">
            {/* Settings */}
            <Card className="p-5 bg-card/80 border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Import Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Company</label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={user?.role === 'super_user'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === 'super_user' ? 'Locked to your company' : 'Applied to all imported agents'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Default Role</label>
                  <Select value={defaultRole} onValueChange={setDefaultRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used when role column is empty</p>
                </div>
              </div>
            </Card>

            {/* Drop zone */}
            <Card
              className={`p-8 bg-card/80 border-2 border-dashed transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/40'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              <div className="text-center">
                <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-medium mb-1">Drop your CSV here or click to browse</p>
                <p className="text-sm text-muted-foreground">Required column: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">email</code> — Optional: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">role</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">job_title</code></p>
              </div>
            </Card>

            {/* Preview table */}
            {rows.length > 0 && !results && (
              <Card className="bg-card/80 border-border/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Preview <span className="text-muted-foreground font-normal">({rows.length} rows)</span></h2>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary">{validRows.length} valid</span>
                    {invalidRows.length > 0 && <span className="text-destructive">{invalidRows.length} errors</span>}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="text-left px-5 py-2.5 font-medium">Email</th>
                        <th className="text-left px-5 py-2.5 font-medium">Role</th>
                        <th className="text-left px-5 py-2.5 font-medium">Job Title</th>
                        <th className="text-left px-5 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={`border-b border-border/20 last:border-0 ${row._errors.length ? 'bg-destructive/5' : ''}`}>
                          <td className="px-5 py-2.5 font-mono text-xs">{row.email || <span className="text-destructive italic">missing</span>}</td>
                          <td className="px-5 py-2.5">
                            <Badge variant="outline" className="text-xs capitalize">{row.role || defaultRole}</Badge>
                          </td>
                          <td className="px-5 py-2.5 text-muted-foreground text-xs">{row.job_title || '—'}</td>
                          <td className="px-5 py-2.5">
                            {row._errors.length === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            ) : (
                              <span className="flex items-center gap-1 text-destructive text-xs">
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                {row._errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-border/40">
                  <Button
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="gap-2"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {importing ? 'Inviting...' : `Invite ${validRows.length} Agent${validRows.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </Card>
            )}

            {/* Results */}
            {results && (
              <Card className="bg-card/80 border-border/50 p-5 space-y-4">
                <h2 className="text-sm font-semibold">Import Complete</h2>
                {results.succeeded.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                      <CheckCircle2 className="w-4 h-4" /> {results.succeeded.length} invited successfully
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                      {results.succeeded.map(e => (
                        <p key={e} className="text-xs font-mono text-muted-foreground">{e}</p>
                      ))}
                    </div>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                      <XCircle className="w-4 h-4" /> {results.failed.length} failed
                    </div>
                    <div className="bg-destructive/5 rounded-lg p-3 space-y-1.5 max-h-40 overflow-y-auto">
                      {results.failed.map(f => (
                        <p key={f.email} className="text-xs font-mono text-destructive/80">{f.email} — {f.reason}</p>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" onClick={() => { setRows([]); setResults(null); }} className="gap-2">
                  <Upload className="w-4 h-4" /> Import Another File
                </Button>
              </Card>
            )}
          </div>

          {/* Right: instructions */}
          <div className="space-y-5">
            <Card className="p-5 bg-card/80 border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">CSV Format</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Required</p>
                  <code className="block bg-secondary rounded px-3 py-2 text-xs">email</code>
                </div>
                <div>
                  <p className="font-medium mb-1">Optional</p>
                  <div className="space-y-1">
                    <code className="block bg-secondary rounded px-3 py-1.5 text-xs">role <span className="text-muted-foreground">(user | manager | admin)</span></code>
                    <code className="block bg-secondary rounded px-3 py-1.5 text-xs">job_title</code>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 gap-2" onClick={downloadSample}>
                <Download className="w-3.5 h-3.5" /> Download Template
              </Button>
            </Card>

            <Card className="p-5 bg-card/80 border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Role Guide</h2>
              <div className="space-y-3">
                {[
                  { role: 'user', desc: 'Standard agent — can use the noise suppression tool only.' },
                  { role: 'manager', desc: 'Can view reports and analytics for their company.' },
                  { role: 'admin', desc: 'Full access including billing and user management.' },
                ].map(r => (
                  <div key={r.role}>
                    <Badge variant="outline" className="mb-1 capitalize">{r.role}</Badge>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}