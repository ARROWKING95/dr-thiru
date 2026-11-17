import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';

import { DashboardPage } from './pages/DashboardPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { IPDPage } from './pages/IPDPage';
import { OPDPage } from './pages/OPDPage';
import { MRDPage } from './pages/MRDPage';
import { LabPage } from './pages/LabPage';
import { InventoryPage } from './pages/InventoryPage';
import { PharmacyPage } from './pages/PharmacyPage';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold font-heading text-primary">404</h1>
        <p className="text-base text-muted-foreground">Oops! Page not found.</p>
        <Link
          to="/"
          className="inline-block mt-2 text-sm text-primary underline hover:text-primary/80"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HospitalProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Clinical Hospital Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute>
                  <HospitalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ipd"
              element={
                <ProtectedRoute>
                  <IPDPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opd"
              element={
                <ProtectedRoute>
                  <OPDPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mrd"
              element={
                <ProtectedRoute>
                  <MRDPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab"
              element={
                <ProtectedRoute>
                  <LabPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute>
                  <PharmacyPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
