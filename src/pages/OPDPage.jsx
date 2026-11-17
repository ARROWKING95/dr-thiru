import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import { DRUG_DATABASE } from '../data/drugs';
import { generateId } from '../lib/utils';
import {
  ClipboardList,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  User,
  Pill,
  Clock
} from 'lucide-react';

function emptyOpMedication() {
  return {
    id: generateId(),
    drug: '',
    dose: '',
    route: 'P/O',
    frequency: 'BD',
    duration: '5 days',
    instructions: 'After meals'
  };
}

export function OPDPage() {
  const [visits, setVisits] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    opNumber: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    age: '',
    gender: 'Male',
    complaints: '',
    bp: '',
    hr: '',
    temp: '98.6',
    spo2: '98'
  });
  const [medications, setMedications] = useState([emptyOpMedication()]);
  const [message, setMessage] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const loadVisits = () => {
    setVisits(storage.getOpdVisits());
  };

  useEffect(() => {
    loadVisits();
  }, []);

  // Check duplicate patient on name entry
  useEffect(() => {
    const trimmed = formData.name.trim().toLowerCase();
    if (trimmed.length > 2) {
      const existing = visits.find(v => v.patient_name.toLowerCase() === trimmed);
      if (existing) {
        setDuplicateWarning(`Patient "${existing.patient_name}" previously visited with OP #${existing.op_number}.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.name, visits]);

  const handleAddMed = () => {
    setMedications([...medications, emptyOpMedication()]);
  };

  const handleUpdateMed = (index, patch) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], ...patch };
    setMedications(updated);
  };

  const handleDeleteMed = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.opNumber.trim() || !formData.name.trim()) {
      setMessage({ type: 'error', text: 'OP Number and Patient Name are required.' });
      return;
    }

    const newVisit = {
      op_number: formData.opNumber.trim(),
      patient_name: formData.name.trim(),
      age: formData.age,
      gender: formData.gender,
      complaints: formData.complaints,
      vitals: {
        bp: formData.bp,
        hr: formData.hr,
        temp: formData.temp,
        spo2: formData.spo2
      },
      medications: medications.filter(m => m.drug.trim())
    };

    storage.saveOpdVisit(newVisit);
    setMessage({ type: 'success', text: `OP visit for ${newVisit.patient_name} recorded successfully.` });

    // Reset form
    setFormData({
      opNumber: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      age: '',
      gender: 'Male',
      complaints: '',
      bp: '',
      hr: '',
      temp: '98.6',
      spo2: '98'
    });
    setMedications([emptyOpMedication()]);
    loadVisits();
  };

  const filteredVisits = visits.filter(v =>
    `${v.patient_name} ${v.op_number} ${(v.complaints || '')}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <AppLayout
      title="Outpatient Department"
      subtitle="OP visits, prescriptions, dispensing & administration"
    >
      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Record New OP Visit */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            New Outpatient Consultation & Prescription
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="text-xs font-semibold">OP Number *</label>
                <Input
                  value={formData.opNumber}
                  onChange={e => setFormData({ ...formData, opNumber: e.target.value })}
                  placeholder="OP-1001"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Patient Name *</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Age</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Years"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {duplicateWarning && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {/* Vitals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/40">
              <div>
                <label className="text-[11px] text-muted-foreground">BP (mmHg)</label>
                <Input
                  placeholder="120/80"
                  value={formData.bp}
                  onChange={e => setFormData({ ...formData, bp: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Heart Rate (bpm)</label>
                <Input
                  placeholder="72"
                  value={formData.hr}
                  onChange={e => setFormData({ ...formData, hr: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Temp (°F)</label>
                <Input
                  placeholder="98.6"
                  value={formData.temp}
                  onChange={e => setFormData({ ...formData, temp: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">SpO2 (%)</label>
                <Input
                  placeholder="99"
                  value={formData.spo2}
                  onChange={e => setFormData({ ...formData, spo2: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Chief Complaints & Clinical Observations</label>
              <textarea
                rows={2}
                value={formData.complaints}
                onChange={e => setFormData({ ...formData, complaints: e.target.value })}
                placeholder="Presenting complaints, examination notes..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs"
              />
            </div>

            {/* Outpatient Medications */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-xs font-semibold block">Prescription Medications</label>
              {medications.map((med, idx) => (
                <div key={med.id} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <input
                      list={`opd-drug-${idx}`}
                      value={med.drug}
                      onChange={e => handleUpdateMed(idx, { drug: e.target.value })}
                      placeholder="Medication name"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                    <datalist id={`opd-drug-${idx}`}>
                      {DRUG_DATABASE.slice(0, 50).map(d => (
                        <option key={d.name} value={d.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <input
                      value={med.dose}
                      onChange={e => handleUpdateMed(idx, { dose: e.target.value })}
                      placeholder="Dose (e.g. 500mg)"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      value={med.frequency}
                      onChange={e => handleUpdateMed(idx, { frequency: e.target.value })}
                      placeholder="Freq (e.g. BD)"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      value={med.duration}
                      onChange={e => handleUpdateMed(idx, { duration: e.target.value })}
                      placeholder="Duration"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      value={med.instructions}
                      onChange={e => handleUpdateMed(idx, { instructions: e.target.value })}
                      placeholder="Instructions"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMed(idx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMed}
                className="gap-1.5 text-xs h-7"
              >
                <Plus className="h-3.5 w-3.5" /> Add Medication
              </Button>
            </div>

            <div className="pt-3 border-t border-border/40 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Save OP Visit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* OPD Visit History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-heading">Recent Outpatient Visits</h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search OP visits..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredVisits.map(visit => (
            <Card key={visit.id} className="border-border/70 hover:shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-1.5 font-heading">
                      <User className="h-4 w-4 text-primary" />
                      {visit.patient_name}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({visit.op_number})
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Age: {visit.age || '—'} · Gender: {visit.gender || '—'} · BP: {visit.vitals?.bp || '—'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(visit.created_at).toLocaleDateString()}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {visit.complaints || 'Routine outpatient consultation.'}
                </p>

                {visit.medications && visit.medications.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Prescribed Medications:
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Print Prescription
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {visit.medications.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted">
                          <Pill className="h-3 w-3 text-primary" />
                          {m.drug} {m.dose} ({m.frequency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
