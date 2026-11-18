import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  brand_name: { type: String, required: true },
  generic_name: { type: String, required: true },
  strength: { type: String, default: '' },
  form: { type: String, default: 'Tablet' },
  unit_cost: { type: Number, default: 0 },
  qty_procured: { type: Number, default: 0 },
  qty_issued: { type: Number, default: 0 },
  batch_no: { type: String, default: '' },
  expiry_date: { type: String, default: '' },
  reorder_level: { type: Number, default: 500 }
}, {
  timestamps: true
});

export const Inventory = mongoose.model('Inventory', inventorySchema);
