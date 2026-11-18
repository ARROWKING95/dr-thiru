import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/cases - List all cases (optional filter: status=active|discharged)
router.get('/', async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const cases = await dbStore.getCases(filter);
    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cases/:patientId - Get single case by patient ID
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const caseData = await dbStore.getCaseByPatientId(patientId);
    if (!caseData) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    res.json({ success: true, case: caseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cases - Upsert clinical case
router.post('/', async (req, res) => {
  try {
    const caseData = req.body;
    if (!caseData.patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required' });
    }

    const saved = await dbStore.upsertCase(caseData);
    await dbStore.logAction(
      'CASE_UPSERT',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { patientId: caseData.patientId, patientName: caseData.patientName }
    );

    res.status(200).json({ success: true, case: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cases/:patientId/discharge - Discharge patient to MRD
router.post('/:patientId/discharge', async (req, res) => {
  try {
    const { patientId } = req.params;
    const dischargeDetails = req.body || {};

    const updated = await dbStore.dischargeCase(patientId, dischargeDetails);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    await dbStore.logAction(
      'CASE_DISCHARGE',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { patientId, dischargeDetails }
    );

    res.json({ success: true, message: 'Patient successfully discharged to MRD', case: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cases/:patientId - Delete case
router.delete('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const deleted = await dbStore.deleteCase(patientId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    await dbStore.logAction(
      'CASE_DELETED',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { patientId }
    );

    res.json({ success: true, message: 'Case removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
