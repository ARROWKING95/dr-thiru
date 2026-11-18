import mongoose from 'mongoose';

const dispenseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  patient_name: { type: String, required: true },
  patient_ref: { type: String, default: '' },
  department: { type: String, enum: ['IPD', 'OPD'], default: 'IPD' },
  medications: [
    {
      drug: String,
      dose: String,
      frequency: String,
      qty: { type: Number, default: 1 }
    }
  ],
  status: { type: String, enum: ['dispensed', 'pending', 'cancelled'], default: 'dispensed' },
  dispensed_by: { type: String, default: 'Sarah Lin (Pharmacist)' },
  dispensed_at: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

export const Dispense = mongoose.model('Dispense', dispenseSchema);
