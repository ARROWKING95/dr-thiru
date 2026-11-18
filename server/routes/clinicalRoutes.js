import express from 'express';
import { runErrorDetection } from '../../src/services/errorDetection.js';
import { suggestDiagnoses } from '../../src/services/diagnosisHelper.js';

const router = express.Router();

// POST /api/clinical/check-errors - Run clinical error detection engine on server
router.post('/check-errors', (req, res) => {
  try {
    const { patient = {}, drugChart = [], manualErrors = [], hospitalData = null } = req.body;
    const errors = runErrorDetection(patient, drugChart, manualErrors, hospitalData);
    res.json({
      success: true,
      errorCount: errors.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/clinical/suggest-diagnosis - Get AI / rule-based diagnostic suggestions from symptoms & vitals
router.post('/suggest-diagnosis', (req, res) => {
  try {
    const { complaints = '', vitals = {} } = req.body;
    const suggestions = suggestDiagnoses(complaints, vitals);
    res.json({
      success: true,
      suggestions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
