import { COMMON_CONDITIONS } from '../data/commonConditions.js';

// Symptom keywords to diagnosis mapping extracted from MedGuard
export const SYMPTOM_PATTERNS = [
  {
    keywords: ["chest pain", "angina", "tightness in chest", "substernal pain"],
    diagnoses: ["Angina", "Myocardial Infarction", "Acute Coronary Syndrome"]
  },
  {
    keywords: ["shortness of breath", "dyspnea", "breathless", "sob", "difficulty breathing"],
    diagnoses: ["Heart Failure", "Asthma", "COPD", "Pneumonia", "Pulmonary Embolism"]
  },
  {
    keywords: ["wheeze", "wheezing", "rhonchi"],
    diagnoses: ["Asthma", "COPD"]
  },
  {
    keywords: ["cough", "sputum", "phlegm", "productive cough"],
    diagnoses: ["Pneumonia", "Bronchitis", "COPD", "Tuberculosis"]
  },
  {
    keywords: ["fever", "chills", "rigors", "pyrexia", "high temp"],
    diagnoses: ["Infection", "Pneumonia", "Urinary Tract Infection", "Sepsis"]
  },
  {
    keywords: ["headache", "migraine", "cephalea", "throbbing head"],
    diagnoses: ["Migraine", "Tension Headache", "Hypertension"]
  },
  {
    keywords: ["dizziness", "vertigo", "lightheaded", "giddiness"],
    diagnoses: ["Hypotension", "Vertigo", "Anemia"]
  },
  {
    keywords: ["polyuria", "polydipsia", "thirsty", "frequent urination", "high blood sugar"],
    diagnoses: ["Diabetes Mellitus", "Type 2 Diabetes"]
  },
  {
    keywords: ["dysuria", "burning urination", "urinary frequency", "hematuria"],
    diagnoses: ["Urinary Tract Infection"]
  },
  {
    keywords: ["abdominal pain", "stomach pain", "epigastric pain", "belly ache"],
    diagnoses: ["Gastritis", "Peptic Ulcer Disease", "GERD", "Pancreatitis"]
  },
  {
    keywords: ["heartburn", "reflux", "acidity", "sour belching"],
    diagnoses: ["GERD", "Peptic Ulcer Disease"]
  },
  {
    keywords: ["nausea", "vomiting", "emesis"],
    diagnoses: ["Gastroenteritis", "Gastritis"]
  },
  {
    keywords: ["diarrhea", "loose stools", "watery stools"],
    diagnoses: ["Gastroenteritis", "Infection"]
  },
  {
    keywords: ["joint pain", "arthralgia", "swelling joint", "knee pain"],
    diagnoses: ["Rheumatoid Arthritis", "Osteoarthritis", "Gout"]
  },
  {
    keywords: ["seizure", "convulsion", "fits"],
    diagnoses: ["Epilepsy", "Seizure Disorder"]
  },
  {
    keywords: ["palpitation", "irregular heart", "fluttering"],
    diagnoses: ["Atrial Fibrillation", "Tachycardia"]
  },
  {
    keywords: ["edema", "swelling legs", "pedal edema", "puffy eyes"],
    diagnoses: ["Heart Failure", "Renal Failure"]
  },
  {
    keywords: ["weight loss", "fatigue", "tired", "weakness"],
    diagnoses: ["Hypothyroidism", "Diabetes Mellitus", "Anemia"]
  },
  {
    keywords: ["anxiety", "panic", "restlessness"],
    diagnoses: ["Anxiety", "Generalized Anxiety Disorder"]
  },
  {
    keywords: ["depression", "low mood", "sad", "hopelessness"],
    diagnoses: ["Depression", "Major Depressive Disorder"]
  },
  {
    keywords: ["insomnia", "unable to sleep", "sleeplessness"],
    diagnoses: ["Insomnia"]
  }
];

export function getIcdCode(diagnosis) {
  if (!diagnosis) return '';
  const dNorm = diagnosis.trim().toLowerCase();
  for (const [key, code] of Object.entries(COMMON_CONDITIONS)) {
    if (key.toLowerCase() === dNorm || key.toLowerCase().includes(dNorm) || dNorm.includes(key.toLowerCase())) {
      return code;
    }
  }
  return '';
}

export function suggestDiagnoses(complaints = '', vitals = {}) {
  const suggestions = new Set();
  const lowerText = complaints.toLowerCase();

  for (const pattern of SYMPTOM_PATTERNS) {
    if (pattern.keywords.some(kw => lowerText.includes(kw))) {
      pattern.diagnoses.forEach(d => suggestions.add(d));
    }
  }

  // Check Blood Pressure
  if (vitals.bp) {
    const match = String(vitals.bp).match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      const sbp = parseInt(match[1], 10);
      const dbp = parseInt(match[2], 10);
      if (sbp >= 140 || dbp >= 90) suggestions.add("Hypertension");
      if (sbp < 90 || dbp < 60) suggestions.add("Hypotension");
    }
  }

  // Check Heart Rate
  if (vitals.hr) {
    const hr = parseInt(vitals.hr, 10);
    if (!isNaN(hr)) {
      if (hr > 100) suggestions.add("Tachycardia");
      if (hr < 50) suggestions.add("Bradycardia");
    }
  }

  // Check SpO2
  if (vitals.spo2) {
    const spo2 = parseInt(vitals.spo2, 10);
    if (!isNaN(spo2) && spo2 < 92) {
      suggestions.add("Hypoxia");
    }
  }

  return Array.from(suggestions);
}
