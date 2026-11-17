import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

const HospitalContext = createContext(null);

export function HospitalProvider({ children }) {
  const [hospitals, setHospitals] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const list = storage.getHospitals();
    setHospitals(list);
    const curr = storage.getCurrentHospital();
    setHospital(curr);
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const selectHospital = useCallback((hosp) => {
    storage.setCurrentHospital(hosp);
    setHospital(hosp);
  }, []);

  const addHospital = useCallback((newHosp) => {
    const created = storage.saveHospital({
      id: 'hosp_' + Date.now(),
      ...newHosp
    });
    refresh();
    return created;
  }, [refresh]);

  return (
    <HospitalContext.Provider
      value={{
        hospitals,
        hospital,
        loading,
        selectHospital,
        addHospital,
        refresh
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) throw new Error('useHospital must be used within a HospitalProvider');
  return context;
}
