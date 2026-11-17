import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge, Switch } from '../components/ui/input';
import { storage } from '../services/storage';
import { runErrorDetection, calculateDailyDose } from '../services/errorDetection';
import { suggestDiagnoses, getIcdCode } from '../services/diagnosisHelper';
import { DRUG_DATABASE } from '../data/drugs.js';
import { RISK_SCALES } from '../data/riskScales.js';
import { generateId } from '../lib/utils';
import {
  Bed,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Save,
  LogOut,
  Trash2,
  Printer,
  ChevronLeft,
  Activity,
  Heart,
  Pill,
  UserCheck,
  Stethoscope,
  Info,
  ShieldAlert,
  Sparkles,
  FileText,
  Scissors,
  HelpCircle,
  Sliders,
  Check,
  X
} from 'lucide-react';

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Injection', 'Syrup', 'Suspension', 'Inhalation', 'Ointment', 'Drops'];
const ROUTES = ['P/O', 'IV', 'IM', 'SC', 'ID', 'Topical', 'Inhalation', 'SL', 'PR'];
const FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'STAT', 'HS', 'Q4H', 'Q6H', 'Q8H', 'Q12H'];
const PROCEDURE_TYPES = ['Diagnostic', 'Surgical', 'Interventional', 'Bedside', 'Endoscopy', 'Imaging'];

function emptyDrugRow() {
  return {
    id: generateId(),
    brandName: '',
    genericName: '',
    dose: '',
    dosageForm: 'Tablet',
    route: 'P/O',
    frequency: 'OD',
    days: { 1: 'none', 2: 'none', 3: 'none', 4: 'none' },
    indication: ''
  };
}

function emptyProcedure() {
  return {
    id: generateId(),
    type: 'Diagnostic',
    name: '',
    indication: '',
    outcome: '',
    notes: ''
  };
}

function emptyManualError() {
  return {
    id: generateId(),
    title: '',
    category: 'Prescribing',
    severity: 'major',
    description: '',
    intervention: '',
    status: 'Open'
  };
}

export function IPDPage() {
  const { profile } = useAuth();
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCase, setActiveCase] = useState(null);

  const loadCases = () => {
    const list = storage.getCases().filter(c => c.status !== 'discharged');
    setCases(list);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleStartNewCase = () => {
    const newCase = {
      patientId: `IPD-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: '',
      savedAt: new Date().toLocaleString(),
      status: 'active',
      department: 'ipd',
      patient: {
        name: '',
        patientId: '',
        age: '',
        weight: '',
        gender: 'Male',
        complaints: '',
        pastMedicalHistory: '',
        medicationHistory: '',
        allergicHistory: '',
        socialHistory: '',
        physicalExam: '',
        bp: '',
        hr: '',
        rr: '',
        temp: '',
        spo2: '',
        labs: '',
        labValues: {},
        renalImpairment: false,
        hepaticImpairment: false,
        allergies: [],
        diagnoses: []
      },
      drugChart: [emptyDrugRow()],
      assignedPatientId: '',
      procedures: [],
      manualErrors: [],
      riskScales: {},
      review: {
        notes: {},
        counsellingPoints: '',
        pharmacistName: profile?.first_name ? `Dr. ${profile.first_name}` : 'Dr. Thirumalai',
        signedAt: ''
      },
      summary: ''
    };
    newCase.patient.patientId = newCase.patientId;
    newCase.assignedPatientId = newCase.patientId;
    setActiveCase(newCase);
  };

  if (activeCase) {
    return (
      <IPDCaseForm
        initialCase={activeCase}
        onBack={() => {
          setActiveCase(null);
          loadCases();
        }}
        onSaved={() => {
          loadCases();
        }}
      />
    );
  }

  const filteredCases = cases.filter(c =>
    `${c.patientName} ${c.patientId} ${(c.patient?.complaints || '')}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <AppLayout
      title="Inpatient Department"
      subtitle="Admitted cases & Clinical Decision Support"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, ID (MRN) or condition..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button onClick={handleStartNewCase} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> New Admitted Case
        </Button>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Bed className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <p className="text-base font-semibold">No admitted IPD cases found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search ? 'Try clearing your search query.' : 'Admit a new patient case to begin clinical record verification and real-time error detection.'}
            </p>
            <Button onClick={handleStartNewCase} variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" /> Start New Case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCases.map(c => {
            const errors = runErrorDetection(c.patient || {}, c.drugChart || [], c.assignedPatientId);
            const criticalCount = errors.filter(e => e.severity === 'critical').length;
            const hasErrors = errors.length > 0;

            return (
              <Card
                key={c.patientId}
                onClick={() => setActiveCase(c)}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
              >
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
                        {c.patientName || c.patient?.name || 'Unnamed Patient'}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {c.patientId}
                        </span>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Age: {c.patient?.age ?? '—'} · Gender: {c.patient?.gender || '—'} · Weight: {c.patient?.weight ? `${c.patient.weight} kg` : '—'}
                      </p>
                    </div>

                    <Badge
                      variant={hasErrors ? (criticalCount > 0 ? 'destructive' : 'warning') : 'success'}
                      className="gap-1 shrink-0 text-xs"
                    >
                      {hasErrors ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Rational / Clean
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.summary || c.patient?.complaints || 'No clinical summary recorded.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Pill className="h-3 w-3 text-primary" />
                      {(c.drugChart || []).filter(d => (d.genericName || d.brandName)).length} Medications
                    </span>
                    <span>Saved: {c.savedAt || 'Just now'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

// -------------------------------------------------------------------------------------------------
// Subcomponent: IPD Case Form with Real-time Error Detection & Full Interactivity
// -------------------------------------------------------------------------------------------------
function IPDCaseForm({ initialCase, onBack, onSaved }) {
  const [caseData, setCaseData] = useState(initialCase);
  const [patient, setPatient] = useState(initialCase.patient || {});
  const [drugChart, setDrugChart] = useState(initialCase.drugChart || [emptyDrugRow()]);
  const [assignedPatientId, setAssignedPatientId] = useState(initialCase.assignedPatientId || patient.patientId || '');
  const [procedures, setProcedures] = useState(initialCase.procedures || []);
  const [manualErrors, setManualErrors] = useState(initialCase.manualErrors || []);
  const [riskScalesValues, setRiskScalesValues] = useState(initialCase.riskScales || {});
  const [activeScaleId, setActiveScaleId] = useState('chadsvasc');
  const [review, setReview] = useState(initialCase.review || { counsellingPoints: '', pharmacistName: 'Dr. Thirumalai' });
  const [riskAssessmentEnabled, setRiskAssessmentEnabled] = useState(true);
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Sync patientId to assignedPatientId if new
  useEffect(() => {
    if (patient.patientId && !assignedPatientId) {
      setAssignedPatientId(patient.patientId);
    }
  }, [patient.patientId, assignedPatientId]);

  // Real-time Clinical Error Detection Engine computation
  const detectedErrors = useMemo(() => {
    return runErrorDetection(patient, drugChart, assignedPatientId);
  }, [patient, drugChart, assignedPatientId]);

  const allErrors = useMemo(() => {
    const formattedManual = manualErrors.map(m => ({
      id: m.id,
      type: 'manual_error',
      severity: m.severity || 'major',
      title: m.title ? `[Manual] ${m.title}` : '[Manual] Clinical Medication Error',
      description: m.description,
      suggestion: m.intervention
    }));
    return [...detectedErrors, ...formattedManual];
  }, [detectedErrors, manualErrors]);

  // Auto-suggest diagnoses based on complaints & vitals
  const diagnosisSuggestions = useMemo(() => {
    const existing = new Set(patient.diagnoses || []);
    return suggestDiagnoses(patient.complaints || '', {
      bp: patient.bp,
      hr: patient.hr,
      temp: patient.temp,
      spo2: patient.spo2
    }).filter(d => !existing.has(d));
  }, [patient.complaints, patient.bp, patient.hr, patient.temp, patient.spo2, patient.diagnoses]);

  // Validation
  const validationIssues = useMemo(() => {
    const issues = [];
    if (!patient.name?.trim()) issues.push('Patient Name is required.');
    if (!patient.patientId?.trim()) issues.push('Patient ID (MRN) is required.');
    if (!patient.age) issues.push('Age is required.');
    if (!patient.gender) issues.push('Gender is required.');
    if (!patient.complaints?.trim()) issues.push('Admission complaints are required.');
    return issues;
  }, [patient]);

  const isValidToSave = validationIssues.length === 0;

  // Active risk scale calculation
  const currentRiskScale = useMemo(() => {
    return RISK_SCALES.find(s => s.id === activeScaleId) || RISK_SCALES[0];
  }, [activeScaleId]);

  const currentScaleScore = useMemo(() => {
    if (!currentRiskScale) return { total: 0, level: 'low', label: 'Low' };
    const values = riskScalesValues[activeScaleId] || {};
    let total = 0;
    const positives = [];

    for (const item of currentRiskScale.items || []) {
      const val = values[item.id];
      if (val) {
        if (item.input === 'yesno') {
          total += item.points ?? 1;
          positives.push(item.label);
        } else {
          const num = Number(val) || 0;
          total += num * (item.weight ?? 1);
        }
      }
    }

    if (currentRiskScale.mode === 'formula' && currentRiskScale.formula) {
      try {
        total = currentRiskScale.formula(values);
      } catch {
        // fallback
      }
    }

    const band = (currentRiskScale.bands || []).find(b => 
      (b.min === undefined || total >= b.min) && (b.max === undefined || total <= b.max)
    );

    return {
      total,
      band,
      level: band?.level || 'low',
      label: band?.label || 'Normal / Low'
    };
  }, [currentRiskScale, activeScaleId, riskScalesValues]);

  const handleToggleScaleItem = (scaleId, itemId, points) => {
    const prev = riskScalesValues[scaleId] || {};
    const nextVal = prev[itemId] ? false : points || 1;
    setRiskScalesValues({
      ...riskScalesValues,
      [scaleId]: {
        ...prev,
        [itemId]: nextVal
      }
    });
  };

  const handleSave = () => {
    if (!isValidToSave) {
      setSaveStatus({ type: 'error', text: `Please fill required details: ${validationIssues.join(' ')}` });
      return;
    }

    const payload = {
      ...caseData,
      patientId: patient.patientId.trim(),
      patientName: patient.name.trim(),
      patient,
      drugChart,
      assignedPatientId,
      procedures,
      manualErrors,
      riskScales: riskScalesValues,
      review,
      summary: caseData.summary || `${patient.age || '—'}yo ${patient.gender || 'patient'} admitted with: ${patient.complaints?.slice(0, 150) || '—'}. Diagnoses: ${(patient.diagnoses || []).join(', ') || 'Under evaluation'}. Active meds: ${drugChart.filter(d => d.genericName || d.brandName).length}. Flags: ${allErrors.length} detected.`
    };

    storage.saveCase(payload);
    setSaveStatus({ type: 'success', text: `Case saved successfully in IPD records as ${payload.patientId}.` });
    onSaved && onSaved();
  };

  const handleDischargeConfirm = (summary) => {
    storage.dischargeCase(patient.patientId, {
      dischargeDate: new Date().toLocaleDateString(),
      dischargeSummary: summary,
      finalMedications: drugChart.filter(d => d.genericName || d.brandName),
      dischargedBy: review.pharmacistName || 'Dr. Thirumalai'
    });
    setDischargeModalOpen(false);
    onBack();
  };

  // Drug Chart handlers
  const handleAddDrug = () => {
    setDrugChart([...drugChart, emptyDrugRow()]);
  };

  const handleUpdateDrug = (index, patch) => {
    const updated = [...drugChart];
    updated[index] = { ...updated[index], ...patch };
    setDrugChart(updated);
  };

  const handleDeleteDrug = (index) => {
    setDrugChart(drugChart.filter((_, i) => i !== index));
  };

  const handleDrugNameSelect = (index, selectedName) => {
    const drug = DRUG_DATABASE.find(d => d.name.toLowerCase() === selectedName.toLowerCase() || d.genericName?.toLowerCase() === selectedName.toLowerCase());
    if (drug) {
      handleUpdateDrug(index, {
        genericName: drug.name,
        brandName: drug.name,
        dose: drug.adultDoseRange ? String(drug.adultDoseRange.min) : '',
        indication: drug.indications ? drug.indications[0] : ''
      });
    } else {
      handleUpdateDrug(index, { genericName: selectedName });
    }
  };

  // Procedure handlers
  const handleAddProcedure = () => {
    setProcedures([...procedures, emptyProcedure()]);
  };

  const handleUpdateProcedure = (index, patch) => {
    const updated = [...procedures];
    updated[index] = { ...updated[index], ...patch };
    setProcedures(updated);
  };

  const handleDeleteProcedure = (index) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  // Manual Error handlers
  const handleAddManualError = () => {
    setManualErrors([...manualErrors, emptyManualError()]);
  };

  const handleUpdateManualError = (index, patch) => {
    const updated = [...manualErrors];
    updated[index] = { ...updated[index], ...patch };
    setManualErrors(updated);
  };

  const handleDeleteManualError = (index) => {
    setManualErrors(manualErrors.filter((_, i) => i !== index));
  };

  // Executive summary generator
  const handleGenerateSummary = () => {
    const medsCount = drugChart.filter(d => d.genericName || d.brandName).length;
    const diags = (patient.diagnoses || []).join(', ') || 'clinical workup';
    const text = `${patient.name || 'The patient'} (${patient.age || '—'}yo ${patient.gender || 'patient'}, ID: ${patient.patientId || 'N/A'}) was admitted with ${patient.complaints || 'acute complaints'}.
Primary Clinical Diagnoses: ${diags}.
Active Inpatient Medications: ${medsCount} agent(s) prescribed (${drugChart.map(d => `${d.genericName || d.brandName} ${d.dose}mg ${d.frequency}`).filter(Boolean).join(', ')}).
Clinical Safety Status: ${allErrors.length === 0 ? 'Optimal / No medication errors detected.' : `${allErrors.length} error(s) flagged for pharmacist intervention (${allErrors.map(e => e.title).join('; ')}).`}
Vitals upon admission: BP ${patient.bp || '—'}, HR ${patient.hr || '—'} bpm, SpO2 ${patient.spo2 || '—'}%.`;

    setCaseData({ ...caseData, summary: text });
    setSaveStatus({ type: 'success', text: 'Executive clinical summary generated.' });
  };

  return (
    <AppLayout
      title="Inpatient Department"
      subtitle={patient.name ? `${patient.name} (${patient.patientId || 'New MRN'})` : 'New Case Record'}
    >
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-sm sticky top-20 z-40">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back to case list
        </Button>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {drugChart.filter(d => d.genericName || d.brandName).length} Medications
            </span>
            <span>·</span>
            {allErrors.length > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {allErrors.length} {allErrors.length === 1 ? 'Error' : 'Errors'}
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                ✓ Clean
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValidToSave}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" /> Save in IPD
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDischargeModalOpen(true)}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Discharge
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPrintModalOpen(true)}
            className="gap-1.5"
            title="Print Official Medical Case Sheet"
          >
            <Printer className="h-4 w-4" /> Case Sheet
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${saveStatus.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <span>{saveStatus.text}</span>
          <button onClick={() => setSaveStatus(null)} className="font-bold">×</button>
        </div>
      )}

      {/* SECTION 1: Patient Demographics & Clinical Information */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Patient Demographics & Clinical History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold">Patient Name *</label>
              <Input
                placeholder="Full patient name"
                value={patient.name || ''}
                onChange={e => setPatient({ ...patient, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Patient ID (MRN) *</label>
              <Input
                placeholder="e.g. IPD-8821"
                value={patient.patientId || ''}
                onChange={e => setPatient({ ...patient, patientId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Age (years) *</label>
              <Input
                type="number"
                placeholder="e.g. 65"
                value={patient.age || ''}
                onChange={e => setPatient({ ...patient, age: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Weight (kg)</label>
              <Input
                type="number"
                placeholder="e.g. 70"
                value={patient.weight || ''}
                onChange={e => setPatient({ ...patient, weight: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold">Gender *</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={patient.gender || 'Male'}
                onChange={e => setPatient({ ...patient, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold">Allergic History</label>
              <Input
                placeholder="e.g. Penicillin, Sulfa drugs, NSAIDs (or 'None known')"
                value={patient.allergicHistory || ''}
                onChange={e => setPatient({ ...patient, allergicHistory: e.target.value })}
              />
            </div>
          </div>

          {/* Vitals row */}
          <div className="pt-2 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground block mb-2">
              Admission Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[11px] text-muted-foreground">BP (mmHg)</label>
                <Input
                  placeholder="120/80"
                  value={patient.bp || ''}
                  onChange={e => setPatient({ ...patient, bp: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Heart Rate (bpm)</label>
                <Input
                  placeholder="76"
                  value={patient.hr || ''}
                  onChange={e => setPatient({ ...patient, hr: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Resp Rate (/min)</label>
                <Input
                  placeholder="18"
                  value={patient.rr || ''}
                  onChange={e => setPatient({ ...patient, rr: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Temp (°F)</label>
                <Input
                  placeholder="98.6"
                  value={patient.temp || ''}
                  onChange={e => setPatient({ ...patient, temp: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">SpO2 (%)</label>
                <Input
                  placeholder="98"
                  value={patient.spo2 || ''}
                  onChange={e => setPatient({ ...patient, spo2: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Complaints & History */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/40">
            <div>
              <label className="text-xs font-semibold">Complaints / Reason for Admission *</label>
              <textarea
                rows={3}
                placeholder="Describe presenting symptoms, onset, severity..."
                value={patient.complaints || ''}
                onChange={e => setPatient({ ...patient, complaints: e.target.value })}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Past Medical History</label>
              <textarea
                rows={3}
                placeholder="Chronic conditions, prior hospitalizations, surgeries..."
                value={patient.pastMedicalHistory || ''}
                onChange={e => setPatient({ ...patient, pastMedicalHistory: e.target.value })}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Diagnoses with ICD-10 and AI Auto-suggestions */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-primary" />
                Clinical Diagnoses (with ICD-10 Code Auto-Lookup)
              </label>
              {diagnosisSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Auto-suggested from vitals & symptoms:
                  </span>
                  {diagnosisSuggestions.map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        const updated = [...(patient.diagnoses || []), sug];
                        setPatient({ ...patient, diagnoses: updated });
                      }}
                      className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] hover:bg-primary/20 transition-colors font-medium"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-md border border-input bg-background">
              {(patient.diagnoses || []).map((diag, idx) => {
                const icd = getIcdCode(diag);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
                  >
                    <span>{diag}</span>
                    {icd && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-primary/20 text-primary font-mono">
                        {icd}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = patient.diagnoses.filter((_, i) => i !== idx);
                        setPatient({ ...patient, diagnoses: updated });
                      }}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <input
                type="text"
                placeholder="Type diagnosis and press Enter..."
                className="flex-1 min-w-[200px] border-none bg-transparent text-xs focus:outline-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    const newDiag = e.target.value.trim();
                    if (!patient.diagnoses?.includes(newDiag)) {
                      setPatient({
                        ...patient,
                        diagnoses: [...(patient.diagnoses || []), newDiag]
                      });
                    }
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Organ Impairment Flags */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/40">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <Switch
                checked={patient.renalImpairment || false}
                onCheckedChange={checked => setPatient({ ...patient, renalImpairment: checked })}
              />
              <span className="font-medium">Renal Impairment (CrCl &lt; 50 mL/min)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <Switch
                checked={patient.hepaticImpairment || false}
                onCheckedChange={checked => setPatient({ ...patient, hepaticImpairment: checked })}
              />
              <span className="font-medium">Hepatic Impairment / Cirrhosis</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Medication Administration Drug Chart */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Medication Order & Drug Chart
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dose, route, frequency and administration tracker. Autocompletes against 185+ clinical drugs.
              </p>
            </div>

            {/* Wrong Patient Verification Input */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold whitespace-nowrap">
                Assigned Patient ID on Chart:
              </label>
              <Input
                value={assignedPatientId}
                onChange={e => setAssignedPatientId(e.target.value)}
                placeholder="Chart Patient ID"
                className={`h-8 w-32 text-xs font-mono ${
                  assignedPatientId && patient.patientId && assignedPatientId.trim() !== patient.patientId.trim()
                    ? 'border-destructive ring-1 ring-destructive'
                    : ''
                }`}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                  <th className="pb-2 min-w-[180px]">Drug (Generic / Brand)</th>
                  <th className="pb-2 w-20">Dose (mg)</th>
                  <th className="pb-2 w-28">Form</th>
                  <th className="pb-2 w-20">Route</th>
                  <th className="pb-2 w-24">Freq</th>
                  <th className="pb-2 text-center w-36">Days (1-4)</th>
                  <th className="pb-2 min-w-[150px]">Indication</th>
                  <th className="pb-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {drugChart.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    {/* Drug Input with Autocomplete datalist */}
                    <td className="py-2.5 pr-2">
                      <input
                        list={`drug-list-${idx}`}
                        value={row.genericName || ''}
                        onChange={e => handleUpdateDrug(idx, { genericName: e.target.value })}
                        onBlur={e => handleDrugNameSelect(idx, e.target.value)}
                        placeholder="e.g. Metoprolol"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
                      />
                      <datalist id={`drug-list-${idx}`}>
                        {DRUG_DATABASE.map(d => (
                          <option key={d.name} value={d.name}>
                            {d.category ? `(${d.category})` : ''}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    {/* Dose */}
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        value={row.dose || ''}
                        onChange={e => handleUpdateDrug(idx, { dose: e.target.value })}
                        placeholder="mg"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs font-mono text-center"
                      />
                    </td>

                    {/* Form */}
                    <td className="py-2.5 pr-2">
                      <select
                        value={row.dosageForm || 'Tablet'}
                        onChange={e => handleUpdateDrug(idx, { dosageForm: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-1 text-xs"
                      >
                        {DOSAGE_FORMS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>

                    {/* Route */}
                    <td className="py-2.5 pr-2">
                      <select
                        value={row.route || 'P/O'}
                        onChange={e => handleUpdateDrug(idx, { route: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-1 text-xs"
                      >
                        {ROUTES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>

                    {/* Frequency */}
                    <td className="py-2.5 pr-2">
                      <select
                        value={row.frequency || 'OD'}
                        onChange={e => handleUpdateDrug(idx, { frequency: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-1 text-xs"
                      >
                        {FREQUENCIES.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>

                    {/* Days Given / Missed tracker */}
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4].map(day => {
                          const status = row.days?.[day] || 'none';
                          const nextStatus = status === 'none' ? 'given' : status === 'given' ? 'missed' : 'none';
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                handleUpdateDrug(idx, {
                                  days: { ...(row.days || {}), [day]: nextStatus }
                                });
                              }}
                              className={`h-7 w-7 rounded border text-[10px] font-bold transition-all ${
                                status === 'given'
                                  ? 'bg-success/20 border-success text-success'
                                  : status === 'missed'
                                  ? 'bg-destructive/20 border-destructive text-destructive'
                                  : 'bg-muted border-border/80 text-muted-foreground'
                              }`}
                              title={`Day ${day}: ${status} (Click to toggle)`}
                            >
                              D{day}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Indication */}
                    <td className="py-2.5 pr-2">
                      <input
                        value={row.indication || ''}
                        onChange={e => handleUpdateDrug(idx, { indication: e.target.value })}
                        placeholder="e.g. Hypertension"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteDrug(idx)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Delete drug"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDrug}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Drug Row
          </Button>
        </CardContent>
      </Card>

      {/* SECTION 3: Clinical Procedures */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Clinical Procedures & Interventions
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProcedure}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Procedure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {procedures.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No invasive or diagnostic procedures recorded for this admission encounter.
            </p>
          ) : (
            <div className="space-y-3">
              {procedures.map((proc, idx) => (
                <div key={proc.id} className="p-3.5 rounded-lg border border-border/70 bg-card space-y-3">
                  <div className="grid gap-2 sm:grid-cols-4 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
                      <select
                        value={proc.type}
                        onChange={e => handleUpdateProcedure(idx, { type: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        {PROCEDURE_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground">Procedure Name</label>
                      <input
                        value={proc.name}
                        onChange={e => handleUpdateProcedure(idx, { name: e.target.value })}
                        placeholder="e.g. 2D Echocardiogram, Lumbar Puncture, Central Line Placement"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProcedure(idx)}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Clinical Indication</label>
                      <input
                        value={proc.indication}
                        onChange={e => handleUpdateProcedure(idx, { indication: e.target.value })}
                        placeholder="Why was this procedure ordered?"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Findings & Outcome</label>
                      <input
                        value={proc.outcome}
                        onChange={e => handleUpdateProcedure(idx, { outcome: e.target.value })}
                        placeholder="Outcome / Report summary"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Real-Time Error Detection Results Panel */}
      <Card className={allErrors.length > 0 ? 'border-destructive/40 shadow-sm' : 'border-success/40'}>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${allErrors.length > 0 ? 'text-destructive' : 'text-success'}`} />
              Real-Time Error Detection Engine
            </CardTitle>
            <Badge variant={allErrors.length > 0 ? 'destructive' : 'success'}>
              {allErrors.length > 0 ? `${allErrors.length} Issue(s) Detected` : 'All Checks Passed'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          {allErrors.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 text-success border border-success/20">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">No Medication Errors Detected</p>
                <p className="text-xs text-muted-foreground">
                  Prescription complies with adult/pediatric dosing limits, organ adjustments, contraindications, and interaction safety guidelines.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {allErrors.map((err, i) => (
                <div
                  key={err.id || i}
                  className={`p-4 rounded-lg border text-xs space-y-1.5 transition-all ${
                    err.severity === 'critical'
                      ? 'bg-destructive/10 border-destructive/40 text-destructive-foreground'
                      : err.severity === 'major'
                      ? 'bg-warning/10 border-warning/40 text-warning-foreground'
                      : 'bg-muted/60 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1.5 text-sm">
                      <AlertTriangle className={`h-4 w-4 ${err.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      {err.title}
                    </span>
                    <Badge
                      variant={err.severity === 'critical' ? 'destructive' : 'warning'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {err.severity}
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                    {err.description}
                  </p>

                  {err.suggestion && (
                    <div className="pt-1.5 border-t border-border/40 text-primary font-medium flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      <span>Recommendation: {err.suggestion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5: Manual Clinical Error Recording */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Manual Clinical Incident / Error Documentation
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddManualError}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Record Incident
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {manualErrors.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No manual incidents logged. Clinical pharmacists can record observed transcribing, dispensing, or nursing administration errors here.
            </p>
          ) : (
            <div className="space-y-3">
              {manualErrors.map((mErr, idx) => (
                <div key={mErr.id} className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-4 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Category</label>
                      <select
                        value={mErr.category}
                        onChange={e => handleUpdateManualError(idx, { category: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="Prescribing">Prescribing Error</option>
                        <option value="Transcribing">Transcribing Error</option>
                        <option value="Dispensing">Dispensing Error</option>
                        <option value="Administration">Administration Error</option>
                        <option value="Monitoring">Monitoring Error</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground">Error Title</label>
                      <input
                        value={mErr.title}
                        onChange={e => handleUpdateManualError(idx, { title: e.target.value })}
                        placeholder="e.g. Delayed dose administration, Incomplete prescription order"
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteManualError(idx)}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Incident Description</label>
                      <input
                        value={mErr.description}
                        onChange={e => handleUpdateManualError(idx, { description: e.target.value })}
                        placeholder="Clinical details of what happened..."
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Pharmacist Intervention</label>
                      <input
                        value={mErr.intervention}
                        onChange={e => handleUpdateManualError(idx, { intervention: e.target.value })}
                        placeholder="Corrective action taken..."
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 6: Interactive Clinical Risk Assessment Calculator */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Interactive Clinical Risk Assessment Scales
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Validated calculators for VTE, Atrial Fibrillation, Stroke, Bleeding & ICU severity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {riskAssessmentEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={riskAssessmentEnabled}
                onCheckedChange={setRiskAssessmentEnabled}
              />
            </div>
          </div>
        </CardHeader>
        {riskAssessmentEnabled && (
          <CardContent className="p-6 space-y-4">
            {/* Scale Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-semibold">Active Clinical Scale:</label>
              <select
                value={activeScaleId}
                onChange={e => setActiveScaleId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs max-w-sm font-medium"
              >
                {RISK_SCALES.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>

              <Badge
                variant={currentScaleScore.level === 'high' ? 'destructive' : currentScaleScore.level === 'moderate' ? 'warning' : 'success'}
                className="text-xs font-bold"
              >
                Calculated Score: {currentScaleScore.total} · {currentScaleScore.label}
              </Badge>
            </div>

            {/* Checklist of scale criteria */}
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <h4 className="font-semibold text-sm font-heading">{currentRiskScale.name}</h4>
                  <p className="text-xs text-muted-foreground">{currentRiskScale.purpose}</p>
                </div>
                <span className="text-xs text-muted-foreground/80 font-mono">
                  {currentRiskScale.interpretation}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {(currentRiskScale.items || []).map(item => {
                  const isChecked = !!(riskScalesValues[activeScaleId]?.[item.id]);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-primary/10 border-primary/50 text-foreground'
                          : 'bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleScaleItem(activeScaleId, item.id, item.points)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-primary">
                        +{item.points ?? 1}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SECTION 7: Clinical Pharmacist Review & Notes */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Clinical Pharmacist Review & Executive Summary
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              className="gap-1.5 text-xs h-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Auto-Generate Summary
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Reviewing Clinician / Pharmacist</label>
              <Input
                value={review.pharmacistName || ''}
                onChange={e => setReview({ ...review, pharmacistName: e.target.value })}
                placeholder="Dr. Thirumalai"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Verification Timestamp</label>
              <Input
                value={caseData.savedAt || new Date().toLocaleString()}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Executive Narrative / Summary</label>
            <textarea
              rows={3}
              value={caseData.summary || ''}
              onChange={e => setCaseData({ ...caseData, summary: e.target.value })}
              placeholder="Case presentation, clinical rationale, error analysis narrative..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Patient & Caregiver Counselling Points</label>
            <textarea
              rows={2}
              value={review.counsellingPoints || ''}
              onChange={e => setReview({ ...review, counsellingPoints: e.target.value })}
              placeholder="e.g. Advise on taking medications with food, avoiding grapefruit juice, signs of hypoglycemia or bleeding precautions..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discharge Dialog Modal */}
      {dischargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl p-6 border border-border shadow-elevated space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <LogOut className="h-5 w-5" />
              <h3 className="font-bold font-heading text-lg">Discharge Patient</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Discharging will mark this case as completed and transfer the full clinical history, medication log, and audit trail into the Medical Records Department (MRD) archive.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Discharge Summary / Notes</label>
              <textarea
                rows={4}
                value={dischargeNotes}
                onChange={e => setDischargeNotes(e.target.value)}
                placeholder="Discharge condition (Stable / Improved), discharge prescription, follow-up advice..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDischargeModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleDischargeConfirm(dischargeNotes)}>
                Confirm Discharge to MRD
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Case Sheet Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl p-6 border border-border shadow-elevated max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg font-heading">Clinical Inpatient Case Record</h3>
                <p className="text-xs text-muted-foreground">Official Clinical Pharmacist Verification Sheet</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print / PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPrintModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Print Body */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/40 border">
                <div><span className="text-muted-foreground">Patient:</span> <strong>{patient.name}</strong></div>
                <div><span className="text-muted-foreground">MRN:</span> <strong>{patient.patientId}</strong></div>
                <div><span className="text-muted-foreground">Age/Sex:</span> <strong>{patient.age} / {patient.gender}</strong></div>
                <div><span className="text-muted-foreground">Weight:</span> <strong>{patient.weight ? `${patient.weight} kg` : '—'}</strong></div>
              </div>

              <div>
                <strong>Admission Vitals:</strong> BP {patient.bp || '—'}, HR {patient.hr || '—'} bpm, RR {patient.rr || '—'}, Temp {patient.temp || '—'} °F, SpO2 {patient.spo2 || '—'}%
              </div>

              <div>
                <strong>Presenting Complaints:</strong>
                <p className="mt-0.5 text-muted-foreground">{patient.complaints}</p>
              </div>

              <div>
                <strong>Diagnoses:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(patient.diagnoses || []).map((d, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-muted font-mono">{d} ({getIcdCode(d) || 'N/A'})</span>
                  ))}
                </div>
              </div>

              <div>
                <strong>Active Medications on Chart:</strong>
                <table className="w-full text-left text-xs border border-collapse mt-1">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-1.5 border">Drug</th>
                      <th className="p-1.5 border">Dose</th>
                      <th className="p-1.5 border">Route</th>
                      <th className="p-1.5 border">Freq</th>
                      <th className="p-1.5 border">Indication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugChart.filter(d => d.genericName || d.brandName).map((m, i) => (
                      <tr key={i}>
                        <td className="p-1.5 border font-semibold">{m.genericName || m.brandName}</td>
                        <td className="p-1.5 border">{m.dose} mg</td>
                        <td className="p-1.5 border">{m.route}</td>
                        <td className="p-1.5 border">{m.frequency}</td>
                        <td className="p-1.5 border">{m.indication || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <strong>Clinical Error Detection Review:</strong>
                {allErrors.length === 0 ? (
                  <p className="mt-1 text-success font-medium">✓ Clean chart: No medication prescribing, dosage, or interaction errors detected.</p>
                ) : (
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {allErrors.map((err, i) => (
                      <li key={i} className="text-destructive">
                        <strong>[{err.severity.toUpperCase()}] {err.title}:</strong> {err.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t flex justify-between items-center text-muted-foreground">
                <span>Verified by: <strong>{review.pharmacistName || 'Dr. Thirumalai'}</strong></span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
