import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  cost: Number
}, { _id: false });

const labOrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  patient_name: { type: String, required: true },
  patient_ref: { type: String, default: '' },
  age: String,
  tests: [labTestSchema],
  total_cost: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  created_at: { type: String, default: () => new Date().toISOString() },
  ordered_by: { type: String, default: 'Dr. Thirumalai' }
}, {
  timestamps: true
});

export const LabOrder = mongoose.model('LabOrder', labOrderSchema);
