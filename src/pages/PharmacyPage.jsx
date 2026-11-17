import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import {
  Pill,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export function PharmacyPage() {
  const { profile } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [patientRef, setPatientRef] = useState('');
  const [setting, setSetting] = useState('all'); // 'all' | 'ipd' | 'opd'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'dispensed'
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensedItems, setDispensedItems] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState(null);

  // Search prescriptions across IPD cases and OPD visits
  const handleSearch = () => {
    setHasSearched(true);
    const results = [];

    const normName = patientName.trim().toLowerCase();
    const normRef = patientRef.trim().toLowerCase();

    // 1. Check IPD cases
    if (setting === 'all' || setting === 'ipd') {
      const cases = storage.getCases();
      cases.forEach(c => {
        const matchesName = !normName || c.patientName.toLowerCase().includes(normName);
        const matchesRef = !normRef || c.patientId.toLowerCase().includes(normRef);

        if (matchesName && matchesRef) {
          (c.drugChart || []).forEach(d => {
            if (d.genericName || d.brandName) {
              results.push({
                id: d.id,
                source_type: 'ipd',
                source_id: c.patientId,
                patient_name: c.patientName,
                patient_ref: c.patientId,
                drug: d.genericName || d.brandName,
                dose: `${d.dose} mg`,
                route: d.route,
                frequency: d.frequency,
                duration: 'Admitted course',
                instructions: d.indication ? `For: ${d.indication}` : 'As directed on drug chart'
              });
            }
          });
        }
      });
    }

    // 2. Check OPD visits
    if (setting === 'all' || setting === 'opd') {
      const visits = storage.getOpdVisits();
      visits.forEach(v => {
        const matchesName = !normName || v.patient_name.toLowerCase().includes(normName);
        const matchesRef = !normRef || v.op_number.toLowerCase().includes(normRef);

        if (matchesName && matchesRef) {
          (v.medications || []).forEach(m => {
            if (m.drug) {
              results.push({
                id: m.id,
                source_type: 'opd',
                source_id: v.op_number,
                patient_name: v.patient_name,
                patient_ref: v.op_number,
                drug: m.drug,
                dose: m.dose,
                route: m.route,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions
              });
            }
          });
        }
      });
    }

    setPrescriptions(results);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleDispense = (item) => {
    setDispensedItems(prev => ({
      ...prev,
      [item.id]: {
        dispensed: true,
        at: new Date().toLocaleTimeString(),
        by: profile?.first_name ? `Dr. ${profile.first_name}` : 'Pharmacist'
      }
    }));
    storage.recordDispense({
      source_type: item.source_type,
      source_id: item.source_id,
      medication_id: item.id,
      patient_name: item.patient_name,
      patient_ref: item.patient_ref,
      drug: item.drug,
      dose: item.dose
    });
    setMessage({ type: 'success', text: `${item.drug} verified and marked as dispensed.` });
  };

  const handleDispenseAll = () => {
    const pending = filteredPrescriptions.filter(p => !dispensedItems[p.id]?.dispensed);
    pending.forEach(item => handleDispense(item));
    setMessage({ type: 'success', text: `Batch dispensed ${pending.length} pending medication order(s).` });
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const isDispensed = dispensedItems[p.id]?.dispensed;
    if (statusFilter === 'pending') return !isDispensed;
    if (statusFilter === 'dispensed') return isDispensed;
    return true;
  });

  return (
    <AppLayout
      title="Pharmacy"
      subtitle="Prescription Validation & Dispensing Queue"
    >
      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Prescription Lookup Filter */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Prescriptions for Dispensing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-4 items-end">
            <div>
              <label className="text-xs font-semibold">Patient Name</label>
              <Input
                placeholder="Search patient name..."
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">IP / OP Number</label>
              <Input
                placeholder="e.g. IPD-8821 or OP-4091"
                value={patientRef}
                onChange={e => setPatientRef(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Care Setting</label>
              <select
                value={setting}
                onChange={e => setSetting(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Prescriptions</option>
                <option value="ipd">Inpatient (IPD) Inpatient Charts</option>
                <option value="opd">Outpatient (OPD) Consultations</option>
              </select>
            </div>
            <div>
              <Button onClick={handleSearch} className="w-full gap-2">
                <Search className="h-4 w-4" /> Search Orders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispensing Queue */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold font-heading flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Active Prescriptions Queue ({filteredPrescriptions.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                All ({prescriptions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'pending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('dispensed')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === 'dispensed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Dispensed
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDispenseAll}
              className="text-xs h-8 gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5 text-success" /> Dispense All
            </Button>
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-xs text-muted-foreground">
              No pending prescriptions matching your query. Search by name or reference number above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPrescriptions.map((item, idx) => {
              const isDispensed = dispensedItems[item.id]?.dispensed;
              return (
                <Card
                  key={item.id || idx}
                  className={`border transition-all ${
                    isDispensed ? 'bg-success/5 border-success/30' : 'border-border/70 hover:shadow-sm'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {item.source_type} · {item.source_id}
                        </span>
                        <h4 className="font-semibold text-sm font-heading mt-1 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          {item.patient_name}
                        </h4>
                      </div>

                      {isDispensed ? (
                        <Badge variant="success" className="text-[10px] gap-1">
                          <CheckCircle className="h-3 w-3" /> Dispensed
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> Ready to Dispense
                        </Badge>
                      )}
                    </div>

                    <div className="p-2.5 rounded bg-card border border-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-primary">{item.drug}</span>
                        <span className="font-mono text-xs font-semibold">{item.dose}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Route: <span className="text-foreground">{item.route}</span> · Frequency: <span className="text-foreground">{item.frequency}</span> · Duration: {item.duration || 'As directed'}
                      </p>
                      {item.instructions && (
                        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40">
                          Note: {item.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {isDispensed ? `Dispensed by ${dispensedItems[item.id]?.by} at ${dispensedItems[item.id]?.at}` : 'Verify dose & label'}
                      </span>

                      {!isDispensed ? (
                        <Button
                          size="sm"
                          onClick={() => handleDispense(item)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Dispense
                        </Button>
                      ) : (
                        <span className="text-xs text-success font-medium flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
