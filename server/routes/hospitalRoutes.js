import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/hospitals - List all formularies/hospitals
router.get('/', async (req, res) => {
  try {
    const list = await dbStore.getHospitals();
    res.json({ success: true, count: list.length, hospitals: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hospitals - Create or register hospital formulary
router.post('/', async (req, res) => {
  try {
    const hospData = req.body;
    if (!hospData.name) {
      return res.status(400).json({ success: false, error: 'Hospital name is required' });
    }

    hospData.id = hospData.id || `hosp_${Date.now()}`;
    hospData.code = hospData.code || hospData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const saved = await dbStore.createHospital(hospData);
    await dbStore.logAction(
      'HOSPITAL_FORMULARY_ADDED',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { name: saved.name, code: saved.code }
    );

    res.status(201).json({ success: true, hospital: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
