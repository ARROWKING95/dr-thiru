import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, default: 'dr.thirumalai' },
  role: { type: String, default: 'doctor' },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, default: '127.0.0.1' },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
