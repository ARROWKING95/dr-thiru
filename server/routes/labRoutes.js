import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/lab - List all lab orders
router.get('/', async (req, res) => {
  try {
    const orders = await dbStore.getLabOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/lab - Create lab order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.patient_name) {
      return res.status(400).json({ success: false, error: 'Patient name is required' });
    }

    const saved = await dbStore.createLabOrder(orderData);
    await dbStore.logAction(
      'LAB_ORDER_CREATED',
      req.headers['x-user'] || 'dr.thirumalai',
      'doctor',
      { orderId: saved.id, patient_name: saved.patient_name, total: saved.total_cost }
    );

    res.status(201).json({ success: true, order: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
