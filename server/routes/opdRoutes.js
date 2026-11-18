import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/opd - List all OPD visits
router.get('/', async (req, res) => {
  try {
    const visits = await dbStore.getOpdVisits();
    res.json({ success: true, count: visits.length, visits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/opd - Record new OPD consultation
router.post('/', async (req, res) => {
  try {
    const visitData = req.body;
    if (!visitData.patient_name) {
      return res.status(400).json({ success: false, error: 'Patient name is required' });
    }

    const saved = await dbStore.createOpdVisit(visitData);
    await dbStore.logAction(
      'OPD_VISIT_CREATED',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { op_number: saved.op_number, patient_name: saved.patient_name }
    );

    res.status(201).json({ success: true, visit: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/opd/:visitId/medications/:medId - Patch specific medication
router.patch('/:visitId/medications/:medId', async (req, res) => {
  try {
    const { visitId, medId } = req.params;
    const patch = req.body;

    const updated = await dbStore.patchOpdMedication(visitId, medId, patch);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Visit or medication not found' });
    }

    res.json({ success: true, visit: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
