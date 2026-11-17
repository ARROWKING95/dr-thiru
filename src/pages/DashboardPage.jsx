import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/input';
import { storage } from '../services/storage';
import { runErrorDetection } from '../services/errorDetection';
import {
  Bed,
  ClipboardList,
  Archive,
  FlaskConical,
  Package,
  Pill,
  Hospital,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';

const MODULES = [
  {
    key: 'ipd',
    to: '/ipd',
    label: 'Inpatient Department',
    desc: 'Admitted cases & real-time error-detection clinical case forms',
    icon: Bed,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  {
    key: 'opd',
    to: '/opd',
    label: 'Outpatient Department',
    desc: 'OP visits, clinical prescriptions, duplicate check & dispensing',
    icon: ClipboardList,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  {
    key: 'mrd',
    to: '/mrd',
    label: 'MRD',
    desc: 'Medical records archive — restricted to dr.thirumalai',
    icon: Archive,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    requiresAdmin: true
  },
  {
    key: 'lab',
    to: '/lab',
    label: 'Lab Investigation',
    desc: 'Diagnostic investigations ordered per patient with costing & bill',
    icon: FlaskConical,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  {
    key: 'inventory',
    to: '/inventory',
    label: 'Inventory',
    desc: 'Hospital pharmacy stock, procurement, issue & balance monitoring',
    icon: Package,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  },
  {
    key: 'pharmacy',
    to: '/pharmacy',
    label: 'Pharmacy',
    desc: 'Find IPD discharge and OPD prescriptions for dispensing & safety',
    icon: Pill,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10'
  }
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, isMrdAdmin } = useAuth();
  const { hospital, loading: hospitalLoading } = useHospital();
  const [stats, setStats] = useState({
    admittedCases: 0,
    activeErrors: 0,
    opdVisits: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    if (!hospitalLoading && !hospital) {
      navigate('/hospitals', { replace: true });
      return;
    }

    const cases = storage.getCases().filter(c => c.status !== 'discharged');
    let totalErrors = 0;
    cases.forEach(c => {
      const errs = runErrorDetection(c.patient || {}, c.drugChart || [], c.assignedPatientId);
      totalErrors += errs.length;
    });

    const opd = storage.getOpdVisits();
    const inventory = storage.getInventory();
    const lowStock = inventory.filter(i => (i.qty_procured - i.qty_issued) < 1500).length;

    setStats({
      admittedCases: cases.length,
      activeErrors: totalErrors,
      opdVisits: opd.length,
      lowStockItems: lowStock
    });
  }, [hospital, hospitalLoading, navigate]);

  const visibleModules = MODULES.filter(m => !m.requiresAdmin || isMrdAdmin);

  return (
    <AppLayout
      title={hospital?.name ?? 'MedGuard'}
      subtitle="Hospital Modules & Error Detection"
    >
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-muted/40 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading tracking-tight">
              Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose a department to continue. Drug database in use:{' '}
              <span className="font-semibold text-foreground">
                {hospital?.name ?? '—'}
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospitals')}
              className="gap-2 bg-background hover:bg-muted"
            >
              <Hospital className="h-4 w-4 text-primary" />
              Change hospital
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/ipd')}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Open IPD
            </Button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Bed className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admitted IPD</p>
              <p className="text-base font-bold font-heading">{stats.admittedCases} Cases</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
              <p className="text-base font-bold font-heading text-destructive">
                {stats.activeErrors} Detected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">OPD Visits</p>
              <p className="text-base font-bold font-heading">{stats.opdVisits} Recorded</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Alert</p>
              <p className="text-base font-bold font-heading">{stats.lowStockItems} Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-heading">Clinical Modules</h3>
          <span className="text-xs text-muted-foreground">
            {visibleModules.length} Modules available
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map(module => {
            const Icon = module.icon;
            return (
              <Card
                key={module.key}
                onClick={() => navigate(module.to)}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group border-border/80"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl ${module.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-base font-heading group-hover:text-primary transition-colors flex items-center gap-2">
                      {module.label}
                      {module.key === 'mrd' && (
                        <Badge variant="outline" className="text-[10px] py-0 font-normal">
                          Admin
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {module.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
