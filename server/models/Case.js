import mongoose from 'mongoose';

const medicationItemSchema = new mongoose.Schema({
  id: String,
  brandName: String,
  genericName: String,
  dose: String,
  dosageForm: String,
  route: String,
  frequency: String,
  days: {
    type: Map,
    of: String,
    default: {}
  },
  indication: String,
  status: { type: String, default: 'active' }
}, { _id: false });

const procedureSchema = new mongoose.Schema({
  id: String,
  type: { type: String }, // Explicit type property
  name: String,
  indication: String,
  outcome: String,
  notes: String
}, { _id: false });

const manualErrorSchema = new mongoose.Schema({
  id: String,
  category: String,
  description: String,
  severity: String,
  reportedBy: String,
  reportedAt: String
}, { _id: false });

const caseSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  fileName: { type: String, default: '' },
  patientName: { type: String, required: true },
  status: { type: String, enum: ['active', 'discharged', 'archived'], default: 'active' },
  department: { type: String, default: 'ipd' },
  savedAt: { type: String, default: () => new Date().toLocaleString() },
  dischargedAt: { type: String, default: '' },
  discharge: {
    dischargeDate: String,
    dischargeType: String,
    finalDiagnosis: String,
    dischargeCondition: String,
    dischargeSummary: String,
    followUpInstructions: String,
    doctorNotes: String
  },
  patient: {
    name: String,
    patientId: String,
    age: Number,
    weight: Number,
    gender: String,
    complaints: String,
    pastMedicalHistory: String,
    medicationHistory: String,
    allergicHistory: String,
    socialHistory: String,
    physicalExam: String,
    bp: String,
    hr: String,
    rr: String,
    temp: String,
    spo2: String,
    labs: String,
    labValues: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    specialInvestigations: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    renalImpairment: { type: Boolean, default: false },
    hepaticImpairment: { type: Boolean, default: false },
    allergies: [String],
    diagnoses: [String]
  },
  drugChart: [medicationItemSchema],
  assignedPatientId: String,
  procedures: [procedureSchema],
  manualErrors: [manualErrorSchema],
  riskAssessments: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  review: {
    notes: { type: Map, of: String, default: {} },
    counsellingPoints: String,
    pharmacistName: String,
    signedAt: String
  },
  summary: String
}, {
  timestamps: true
});

export const Case = mongoose.model('Case', caseSchema);
