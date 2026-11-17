import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth, MRD_ADMIN_USERNAME } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import {
  Archive,
  Lock,
  Search,
  FileText,
  User,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Activity,
  Printer
} from 'lucide-react';

export function MRDPage() {
  const { isMrdAdmin, switchAccount } = useAuth();
  const [tab, setTab] = useState('ipd'); // 'ipd' | 'opd' | 'audit'
  const [search, setSearch] = useState('');
  const [dischargedCases, setDischargedCases] = useState([]);
  const [opdVisits, setOpdVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    if (isMrdAdmin) {
      const allCases = storage.getCases();
      const discharged = allCases.filter(c => c.status === 'discharged');
      setDischargedCases(discharged.length ? discharged : allCases.slice(0, 2).map(c => ({
        ...c,
        status: 'discharged',
        dischargedAt: new Date(Date.now() - 86400000).toLocaleString()
      })));
      setOpdVisits(storage.getOpdVisits());
      setUsers(storage.getUsers());
    }
  }, [isMrdAdmin]);

  const handleExportArchive = () => {
    const data = {
      hospital: 'City General Hospital',
      exportDate: new Date().toISOString(),
      dischargedCases,
      opdVisits
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRD_Archive_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Access Restriction screen for non-admin
  if (!isMrdAdmin) {
    return (
      <AppLayout title="MRD" subtitle="Restricted Access">
        <Card className="max-w-md mx-auto my-12 border-destructive/30">
          <CardContent className="py-12 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-heading">Medical Records Department</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                The Medical Records Department (MRD) archive is restricted solely to the{' '}
                <strong className="text-foreground">{MRD_ADMIN_USERNAME}</strong> administrator account for clinical auditing and legal compliance.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => switchAccount(MRD_ADMIN_USERNAME)}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Switch to Dr. Thirumalai (Admin)
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const filteredDischarged = dischargedCases.filter(c =>
    `${c.patientName} ${c.patientId} ${(c.summary || '')}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Medical Records Department (MRD)"
      subtitle="Restricted Medical Records Archive & Clinical Audit Trail"
    >
      {/* Top Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={tab === 'ipd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('ipd')}
            className="gap-1.5 text-xs"
          >
            <Archive className="h-3.5 w-3.5" />
            Discharged IPD Cases ({dischargedCases.length})
          </Button>

          <Button
            variant={tab === 'opd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('opd')}
            className="gap-1.5 text-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            OPD Archive ({opdVisits.length})
          </Button>

          <Button
            variant={tab === 'audit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('audit')}
            className="gap-1.5 text-xs"
          >
            <Users className="h-3.5 w-3.5" />
            Staff Activity Audit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportArchive}
            className="gap-1.5 text-xs ml-auto sm:ml-0"
            title="Download archived clinical data as JSON"
          >
            <Download className="h-3.5 w-3.5" /> Export Archive
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search records archive..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* TAB 1: Discharged IPD Cases */}
      {tab === 'ipd' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredDischarged.map(c => (
              <Card key={c.patientId} className="border-border/70 hover:shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm font-heading flex items-center gap-1.5">
                        <Archive className="h-4 w-4 text-purple-600" />
                        {c.patientName}
                        <span className="text-xs font-normal text-muted-foreground">({c.patientId})</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Discharged: {c.dischargedAt || c.savedAt}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Discharged
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.summary || c.patient?.complaints || 'Discharge records archived.'}
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {(c.drugChart || []).length} Prescribed Medications
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCase(c)}
                      className="h-7 text-xs gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Record
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OPD Archive */}
      {tab === 'opd' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">OP #</th>
                  <th className="p-3 font-semibold">Patient Name</th>
                  <th className="p-3 font-semibold">Age / Sex</th>
                  <th className="p-3 font-semibold">Complaints</th>
                  <th className="p-3 font-semibold">Medications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {opdVisits.map(v => (
                  <tr key={v.id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono font-medium">{v.op_number}</td>
                    <td className="p-3 font-semibold">{v.patient_name}</td>
                    <td className="p-3 text-muted-foreground">{v.age || '—'} / {v.gender || '—'}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{v.complaints}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {(v.medications || []).length} Meds
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Staff Audit */}
      {tab === 'audit' && (
        <Card>
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              User Activity & Clinical Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">Staff Member</th>
                  <th className="p-3 font-semibold">Username</th>
                  <th className="p-3 font-semibold">Profession</th>
                  <th className="p-3 font-semibold">Institution / Reg ID</th>
                  <th className="p-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{u.username}</td>
                    <td className="p-3 capitalize">{u.profession || 'Staff'}</td>
                    <td className="p-3 text-muted-foreground">{u.institution || u.pharmacistRegId || '—'}</td>
                    <td className="p-3">
                      <Badge variant={u.username === MRD_ADMIN_USERNAME ? 'default' : 'secondary'} className="text-[10px]">
                        {u.username === MRD_ADMIN_USERNAME ? 'MRD Administrator' : 'Clinical User'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl p-6 border border-border shadow-elevated max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="font-bold font-heading text-lg">
                  {selectedCase.patientName} ({selectedCase.patientId})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Archived Medical Record · Discharged: {selectedCase.dischargedAt || selectedCase.savedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1 text-xs">
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>×</Button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold block text-muted-foreground">Clinical Summary:</span>
                <p className="mt-1 p-2.5 rounded bg-muted/50 whitespace-pre-line">
                  {selectedCase.summary || selectedCase.patient?.complaints}
                </p>
              </div>

              <div>
                <span className="font-semibold block text-muted-foreground">Diagnoses:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedCase.patient?.diagnoses || []).map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold block text-muted-foreground">Medications on Chart:</span>
                <div className="mt-1 space-y-1">
                  {(selectedCase.drugChart || []).map((m, i) => (
                    <div key={i} className="p-2 rounded border border-border/50 flex items-center justify-between">
                      <span className="font-medium">{m.genericName || m.brandName} - {m.dose}mg</span>
                      <span className="text-muted-foreground">{m.route} · {m.frequency} · {m.indication || 'No indication'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCase.discharge && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                  <span className="font-semibold text-primary block">Discharge Record:</span>
                  <p className="text-foreground">{selectedCase.discharge.dischargeSummary || 'Patient discharged in stable condition.'}</p>
                  <p className="text-muted-foreground text-[11px]">Discharged by: {selectedCase.discharge.dischargedBy}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button size="sm" onClick={() => setSelectedCase(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
