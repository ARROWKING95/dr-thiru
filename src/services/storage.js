// Persistent Local Storage Data Store with initial demo data

const STORAGE_KEYS = {
  CURRENT_USER: 'medguard_current_user',
  CURRENT_HOSPITAL: 'medguard_current_hospital',
  HOSPITALS: 'medguard_hospitals',
  CASES: 'medguard_cases',
  OPD_VISITS: 'medguard_opd_visits',
  LAB_ORDERS: 'medguard_lab_orders',
  INVENTORY: 'medguard_inventory',
  DISPENSES: 'medguard_dispenses',
  USERS: 'medguard_users'
};

const DEFAULT_USERS = [
  {
    id: 'user_dr_thirumalai',
    username: 'dr.thirumalai',
    email: 'dr.thirumalai@hospital.org',
    first_name: 'Thirumalai',
    last_name: 'M.D.',
    profession: 'doctor',
    institution: 'City General Medical Center',
    pharmacistRegId: 'MRD-ADMIN-01',
    password: 'password123'
  },
  {
    id: 'user_pharmacist',
    username: 'pharmacist',
    email: 'pharmacist@hospital.org',
    first_name: 'Sarah',
    last_name: 'Lin',
    profession: 'pharmacist',
    institution: 'Central Clinical Pharmacy',
    pharmacistRegId: 'PHARM-8942',
    password: 'password123'
  }
];

const DEFAULT_HOSPITALS = [
  {
    id: 'hosp_1',
    name: 'City General Hospital',
    city: 'Metro Health District',
    code: 'city-general-hospital',
    is_builtin: true
  },
  {
    id: 'hosp_2',
    name: 'Master Drug Data',
    city: 'National Clinical Formulary',
    code: 'master-drug-data',
    is_builtin: true
  },
  {
    id: 'hosp_3',
    name: 'Apollo Specialty Healthcare',
    city: 'Chennai',
    code: 'apollo-specialty',
    is_builtin: false
  }
];

const DEFAULT_CASES = [
  {
    fileName: 'case_IPD-8821.json',
    patientId: 'IPD-8821',
    patientName: 'Jonathan Edwards',
    status: 'active',
    department: 'ipd',
    savedAt: new Date(Date.now() - 3600000 * 4).toLocaleString(),
    patient: {
      name: 'Jonathan Edwards',
      patientId: 'IPD-8821',
      age: 68,
      weight: 74,
      gender: 'Male',
      complaints: 'Severe chest discomfort, shortness of breath on exertion, bilateral ankle edema.',
      pastMedicalHistory: 'Hypertension, Coronary Artery Disease, Atrial Fibrillation',
      medicationHistory: 'Warfarin 5mg OD, Metoprolol 50mg BD',
      allergicHistory: 'Penicillin (urticaria / rash)',
      socialHistory: 'Non-smoker, occasional alcohol',
      physicalExam: 'Bilateral pedal edema 2+, S3 gallop present, chest clear to auscultation.',
      bp: '154/92',
      hr: '84',
      rr: '20',
      temp: '98.4',
      spo2: '94',
      labs: 'INR: 2.3, Serum Creatinine: 1.4 mg/dL, Hb: 13.2 g/dL',
      labValues: { inr: 2.3, creatinine: 1.4, hb: 13.2 },
      specialInvestigations: {},
      renalImpairment: false,
      hepaticImpairment: false,
      allergies: ['Penicillin'],
      diagnoses: ['Hypertension', 'Atrial Fibrillation', 'Heart Failure', 'Angina']
    },
    drugChart: [
      {
        id: 'dc_1',
        brandName: 'Betaloc',
        genericName: 'Metoprolol',
        dose: '100',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'BD',
        days: { 1: 'given', 2: 'given', 3: 'none', 4: 'none' },
        indication: 'Hypertension'
      },
      {
        id: 'dc_2',
        brandName: 'Coumadin',
        genericName: 'Warfarin',
        dose: '5',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'OD',
        days: { 1: 'given', 2: 'given', 3: 'none', 4: 'none' },
        indication: 'Atrial Fibrillation'
      },
      {
        id: 'dc_3',
        brandName: 'Ecosprin',
        genericName: 'Aspirin',
        dose: '150',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'OD',
        days: { 1: 'given', 2: 'given', 3: 'none', 4: 'none' },
        indication: 'Angina'
      }
    ],
    assignedPatientId: 'IPD-8821',
    procedures: [
      { id: 'pr_1', type: 'Echocardiogram', name: '2D Echo with Doppler', indication: 'Assess ejection fraction', outcome: 'EF 42%, mild MR', notes: 'Scheduled for follow-up in 3 months' }
    ],
    manualErrors: [],
    review: {
      notes: {},
      counsellingPoints: 'Counsel patient on bleeding precautions with Warfarin and Aspirin concurrent therapy. Avoid OTC NSAIDs.',
      pharmacistName: 'Dr. Thirumalai',
      signedAt: new Date(Date.now() - 3600000 * 2).toLocaleString()
    },
    summary: '68-year-old male with Atrial Fibrillation and Heart Failure on dual antiplatelet/anticoagulant therapy requiring INR and bleeding surveillance.'
  },
  {
    fileName: 'case_IPD-8842.json',
    patientId: 'IPD-8842',
    patientName: 'Maya Patel',
    status: 'active',
    department: 'ipd',
    savedAt: new Date(Date.now() - 3600000 * 12).toLocaleString(),
    patient: {
      name: 'Maya Patel',
      patientId: 'IPD-8842',
      age: 26,
      weight: 56,
      gender: 'Female',
      complaints: 'Severe epigastric pain, acid reflux, heartburn radiating to throat.',
      pastMedicalHistory: 'GERD, Peptic Ulcer Disease',
      medicationHistory: 'Antacids as needed',
      allergicHistory: 'None known',
      socialHistory: 'Non-smoker',
      physicalExam: 'Soft abdomen, epigastric tenderness on deep palpation.',
      bp: '118/76',
      hr: '72',
      rr: '16',
      temp: '98.6',
      spo2: '99',
      labs: 'H. pylori stool antigen positive',
      labValues: {},
      specialInvestigations: {},
      renalImpairment: false,
      hepaticImpairment: false,
      allergies: [],
      diagnoses: ['Peptic Ulcer Disease', 'GERD']
    },
    drugChart: [
      {
        id: 'dc_10',
        brandName: 'Pantocid',
        genericName: 'Pantoprazole',
        dose: '40',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'OD',
        days: { 1: 'given', 2: 'given', 3: 'none', 4: 'none' },
        indication: 'GERD'
      },
      {
        id: 'dc_11',
        brandName: 'Amoxil',
        genericName: 'Amoxicillin',
        dose: '1000',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'BD',
        days: { 1: 'given', 2: 'none', 3: 'none', 4: 'none' },
        indication: 'Infection'
      },
      {
        id: 'dc_12',
        brandName: 'Klaricid',
        genericName: 'Clarithromycin',
        dose: '500',
        dosageForm: 'Tablet',
        route: 'P/O',
        frequency: 'BD',
        days: { 1: 'given', 2: 'none', 3: 'none', 4: 'none' },
        indication: 'Infection'
      }
    ],
    assignedPatientId: 'IPD-8842',
    procedures: [],
    manualErrors: [],
    review: {
      notes: {},
      counsellingPoints: 'Complete full 14-day H. pylori eradication course without skipping doses.',
      pharmacistName: 'Dr. Thirumalai',
      signedAt: ''
    },
    summary: '26-year-old female admitted with acute Peptic Ulcer Disease receiving triple therapy eradication.'
  }
];

const DEFAULT_OPD_VISITS = [
  {
    id: 'opd_1',
    op_number: 'OP-4091',
    patient_name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    complaints: 'Routine follow up for diabetes, mild lethargy in mornings.',
    vitals: { bp: '130/84', hr: '76', temp: '98.2', spo2: '98' },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    medications: [
      { id: 'm_1', drug: 'Metformin', dose: '500 mg', route: 'P/O', frequency: 'BD', duration: '30 days', instructions: 'After food' },
      { id: 'm_2', drug: 'Pantoprazole', dose: '40 mg', route: 'P/O', frequency: 'OD', duration: '15 days', instructions: 'Before breakfast' }
    ]
  },
  {
    id: 'opd_2',
    op_number: 'OP-4092',
    patient_name: 'Emily Watson',
    age: 32,
    gender: 'Female',
    complaints: 'Unilateral throbbing headache with nausea and photophobia.',
    vitals: { bp: '116/74', hr: '70', temp: '98.6', spo2: '99' },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    medications: [
      { id: 'm_3', drug: 'Sumatriptan', dose: '50 mg', route: 'P/O', frequency: 'SOS', duration: '5 days', instructions: 'Take at onset of migraine headache' },
      { id: 'm_4', drug: 'Paracetamol', dose: '650 mg', route: 'P/O', frequency: 'TDS', duration: '3 days', instructions: 'For pain SOS' }
    ]
  }
];

const DEFAULT_LAB_ORDERS = [
  {
    id: 'lab_1',
    patient_name: 'Jonathan Edwards',
    patient_ref: 'IPD-8821',
    age: '68',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    tests: [
      { id: 't_1', name: 'Complete Blood Count (CBC)', category: 'Hematology', cost: 350 },
      { id: 't_2', name: 'Renal Function Test (RFT)', category: 'Biochemistry', cost: 650 },
      { id: 't_3', name: 'Prothrombin Time / INR', category: 'Coagulation', cost: 400 }
    ],
    total_cost: 1400
  },
  {
    id: 'lab_2',
    patient_name: 'Maya Patel',
    patient_ref: 'IPD-8842',
    age: '26',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    tests: [
      { id: 't_4', name: 'H. pylori Stool Antigen Test', category: 'Microbiology', cost: 850 },
      { id: 't_5', name: 'Upper GI Endoscopy Biopsy Path', category: 'Histopathology', cost: 1200 }
    ],
    total_cost: 2050
  }
];

const DEFAULT_INVENTORY = [
  {
    id: 'inv_1',
    brand_name: 'Betaloc',
    generic_name: 'Metoprolol',
    strength: '50 mg',
    form: 'Tablet',
    unit_cost: 4.5,
    qty_procured: 5000,
    qty_issued: 1200
  },
  {
    id: 'inv_2',
    brand_name: 'Pantocid',
    generic_name: 'Pantoprazole',
    strength: '40 mg',
    form: 'Tablet',
    unit_cost: 8.0,
    qty_procured: 10000,
    qty_issued: 3400
  },
  {
    id: 'inv_3',
    brand_name: 'Augmentin',
    generic_name: 'Amoxicillin + Clavulanate',
    strength: '625 mg',
    form: 'Tablet',
    unit_cost: 22.0,
    qty_procured: 4000,
    qty_issued: 2100
  },
  {
    id: 'inv_4',
    brand_name: 'Coumadin',
    generic_name: 'Warfarin',
    strength: '5 mg',
    form: 'Tablet',
    unit_cost: 3.2,
    qty_procured: 3000,
    qty_issued: 850
  },
  {
    id: 'inv_5',
    brand_name: 'Ecosprin',
    generic_name: 'Aspirin',
    strength: '75 mg',
    form: 'Tablet',
    unit_cost: 1.5,
    qty_procured: 15000,
    qty_issued: 6200
  },
  {
    id: 'inv_6',
    brand_name: 'Ciprogit',
    generic_name: 'Ciprofloxacin',
    strength: '500 mg',
    form: 'Tablet',
    unit_cost: 6.5,
    qty_procured: 2500,
    qty_issued: 1900
  },
  {
    id: 'inv_7',
    brand_name: 'Lasix',
    generic_name: 'Furosemide',
    strength: '40 mg',
    form: 'Tablet',
    unit_cost: 2.8,
    qty_procured: 8000,
    qty_issued: 3100
  }
];

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(DEFAULT_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(DEFAULT_CASES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OPD_VISITS)) {
      localStorage.setItem(STORAGE_KEYS.OPD_VISITS, JSON.stringify(DEFAULT_OPD_VISITS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAB_ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.LAB_ORDERS, JSON.stringify(DEFAULT_LAB_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISPENSES)) {
      localStorage.setItem(STORAGE_KEYS.DISPENSES, JSON.stringify([]));
    }
  }

  // --- Auth & Users ---
  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return DEFAULT_USERS[0]; // Auto sign-in as Dr. Thirumalai
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  // --- Hospitals ---
  getHospitals() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOSPITALS) || '[]');
  }

  saveHospital(hosp) {
    const list = this.getHospitals();
    list.push(hosp);
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(list));
    return hosp;
  }

  getCurrentHospital() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_HOSPITAL);
    const list = this.getHospitals();
    if (raw) {
      const found = list.find(h => h.id === raw);
      if (found) return found;
    }
    return list[0] || DEFAULT_HOSPITALS[0];
  }

  setCurrentHospital(hospital) {
    if (!hospital) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_HOSPITAL);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_HOSPITAL, hospital.id);
    }
  }

  // --- Cases (IPD & Discharged MRD) ---
  getCases() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
  }

  saveCase(caseData) {
    const cases = this.getCases();
    const idx = cases.findIndex(c => c.patientId === caseData.patientId);
    if (idx >= 0) {
      cases[idx] = { ...cases[idx], ...caseData, savedAt: new Date().toLocaleString() };
    } else {
      cases.unshift({ ...caseData, savedAt: new Date().toLocaleString() });
    }
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    return caseData;
  }

  dischargeCase(patientId, dischargeDetails = {}) {
    const cases = this.getCases();
    const target = cases.find(c => c.patientId === patientId);
    if (target) {
      target.status = 'discharged';
      target.dischargedAt = new Date().toISOString();
      target.discharge = dischargeDetails;
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  }

  // --- OPD Visits ---
  getOpdVisits() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.OPD_VISITS) || '[]');
  }

  saveOpdVisit(visit) {
    const visits = this.getOpdVisits();
    const newVisit = {
      ...visit,
      id: 'opd_' + Date.now(),
      created_at: new Date().toISOString()
    };
    visits.unshift(newVisit);
    localStorage.setItem(STORAGE_KEYS.OPD_VISITS, JSON.stringify(visits));
    return newVisit;
  }

  updateOpdMedication(visitId, medicationId, patch) {
    const visits = this.getOpdVisits();
    const visit = visits.find(v => v.id === visitId);
    if (visit && visit.medications) {
      const med = visit.medications.find(m => m.id === medicationId);
      if (med) {
        Object.assign(med, patch);
        localStorage.setItem(STORAGE_KEYS.OPD_VISITS, JSON.stringify(visits));
      }
    }
  }

  // --- Lab Orders ---
  getLabOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LAB_ORDERS) || '[]');
  }

  saveLabOrder(order) {
    const orders = this.getLabOrders();
    const newOrder = {
      ...order,
      id: 'lab_' + Date.now(),
      created_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.LAB_ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  // --- Inventory ---
  getInventory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
  }

  saveInventoryItem(item) {
    const inv = this.getInventory();
    const newItem = {
      ...item,
      id: 'inv_' + Date.now()
    };
    inv.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
    return newItem;
  }

  updateInventoryItem(id, patch) {
    const inv = this.getInventory();
    const item = inv.find(i => i.id === id);
    if (item) {
      Object.assign(item, patch);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
    }
  }

  deleteInventoryItem(id) {
    const inv = this.getInventory().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
  }

  // --- Pharmacy Dispenses ---
  getDispenses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISPENSES) || '[]');
  }

  recordDispense(dispense) {
    const dispenses = this.getDispenses();
    dispenses.unshift({
      ...dispense,
      id: 'disp_' + Date.now(),
      dispensed_at: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.DISPENSES, JSON.stringify(dispenses));
  }
}

export const storage = new StorageService();
