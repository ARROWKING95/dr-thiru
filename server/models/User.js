import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  profession: { type: String, default: 'doctor' },
  institution: { type: String, default: 'City General Medical Center' },
  pharmacistRegId: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, default: 'doctor' }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
