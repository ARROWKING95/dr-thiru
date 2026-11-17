import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import { generateId } from '../lib/utils';
import {
  FlaskConical,
  Plus,
  Trash2,
  Search,
  Receipt,
  FileCheck,
  Clock
} from 'lucide-react';

const COMMON_LAB_TESTS = [
  { name: 'Complete Blood Count (CBC)', category: 'Hematology', cost: 350 },
  { name: 'Renal Function Test (RFT / BUN, Creatinine, Electrolytes)', category: 'Biochemistry', cost: 650 },
  { name: 'Liver Function Test (LFT / Bilirubin, SGOT, SGPT, ALP)', category: 'Biochemistry', cost: 750 },
  { name: 'Prothrombin Time & INR', category: 'Coagulation', cost: 400 },
  { name: 'Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)', category: 'Biochemistry', cost: 600 },
  { name: 'HbA1c Glycated Hemoglobin', category: 'Biochemistry', cost: 500 },
  { name: 'Serum Electrolytes (Na+, K+, Cl-)', category: 'Biochemistry', cost: 450 },
  { name: 'Urine Routine & Microscopy', category: 'Pathology', cost: 200 },
  { name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', cost: 400 },
  { name: 'Blood Culture & Sensitivity', category: 'Microbiology', cost: 950 }
];

function emptyLabTest() {
  return { id: generateId(), name: '', category: 'General', cost: 0 };
}

export function LabPage() {
  const [orders, setOrders] = useState([]);
  const [patientData, setPatientData] = useState({ name: '', age: '', ref: '' });
  const [tests, setTests] = useState([emptyLabTest()]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);

  const loadOrders = () => {
    setOrders(storage.getLabOrders());
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const totalCost = tests.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);

  const handleAddTest = () => {
    setTests([...tests, emptyLabTest()]);
  };

  const handleUpdateTest = (index, patch) => {
    const updated = [...tests];
    updated[index] = { ...updated[index], ...patch };
    setTests(updated);
  };

  const handleSelectPredefined = (index, testObj) => {
    handleUpdateTest(index, {
      name: testObj.name,
      category: testObj.category,
      cost: testObj.cost
    });
  };

  const handleDeleteTest = (index) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    if (!patientData.name.trim()) {
      setMessage({ type: 'error', text: 'Patient Name is required.' });
      return;
    }

    const validTests = tests.filter(t => t.name.trim());
    if (validTests.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one investigation test.' });
      return;
    }

    const order = {
      patient_name: patientData.name.trim(),
      age: patientData.age,
      patient_ref: patientData.ref.trim() || 'OPD',
      tests: validTests,
      total_cost: totalCost
    };

    storage.saveLabOrder(order);
    setMessage({ type: 'success', text: `Investigation order for ${order.patient_name} created.` });

    setPatientData({ name: '', age: '', ref: '' });
    setTests([emptyLabTest()]);
    loadOrders();
  };

  const filteredOrders = orders.filter(o =>
    `${o.patient_name} ${o.patient_ref}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Lab Investigation"
      subtitle="Investigations & Diagnostic Costing"
    >
      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${message.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* New Order Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            New Diagnostic Investigation Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveOrder} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold">Patient Name *</label>
                <Input
                  value={patientData.name}
                  onChange={e => setPatientData({ ...patientData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Age</label>
                <Input
                  type="number"
                  value={patientData.age}
                  onChange={e => setPatientData({ ...patientData, age: e.target.value })}
                  placeholder="e.g. 52"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">IP / OP Number</label>
                <Input
                  value={patientData.ref}
                  onChange={e => setPatientData({ ...patientData, ref: e.target.value })}
                  placeholder="e.g. IPD-8821 or OP-4091"
                />
              </div>
            </div>

            {/* Test Selection */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Investigation Tests</label>
                <span className="text-xs font-mono font-bold text-primary">
                  Total Cost: ₹{totalCost.toFixed(2)}
                </span>
              </div>

              {tests.map((t, idx) => (
                <div key={t.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <input
                      list={`lab-tests-${idx}`}
                      value={t.name}
                      onChange={e => {
                        const val = e.target.value;
                        const match = COMMON_LAB_TESTS.find(ct => ct.name.toLowerCase() === val.toLowerCase());
                        if (match) {
                          handleSelectPredefined(idx, match);
                        } else {
                          handleUpdateTest(idx, { name: val });
                        }
                      }}
                      placeholder="Select or type test name..."
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                    <datalist id={`lab-tests-${idx}`}>
                      {COMMON_LAB_TESTS.map(ct => (
                        <option key={ct.name} value={ct.name}>₹{ct.cost}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      value={t.category}
                      onChange={e => handleUpdateTest(idx, { category: e.target.value })}
                      placeholder="Category"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={t.cost}
                      onChange={e => handleUpdateTest(idx, { cost: e.target.value })}
                      placeholder="Cost"
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs font-mono"
                    />
                    {tests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(idx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTest}
                className="gap-1.5 text-xs h-7"
              >
                <Plus className="h-3.5 w-3.5" /> Add Test
              </Button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Tests will be dispatched to hospital diagnostic laboratory.
              </span>
              <Button type="submit" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" /> Save Lab Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lab Order History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-heading">Recent Investigation Orders</h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search lab orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredOrders.map(order => (
            <Card key={order.id} className="border-border/70 hover:shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm font-heading flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-primary" />
                      {order.patient_name}
                      <span className="text-xs font-normal text-muted-foreground">({order.patient_ref})</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Age: {order.age || '—'} · Ordered: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    ₹{order.total_cost?.toFixed(2) || '0.00'}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Ordered Tests:
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Print Lab Slip
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(order.tests || []).map((t, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-muted">
                        {t.name} (₹{t.cost})
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
