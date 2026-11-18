// MedGuard MERN REST API Client Service

const BASE_URL = '/api';

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem('medguard_current_user') || '{}');
  return {
    'Content-Type': 'application/json',
    'x-user': user.username || 'dr.thirumalai'
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }
  return await res.json();
};

export const api = {
  // System Health
  async health() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return await handleResponse(res);
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  // Auth & Users
  auth: {
    async getUsers() {
      const res = await fetch(`${BASE_URL}/auth/users`);
      return await handleResponse(res);
    },
    async login(username, password) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await handleResponse(res);
    },
    async register(userData) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await handleResponse(res);
    },
    async getMe() {
      const res = await fetch(`${BASE_URL}/auth/me`);
      return await handleResponse(res);
    }
  },

  // Clinical Cases (IPD & Discharged)
  cases: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE_URL}/cases${query ? `?${query}` : ''}`);
      return await handleResponse(res);
    },
    async getByPatientId(patientId) {
      const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(patientId)}`);
      return await handleResponse(res);
    },
    async save(caseData) {
      const res = await fetch(`${BASE_URL}/cases`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(caseData)
      });
      return await handleResponse(res);
    },
    async discharge(patientId, dischargeDetails = {}) {
      const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(patientId)}/discharge`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dischargeDetails)
      });
      return await handleResponse(res);
    },
    async delete(patientId) {
      const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(patientId)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  // OPD Visits
  opd: {
    async getAll() {
      const res = await fetch(`${BASE_URL}/opd`);
      return await handleResponse(res);
    },
    async save(visitData) {
      const res = await fetch(`${BASE_URL}/opd`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(visitData)
      });
      return await handleResponse(res);
    },
    async patchMedication(visitId, medId, patch) {
      const res = await fetch(`${BASE_URL}/opd/${encodeURIComponent(visitId)}/medications/${encodeURIComponent(medId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(patch)
      });
      return await handleResponse(res);
    }
  },

  // Lab Orders
  lab: {
    async getAll() {
      const res = await fetch(`${BASE_URL}/lab`);
      return await handleResponse(res);
    },
    async save(orderData) {
      const res = await fetch(`${BASE_URL}/lab`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData)
      });
      return await handleResponse(res);
    }
  },

  // Inventory
  inventory: {
    async getAll() {
      const res = await fetch(`${BASE_URL}/inventory`);
      return await handleResponse(res);
    },
    async save(itemData) {
      const res = await fetch(`${BASE_URL}/inventory`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(itemData)
      });
      return await handleResponse(res);
    },
    async update(id, patch) {
      const res = await fetch(`${BASE_URL}/inventory/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(patch)
      });
      return await handleResponse(res);
    },
    async adjust(id, amount, action = 'procured') {
      const res = await fetch(`${BASE_URL}/inventory/${encodeURIComponent(id)}/adjust`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, action })
      });
      return await handleResponse(res);
    },
    async delete(id) {
      const res = await fetch(`${BASE_URL}/inventory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  // Pharmacy Dispenses
  pharmacy: {
    async getDispenses() {
      const res = await fetch(`${BASE_URL}/pharmacy/dispenses`);
      return await handleResponse(res);
    },
    async dispense(dispenseData) {
      const res = await fetch(`${BASE_URL}/pharmacy/dispense`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dispenseData)
      });
      return await handleResponse(res);
    },
    async dispenseAll(items) {
      const res = await fetch(`${BASE_URL}/pharmacy/dispense-all`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items })
      });
      return await handleResponse(res);
    }
  },

  // Hospitals & Formularies
  hospitals: {
    async getAll() {
      const res = await fetch(`${BASE_URL}/hospitals`);
      return await handleResponse(res);
    },
    async save(hospData) {
      const res = await fetch(`${BASE_URL}/hospitals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(hospData)
      });
      return await handleResponse(res);
    }
  },

  // Clinical AI & Rules Engine
  clinical: {
    async checkErrors(payload) {
      const res = await fetch(`${BASE_URL}/clinical/check-errors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    },
    async suggestDiagnosis(complaints, vitals) {
      const res = await fetch(`${BASE_URL}/clinical/suggest-diagnosis`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ complaints, vitals })
      });
      return await handleResponse(res);
    }
  },

  // MRD Department
  mrd: {
    async getStats() {
      const res = await fetch(`${BASE_URL}/mrd/stats`, {
        headers: getHeaders()
      });
      return await handleResponse(res);
    },
    async exportArchive() {
      const res = await fetch(`${BASE_URL}/mrd/export`, {
        headers: getHeaders()
      });
      return await handleResponse(res);
    },
    async getAuditLogs() {
      const res = await fetch(`${BASE_URL}/mrd/audit-logs`, {
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  }
};
