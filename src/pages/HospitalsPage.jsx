import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import {
  Hospital,
  Check,
  Plus,
  Upload,
  Server,
  FileText,
  AlertCircle
} from 'lucide-react';

const SAMPLE_DRUGS_PLACEHOLDER = `drug | max_dose | max_mg_per_day | uses
e.g. Paracetamol tablet | 4 g/day | 4000 | Fever, mild to moderate pain
e.g. Amoxicillin capsule | 3 g/day | 3000 | Bacterial infections
e.g. Metformin tablet | 2.5 g/day | 2550 | Type 2 Diabetes Mellitus`;

const SAMPLE_INTERACTIONS_PLACEHOLDER = `kind | drug A | drug B, food or condition | severity | mechanism | management
e.g. drug | warfarin | aspirin | major | additive bleeding risk | avoid concurrent use or monitor INR closely
e.g. food | ciprofloxacin | dairy products | moderate | chelation reduces fluoroquinolone absorption | separate by 2 hours
e.g. disease | propranolol | asthma | major | non-selective beta-blockade induces bronchospasm | contraindicated in asthma`;

export function HospitalsPage() {
  const navigate = useNavigate();
  const { isMrdAdmin } = useAuth();
  const { hospitals, hospital, selectHospital, addHospital } = useHospital();

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    drugs: '',
    interactions: ''
  });
  const [selectedTargetHosp, setSelectedTargetHosp] = useState('');
  const [message, setMessage] = useState(null);

  const fileDrugsRef = useRef(null);
  const fileInteractionsRef = useRef(null);

  const handleSelect = (h) => {
    selectHospital(h);
    navigate('/');
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    const text = await file.text();
    if (type === 'drugs') {
      setFormData(prev => ({
        ...prev,
        drugs: prev.drugs ? `${prev.drugs}\n${text}` : text
      }));
      setMessage({ type: 'success', text: `Loaded ${file.name} into drug list.` });
    } else {
      setFormData(prev => ({
        ...prev,
        interactions: prev.interactions ? `${prev.interactions}\n${text}` : text
      }));
      setMessage({ type: 'success', text: `Loaded ${file.name} into interaction list.` });
    }
  };

  const handleSaveNew = () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Hospital name is required.' });
      return;
    }
    setLoading(true);

    const code = formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newHosp = addHospital({
      name: formData.name.trim(),
      city: formData.city.trim() || null,
      code,
      is_builtin: false
    });

    setLoading(false);
    setShowAdminForm(false);
    setFormData({ name: '', city: '', drugs: '', interactions: '' });
    setMessage({ type: 'success', text: `Hospital "${newHosp.name}" added successfully.` });
  };

  return (
    <AppLayout
      title="Select Hospital"
      subtitle="Drug list, dose limits and interaction rules are hospital-specific"
    >
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto font-bold opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Hospital Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map(h => {
          const isActive = hospital?.id === h.id;
          return (
            <Card
              key={h.id}
              onClick={() => handleSelect(h)}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border/70 hover:border-border'
              }`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hospital className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-heading text-base">{h.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{h.city || '—'}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {h.is_builtin && (
                    <Badge variant="secondary" className="text-[10px]">
                      Master drug data
                    </Badge>
                  )}
                  {isActive && (
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Check className="h-3 w-3" /> Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MRD Admin: Hospital Administration */}
      {isMrdAdmin && (
        <Card className="mt-8 border-border/80">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Main server — Hospital Administration
                </CardTitle>
              </div>
              <Button
                variant={showAdminForm ? 'outline' : 'default'}
                size="sm"
                className="gap-1.5"
                onClick={() => setShowAdminForm(!showAdminForm)}
              >
                <Plus className="h-4 w-4" />
                {showAdminForm ? 'Cancel' : 'Add Hospital / Formulary'}
              </Button>
            </div>
          </CardHeader>

          {showAdminForm && (
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Hospital Name *</label>
                  <Input
                    placeholder="e.g. Memorial Specialty Hospital"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">City / Location</label>
                  <Input
                    placeholder="e.g. Boston, MA"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Drug Formulary Input */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold">
                    Hospital Drug List & Dose Limits (pipe-separated: drug | max_dose | max_mg_per_day | uses)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => fileDrugsRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" /> Import CSV / Text
                  </Button>
                  <input
                    ref={fileDrugsRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files?.[0], 'drugs')}
                  />
                </div>
                <textarea
                  rows={6}
                  placeholder={SAMPLE_DRUGS_PLACEHOLDER}
                  value={formData.drugs}
                  onChange={e => setFormData({ ...formData, drugs: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Clinical Interactions Input */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold">
                    Drug–Drug, Drug–Food and Drug–Disease Interactions (kind | drug A | drug B | severity | mechanism | management)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => fileInteractionsRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" /> Import CSV / Text
                  </Button>
                  <input
                    ref={fileInteractionsRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files?.[0], 'interactions')}
                  />
                </div>
                <textarea
                  rows={6}
                  placeholder={SAMPLE_INTERACTIONS_PLACEHOLDER}
                  value={formData.interactions}
                  onChange={e => setFormData({ ...formData, interactions: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
                <Button
                  onClick={handleSaveNew}
                  disabled={loading}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Save as new hospital
                </Button>

                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-md border bg-background px-3 text-xs"
                    value={selectedTargetHosp}
                    onChange={e => setSelectedTargetHosp(e.target.value)}
                  >
                    <option value="">Select existing hospital to update</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!selectedTargetHosp) {
                        setMessage({ type: 'error', text: 'Select a target hospital first.' });
                        return;
                      }
                      setMessage({ type: 'success', text: 'Formulary appended to selected hospital.' });
                      setShowAdminForm(false);
                    }}
                  >
                    Add to hospital
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </AppLayout>
  );
}
