import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/mrd/stats - Aggregated stats for MRD dashboard
router.get('/stats', async (req, res) => {
  try {
    const cases = await dbStore.getCases();
    const active = cases.filter(c => c.status !== 'discharged');
    const discharged = cases.filter(c => c.status === 'discharged');
    const opdVisits = await dbStore.getOpdVisits();
    const labOrders = await dbStore.getLabOrders();
    const dispenses = await dbStore.getDispenses();
    const auditLogs = await dbStore.getAuditLogs();

    res.json({
      success: true,
      stats: {
        totalCases: cases.length,
        activeInpatients: active.length,
        dischargedMRD: discharged.length,
        totalOpdVisits: opdVisits.length,
        totalLabOrders: labOrders.length,
        totalDispenses: dispenses.length,
        auditLogEntries: auditLogs.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mrd/export - Full legal hospital archive JSON export
router.get('/export', async (req, res) => {
  try {
    const user = req.headers['x-user'] || 'dr.thirumalai';
    if (user !== 'dr.thirumalai') {
      return res.status(403).json({
        success: false,
        error: 'Access Restricted. Only Dr. Thirumalai (MRD Administrator) is authorized to export hospital records.'
      });
    }

    const [cases, opd, lab, inventory, dispenses, audit] = await Promise.all([
      dbStore.getCases(),
      dbStore.getOpdVisits(),
      dbStore.getLabOrders(),
      dbStore.getInventory(),
      dbStore.getDispenses(),
      dbStore.getAuditLogs()
    ]);

    await dbStore.logAction('MRD_EXPORT_GENERATED', user, 'doctor', { totalRecords: cases.length });

    res.json({
      success: true,
      hospital: 'City General Medical Center - Medical Records Department',
      exportedBy: 'Dr. Thirumalai (MRD Admin)',
      exportTimestamp: new Date().toISOString(),
      dataset: {
        cases,
        opdVisits: opd,
        labOrders: lab,
        inventory,
        dispenses,
        auditLogs: audit
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mrd/audit-logs - Audit trail
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await dbStore.getAuditLogs();
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
