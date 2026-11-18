import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  city: { type: String, default: '' },
  code: { type: String, required: true },
  is_builtin: { type: Boolean, default: false },
  drugs: [
    {
      brand: String,
      generic: String,
      category: String,
      maxDailyDose: String
    }
  ]
}, {
  timestamps: true
});

export const Hospital = mongoose.model('Hospital', hospitalSchema);
