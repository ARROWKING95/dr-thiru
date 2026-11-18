import express from 'express';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();

// GET /api/inventory - List all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await dbStore.getInventory();
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory - Create inventory item
router.post('/', async (req, res) => {
  try {
    const itemData = req.body;
    if (!itemData.brand_name || !itemData.generic_name) {
      return res.status(400).json({ success: false, error: 'Brand and Generic names are required' });
    }

    const saved = await dbStore.createInventoryItem(itemData);
    await dbStore.logAction(
      'INVENTORY_ITEM_CREATED',
      req.headers['x-user'] || 'pharmacist',
      'pharmacist',
      { id: saved.id, brand_name: saved.brand_name }
    );

    res.status(201).json({ success: true, item: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/inventory/:id - Update item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const updated = await dbStore.updateInventoryItem(id, patch);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inventory/:id/adjust - Quick adjust procured quantity (+500, +50, etc.)
router.post('/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 50, action = 'procured' } = req.body;

    const items = await dbStore.getInventory();
    const item = items.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    const patch = {};
    if (action === 'procured') {
      patch.qty_procured = (item.qty_procured || 0) + Number(amount);
    } else if (action === 'issued') {
      patch.qty_issued = (item.qty_issued || 0) + Number(amount);
    }

    const updated = await dbStore.updateInventoryItem(id, patch);
    await dbStore.logAction(
      'INVENTORY_ADJUST',
      req.headers['x-user'] || 'pharmacist',
      'pharmacist',
      { id, action, amount, new_balance: (updated.qty_procured - updated.qty_issued) }
    );

    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/inventory/:id - Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbStore.deleteInventoryItem(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    await dbStore.logAction(
      'INVENTORY_DELETE',
      req.headers['x-user'] || 'pharmacist',
      'pharmacist',
      { id }
    );

    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
