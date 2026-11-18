import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Case } from '../models/Case.js';
import { OpdVisit } from '../models/OpdVisit.js';
import { LabOrder } from '../models/LabOrder.js';
import { Inventory } from '../models/Inventory.js';
import { Dispense } from '../models/Dispense.js';
import { Hospital } from '../models/Hospital.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  DEFAULT_USERS,
  DEFAULT_HOSPITALS,
  DEFAULT_CASES,
  DEFAULT_OPD_VISITS,
  DEFAULT_LAB_ORDERS,
  DEFAULT_INVENTORY
} from '../data/initialData.js';

// In-Memory Fallback Cache
const memoryStore = {
  users: [...DEFAULT_USERS],
  hospitals: [...DEFAULT_HOSPITALS],
  cases: [...DEFAULT_CASES],
  opdVisits: [...DEFAULT_OPD_VISITS],
  labOrders: [...DEFAULT_LAB_ORDERS],
  inventory: [...DEFAULT_INVENTORY],
  dispenses: [],
  auditLogs: []
};

const isMongoActive = () => mongoose.connection.readyState === 1;

export const dbStore = {
  // --- Seed Database ---
  async seedIfEmpty() {
    if (!isMongoActive()) return;

    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.insertMany(DEFAULT_USERS);
        console.log('[MongoDB Seeder] Inserted default users');
      }

      const hospCount = await Hospital.countDocuments();
      if (hospCount === 0) {
        await Hospital.insertMany(DEFAULT_HOSPITALS);
        console.log('[MongoDB Seeder] Inserted default hospitals');
      }

      const caseCount = await Case.countDocuments();
      if (caseCount === 0) {
        await Case.insertMany(DEFAULT_CASES);
        console.log('[MongoDB Seeder] Inserted default clinical cases');
      }

      const opdCount = await OpdVisit.countDocuments();
      if (opdCount === 0) {
        await OpdVisit.insertMany(DEFAULT_OPD_VISITS);
        console.log('[MongoDB Seeder] Inserted default OPD visits');
      }

      const labCount = await LabOrder.countDocuments();
      if (labCount === 0) {
        await LabOrder.insertMany(DEFAULT_LAB_ORDERS);
        console.log('[MongoDB Seeder] Inserted default Lab orders');
      }

      const invCount = await Inventory.countDocuments();
      if (invCount === 0) {
        await Inventory.insertMany(DEFAULT_INVENTORY);
        console.log('[MongoDB Seeder] Inserted default inventory stock');
      }
    } catch (err) {
      console.error('[MongoDB Seeder] Error during seed:', err.message);
    }
  },

  // --- Users & Auth ---
  async getUsers() {
    if (isMongoActive()) {
      return await User.find().lean();
    }
    return memoryStore.users;
  },

  async findUser(username) {
    if (isMongoActive()) {
      return await User.findOne({ username }).lean();
    }
    return memoryStore.users.find(u => u.username === username);
  },

  async createUser(userData) {
    if (isMongoActive()) {
      const doc = new User(userData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.users.push(userData);
    return userData;
  },

  // --- Cases (IPD & MRD) ---
  async getCases(filter = {}) {
    if (isMongoActive()) {
      return await Case.find(filter).sort({ updatedAt: -1 }).lean();
    }
    return memoryStore.cases.filter(c => {
      if (filter.status && c.status !== filter.status) return false;
      if (filter.department && c.department !== filter.department) return false;
      return true;
    });
  },

  async getCaseByPatientId(patientId) {
    if (isMongoActive()) {
      return await Case.findOne({ patientId }).lean();
    }
    return memoryStore.cases.find(c => c.patientId === patientId);
  },

  async upsertCase(caseData) {
    caseData.savedAt = new Date().toLocaleString();
    if (isMongoActive()) {
      return await Case.findOneAndUpdate(
        { patientId: caseData.patientId },
        caseData,
        { returnDocument: 'after', upsert: true }
      ).lean();
    }
    const idx = memoryStore.cases.findIndex(c => c.patientId === caseData.patientId);
    if (idx >= 0) {
      memoryStore.cases[idx] = { ...memoryStore.cases[idx], ...caseData };
      return memoryStore.cases[idx];
    }
    memoryStore.cases.unshift(caseData);
    return caseData;
  },

  async dischargeCase(patientId, dischargeDetails = {}) {
    const patch = {
      status: 'discharged',
      dischargedAt: new Date().toISOString(),
      discharge: dischargeDetails
    };
    if (isMongoActive()) {
      return await Case.findOneAndUpdate({ patientId }, patch, { returnDocument: 'after' }).lean();
    }
    const target = memoryStore.cases.find(c => c.patientId === patientId);
    if (target) {
      Object.assign(target, patch);
      return target;
    }
    return null;
  },

  async deleteCase(patientId) {
    if (isMongoActive()) {
      return await Case.findOneAndDelete({ patientId });
    }
    const idx = memoryStore.cases.findIndex(c => c.patientId === patientId);
    if (idx >= 0) {
      return memoryStore.cases.splice(idx, 1)[0];
    }
    return null;
  },

  // --- OPD Visits ---
  async getOpdVisits() {
    if (isMongoActive()) {
      return await OpdVisit.find().sort({ createdAt: -1 }).lean();
    }
    return memoryStore.opdVisits;
  },

  async createOpdVisit(visitData) {
    const docData = {
      ...visitData,
      id: visitData.id || `opd_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isMongoActive()) {
      const doc = new OpdVisit(docData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.opdVisits.unshift(docData);
    return docData;
  },

  async patchOpdMedication(visitId, medicationId, patch) {
    if (isMongoActive()) {
      const visit = await OpdVisit.findOne({ id: visitId });
      if (visit && visit.medications) {
        const med = visit.medications.find(m => m.id === medicationId);
        if (med) {
          Object.assign(med, patch);
          await visit.save();
          return visit.toObject();
        }
      }
      return null;
    }
    const visit = memoryStore.opdVisits.find(v => v.id === visitId);
    if (visit && visit.medications) {
      const med = visit.medications.find(m => m.id === medicationId);
      if (med) {
        Object.assign(med, patch);
        return visit;
      }
    }
    return null;
  },

  // --- Lab Orders ---
  async getLabOrders() {
    if (isMongoActive()) {
      return await LabOrder.find().sort({ createdAt: -1 }).lean();
    }
    return memoryStore.labOrders;
  },

  async createLabOrder(orderData) {
    const docData = {
      ...orderData,
      id: orderData.id || `lab_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    if (isMongoActive()) {
      const doc = new LabOrder(docData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.labOrders.unshift(docData);
    return docData;
  },

  // --- Inventory ---
  async getInventory() {
    if (isMongoActive()) {
      return await Inventory.find().lean();
    }
    return memoryStore.inventory;
  },

  async createInventoryItem(itemData) {
    const docData = {
      ...itemData,
      id: itemData.id || `inv_${Date.now()}`
    };
    if (isMongoActive()) {
      const doc = new Inventory(docData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.inventory.unshift(docData);
    return docData;
  },

  async updateInventoryItem(id, patch) {
    if (isMongoActive()) {
      return await Inventory.findOneAndUpdate({ id }, patch, { returnDocument: 'after' }).lean();
    }
    const item = memoryStore.inventory.find(i => i.id === id);
    if (item) {
      Object.assign(item, patch);
      return item;
    }
    return null;
  },

  async deleteInventoryItem(id) {
    if (isMongoActive()) {
      return await Inventory.findOneAndDelete({ id });
    }
    const idx = memoryStore.inventory.findIndex(i => i.id === id);
    if (idx >= 0) {
      return memoryStore.inventory.splice(idx, 1)[0];
    }
    return null;
  },

  // --- Dispenses (Pharmacy) ---
  async getDispenses() {
    if (isMongoActive()) {
      return await Dispense.find().sort({ createdAt: -1 }).lean();
    }
    return memoryStore.dispenses;
  },

  async recordDispense(dispenseData) {
    const docData = {
      ...dispenseData,
      id: `disp_${Date.now()}`,
      dispensed_at: new Date().toISOString()
    };
    if (isMongoActive()) {
      const doc = new Dispense(docData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.dispenses.unshift(docData);
    return docData;
  },

  // --- Hospitals ---
  async getHospitals() {
    if (isMongoActive()) {
      return await Hospital.find().lean();
    }
    return memoryStore.hospitals;
  },

  async createHospital(hospData) {
    if (isMongoActive()) {
      const doc = new Hospital(hospData);
      await doc.save();
      return doc.toObject();
    }
    memoryStore.hospitals.push(hospData);
    return hospData;
  },

  // --- Audit Logs ---
  async logAction(action, user, role, details) {
    const entry = {
      action,
      user: user || 'dr.thirumalai',
      role: role || 'doctor',
      details,
      timestamp: new Date().toISOString()
    };
    if (isMongoActive()) {
      try {
        const doc = new AuditLog(entry);
        await doc.save();
        return doc.toObject();
      } catch (e) {
        // Silent fail for log
      }
    }
    memoryStore.auditLogs.unshift(entry);
    return entry;
  },

  async getAuditLogs() {
    if (isMongoActive()) {
      return await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    }
    return memoryStore.auditLogs.slice(0, 100);
  }
};
