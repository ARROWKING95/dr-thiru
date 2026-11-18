import mongoose from 'mongoose';

const opdMedicationSchema = new mongoose.Schema({
  id: String,
  drug: String,
  dose: String,
  route: String,
  frequency: String,
  duration: String,
  instructions: String
}, { _id: false });

const opdVisitSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  op_number: { type: String, required: true },
  patient_name: { type: String, required: true },
  age: Number,
  gender: String,
  contact: String,
  complaints: String,
  vitals: {
    bp: String,
    hr: String,
    temp: String,
    spo2: String,
    weight: String,
    height: String
  },
  diagnoses: [String],
  medications: [opdMedicationSchema],
  created_at: { type: String, default: () => new Date().toISOString() },
  consultant: { type: String, default: 'Dr. Thirumalai' }
}, {
  timestamps: true
});

export const OpdVisit = mongoose.model('OpdVisit', opdVisitSchema);
