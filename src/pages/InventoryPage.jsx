import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import {
  Package,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  TrendingUp,
  Boxes,
  DollarSign
} from 'lucide-react';

export function InventoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    brand: '',
    generic: '',
    strength: '',
    form: 'Tablet',
    cost: '',
    procured: '',
    issued: '0'
  });
  const [message, setMessage] = useState(null);

  const loadInventory = () => {
    setItems(storage.getInventory());
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const totalValuation = items.reduce((sum, item) => {
    const balance = (Number(item.qty_procured) || 0) - (Number(item.qty_issued) || 0);
    return sum + (balance > 0 ? balance * (Number(item.unit_cost) || 0) : 0);
  }, 0);

  const totalProcuredUnits = items.reduce((sum, i) => sum + (Number(i.qty_procured) || 0), 0);
  const totalIssuedUnits = items.reduce((sum, i) => sum + (Number(i.qty_issued) || 0), 0);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!formData.generic.trim()) {
      setMessage({ type: 'error', text: 'Generic name is required.' });
      return;
    }

    const newItem = {
      brand_name: formData.brand.trim() || formData.generic.trim(),
      generic_name: formData.generic.trim(),
      strength: formData.strength.trim(),
      form: formData.form,
      unit_cost: Number(formData.cost) || 0,
      qty_procured: Number(formData.procured) || 0,
      qty_issued: Number(formData.issued) || 0
    };

    storage.saveInventoryItem(newItem);
    setMessage({ type: 'success', text: `Item "${newItem.brand_name}" added to stock.` });

    setFormData({
      brand: '',
      generic: '',
      strength: '',
      form: 'Tablet',
      cost: '',
      procured: '',
      issued: '0'
    });
    loadInventory();
  };

  const handleUpdateQty = (item, field, delta) => {
    const newVal = Math.max(0, (Number(item[field]) || 0) + delta);
    storage.updateInventoryItem(item.id, { [field]: newVal });
    loadInventory();
  };

  const handleDelete = (id) => {
    storage.deleteInventoryItem(id);
    loadInventory();
  };

  const filteredItems = items.filter(i =>
    `${i.brand_name} ${i.generic_name} ${i.strength}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Pharmacy Inventory"
      subtitle="Hospital Pharmacy Stock, Procurement & Issue Monitoring"
    >
      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-primary" /> Total SKUs
          </p>
          <p className="text-xl font-bold font-heading">{items.length} Medicines</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Stock Valuation
          </p>
          <p className="text-xl font-bold font-heading text-emerald-600">
            ₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-blue-600" /> Total Units Procured
          </p>
          <p className="text-xl font-bold font-heading">{totalProcuredUnits.toLocaleString()}</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Total Units Dispensed
          </p>
          <p className="text-xl font-bold font-heading text-warning">{totalIssuedUnits.toLocaleString()}</p>
        </Card>
      </div>

      {/* Add Stock Item */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Add Pharmacy Stock Item
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-semibold">Generic Name *</label>
                <Input
                  value={formData.generic}
                  onChange={e => setFormData({ ...formData, generic: e.target.value })}
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Brand / Trade Name</label>
                <Input
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Calpol"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Strength</label>
                <Input
                  value={formData.strength}
                  onChange={e => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g. 500 mg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Form</label>
                <select
                  value={formData.form}
                  onChange={e => setFormData({ ...formData, form: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Injection">Injection</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Ointment">Ointment</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold">Unit Cost (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="e.g. 3.50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Quantity Procured</label>
                <Input
                  type="number"
                  value={formData.procured}
                  onChange={e => setFormData({ ...formData, procured: e.target.value })}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Quantity Issued</label>
                <Input
                  type="number"
                  value={formData.issued}
                  onChange={e => setFormData({ ...formData, issued: e.target.value })}
                  placeholder="e.g. 0"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Item to Stock
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Inventory Stock Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Stock Ledger & Balance</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search stock..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">Medicine</th>
                  <th className="p-3 font-semibold">Strength / Form</th>
                  <th className="p-3 font-semibold text-right">Unit Cost</th>
                  <th className="p-3 font-semibold text-center">Procured</th>
                  <th className="p-3 font-semibold text-center">Issued</th>
                  <th className="p-3 font-semibold text-center">Balance Stock</th>
                  <th className="p-3 font-semibold text-right">Total Value</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredItems.map(item => {
                  const balance = (Number(item.qty_procured) || 0) - (Number(item.qty_issued) || 0);
                  const isLow = balance < 1000;
                  const itemValue = balance * (Number(item.unit_cost) || 0);

                  return (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{item.brand_name}</div>
                        <div className="text-[11px] text-muted-foreground">{item.generic_name}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.strength} · {item.form}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ₹{(Number(item.unit_cost) || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-mono">
                        <div className="inline-flex items-center gap-1">
                          <span>{item.qty_procured}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item, 'qty_procured', 500)}
                            className="text-[10px] px-1 py-0.5 rounded bg-muted hover:bg-primary/20 text-primary"
                            title="Add +500 units"
                          >
                            +500
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <div className="inline-flex items-center gap-1">
                          <span>{item.qty_issued}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item, 'qty_issued', 50)}
                            className="text-[10px] px-1 py-0.5 rounded bg-muted hover:bg-warning/20 text-warning"
                            title="Dispense +50 units"
                          >
                            +50
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {balance}
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        ₹{itemValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={isLow ? 'destructive' : 'success'} className="text-[10px]">
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
