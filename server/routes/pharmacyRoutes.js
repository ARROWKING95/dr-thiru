import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/pharmacy/dispenses - List all dispense logs
router.get('/dispenses', async (req, res) => {
  try {
    const dispenses = await dbStore.getDispenses();
    res.json({ success: true, count: dispenses.length, dispenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pharmacy/dispense - Record a single patient dispense
router.post('/dispense', async (req, res) => {
  try {
    const dispenseData = req.body;
    if (!dispenseData.patient_name) {
      return res.status(400).json({ success: false, error: 'Patient name is required' });
    }

    const saved = await dbStore.recordDispense(dispenseData);

    // Optional: auto-adjust inventory issued count for matching drugs
    if (Array.isArray(dispenseData.medications)) {
      const invItems = await dbStore.getInventory();
      for (const med of dispenseData.medications) {
        const drugName = (med.drug || med.genericName || med.brandName || '').toLowerCase();
        if (!drugName) continue;
        const match = invItems.find(
          i => i.generic_name.toLowerCase().includes(drugName) || i.brand_name.toLowerCase().includes(drugName)
        );
        if (match) {
          await dbStore.updateInventoryItem(match.id, {
            qty_issued: (match.qty_issued || 0) + (med.qty || 1)
          });
        }
      }
    }

    await dbStore.logAction(
      'PHARMACY_DISPENSED',
      req.headers['x-user'] || 'pharmacist',
      'pharmacist',
      { patient_name: saved.patient_name, department: saved.department }
    );

    res.status(201).json({ success: true, dispense: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pharmacy/dispense-all - Batch dispense multiple orders
router.post('/dispense-all', async (req, res) => {
  try {
    const { items = [] } = req.body;
    const results = [];

    for (const item of items) {
      const saved = await dbStore.recordDispense(item);
      results.push(saved);
    }

    await dbStore.logAction(
      'PHARMACY_BATCH_DISPENSED',
      req.headers['x-user'] || 'pharmacist',
      'pharmacist',
      { total_orders: items.length }
    );

    res.json({ success: true, count: results.length, dispenses: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
