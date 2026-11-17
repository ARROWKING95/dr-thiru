import { DRUG_DATABASE } from '../data/drugs.js';
import { CRITICAL_INTERACTIONS } from '../data/criticalInteractions.js';
import { DRUG_INTERACTIONS } from '../data/drugInteractions.js';
import { MASTER_HOSPITAL_DRUGS } from '../data/masterHospitalDrugs.js';
import { MASTER_HOSPITAL_INTERACTIONS } from '../data/masterHospitalInteractions.js';
import { COMMON_CONDITIONS } from '../data/commonConditions.js';
import { generateId } from '../lib/utils.js';

// Helper to normalize drug names by removing dosage forms
export function normalizeDrugName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\b(tab|tablet|tablets|cap|capsule|capsules|inj|injection|injections|syp|syrup|susp|suspension|cream|ointment|drops|iv|im|oral|solution|infusion|patch|gel)\b/gi, '')
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Frequency multipliers to calculate total daily dose
export const FREQUENCY_MULTIPLIERS = {
  OD: 1,
  BD: 2,
  BID: 2,
  TDS: 3,
  TID: 3,
  QID: 4,
  SOS: 1,
  STAT: 1,
  HS: 1,
  Q4H: 6,
  Q6H: 4,
  Q8H: 3,
  Q12H: 2,
  WEEKLY: 1 / 7
};

export function calculateDailyDose(dose, frequency) {
  if (!dose || isNaN(Number(dose))) return 0;
  const numDose = Number(dose);
  const freqKey = (frequency || 'OD').toUpperCase().trim();
  const mult = FREQUENCY_MULTIPLIERS[freqKey] || 1;
  return numDose * mult;
}

// Build index lookup maps
const drugMap = new Map();
DRUG_DATABASE.forEach(drug => {
  drugMap.set(drug.name.toLowerCase(), drug);
  if (drug.genericName) drugMap.set(drug.genericName.toLowerCase(), drug);
});

// Lookup drug in database
export function findDrug(name) {
  if (!name) return null;
  const norm = normalizeDrugName(name);
  if (drugMap.has(norm)) return drugMap.get(norm);
  
  // Try substring / prefix matches
  for (const [key, drug] of drugMap.entries()) {
    if (key === norm || norm.includes(key) || key.includes(norm)) {
      return drug;
    }
  }
  return null;
}

// Transcribing check: Levenshtein distance and known LASA misspellings
export function checkTranscribingError(name) {
  if (!name || name.length < 3) return null;
  const norm = normalizeDrugName(name);

  // Check known common misspellings
  for (const drug of DRUG_DATABASE) {
    if (drug.commonMisspellings) {
      for (const m of drug.commonMisspellings) {
        if (normalizeDrugName(m) === norm) {
          return drug;
        }
      }
    }
  }

  // Check 1-char edits (Levenshtein distance <= 1)
  const isClose = (s1, s2) => {
    if (Math.abs(s1.length - s2.length) > 1) return false;
    let i = 0, j = 0, diffs = 0;
    while (i < s1.length && j < s2.length) {
      if (s1[i] === s2[j]) {
        i++; j++;
      } else {
        diffs++;
        if (diffs > 1) return false;
        if (s1.length > s2.length) i++;
        else if (s2.length > s1.length) j++;
        else { i++; j++; }
      }
    }
    return diffs + (s1.length - i) + (s2.length - j) <= 1;
  };

  for (const drug of DRUG_DATABASE) {
    const dName = normalizeDrugName(drug.name);
    if (isClose(norm, dName)) return drug;
    if (drug.genericName && isClose(norm, normalizeDrugName(drug.genericName))) return drug;
  }

  return null;
}

// Find drug-drug interactions
export function checkDrugInteractions(medicationNames) {
  const normList = medicationNames.map(n => ({ raw: n, norm: normalizeDrugName(n) })).filter(m => m.norm);
  if (normList.length < 2) return [];

  const allInteractions = [
    ...CRITICAL_INTERACTIONS,
    ...DRUG_INTERACTIONS,
    ...(MASTER_HOSPITAL_INTERACTIONS || []).filter(i => i.kind === 'drug')
  ];

  const results = [];
  const seen = new Set();

  for (let i = 0; i < normList.length; i++) {
    for (let j = i + 1; j < normList.length; j++) {
      const a = normList[i];
      const b = normList[j];

      for (const rule of allInteractions) {
        const drugA = (rule.drug1 || rule.a || '').toLowerCase();
        const drugB = (rule.drug2 || rule.b || '').toLowerCase();

        const match1 = (a.norm.includes(drugA) || drugA.includes(a.norm)) && (b.norm.includes(drugB) || drugB.includes(b.norm));
        const match2 = (a.norm.includes(drugB) || drugB.includes(a.norm)) && (b.norm.includes(drugA) || drugA.includes(b.norm));

        if (match1 || match2) {
          const pairKey = [drugA, drugB].sort().join('___');
          if (!seen.has(pairKey)) {
            seen.add(pairKey);
            results.push({
              drugA: a.raw,
              drugB: b.raw,
              matchedA: drugA,
              matchedB: drugB,
              severity: rule.severity || 'moderate',
              mechanism: rule.mechanism || rule.description || 'Additive pharmacological effects or altered metabolism.',
              management: rule.management || rule.recommendation || 'Monitor patient and consider alternate therapy.'
            });
          }
        }
      }
    }
  }

  return results;
}

// Find drug-food interactions
export function checkDrugFoodInteractions(medicationNames) {
  const normList = medicationNames.map(n => normalizeDrugName(n)).filter(Boolean);
  const results = [];
  const seen = new Set();

  const foodRules = (MASTER_HOSPITAL_INTERACTIONS || []).filter(i => i.kind === 'food');

  for (const name of normList) {
    for (const rule of foodRules) {
      const ruleDrug = (rule.a || '').toLowerCase();
      if (name.includes(ruleDrug) || ruleDrug.includes(name)) {
        const key = `${name}___${rule.b}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            drug: name,
            food: rule.b,
            severity: rule.severity || 'moderate',
            mechanism: rule.mechanism || 'Interaction alters drug bioavailability or absorption.',
            management: rule.management || 'Space drug intake away from meal / food.'
          });
        }
      }
    }
  }
  return results;
}

// Find drug-disease interactions
export function checkDrugDiseaseInteractions(medicationNames, conditionText) {
  if (!conditionText) return [];
  const conditionsLower = conditionText.toLowerCase();
  const normList = medicationNames.map(n => normalizeDrugName(n)).filter(Boolean);
  const results = [];
  const seen = new Set();

  const diseaseRules = (MASTER_HOSPITAL_INTERACTIONS || []).filter(i => i.kind === 'disease');

  for (const name of normList) {
    for (const rule of diseaseRules) {
      const ruleDrug = (rule.a || '').toLowerCase();
      const disease = (rule.b || '').toLowerCase();

      if ((name.includes(ruleDrug) || ruleDrug.includes(name)) && conditionsLower.includes(disease)) {
        const key = `${name}___${disease}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            drug: name,
            disease: rule.b,
            severity: rule.severity || 'major',
            mechanism: rule.mechanism || 'Drug exacerbates the pre-existing disease state.',
            management: rule.management || 'Use caution or choose an alternative agent.'
          });
        }
      }
    }
  }
  return results;
}

// Hospital dose limit check
export function checkHospitalDoseLimits(drugName, dailyDose) {
  const norm = normalizeDrugName(drugName);
  for (const item of MASTER_HOSPITAL_DRUGS) {
    const itemNorm = normalizeDrugName(item.drug);
    if (norm.includes(itemNorm) || itemNorm.includes(norm)) {
      return item;
    }
  }
  return null;
}

// Main Real-Time Error Detection Engine
export function runErrorDetection(patient, drugChart = [], assignedPatientId = '') {
  const errors = [];
  const activeDrugs = drugChart.filter(row => (row.genericName || row.brandName || '').trim().length > 0);
  const drugNames = activeDrugs.map(r => (r.genericName || r.brandName || '').trim());

  // 1. Wrong Patient Validation
  if (assignedPatientId && patient.patientId && assignedPatientId.trim() !== patient.patientId.trim()) {
    errors.push({
      id: generateId(),
      type: 'wrong_patient',
      severity: 'critical',
      title: 'Wrong Patient Mismatch',
      description: `Medication chart is assigned to Patient ID "${assignedPatientId}", but current record is for Patient ID "${patient.patientId}".`,
      suggestion: 'Verify patient identity and MRN before administering medications.'
    });
  }

  // Process individual drugs
  for (const row of activeDrugs) {
    const drugName = (row.genericName || row.brandName || '').trim();
    const dose = row.dose ? Number(row.dose) : null;
    const frequency = row.frequency || 'OD';
    const route = row.route || 'P/O';
    const indication = (row.indication || '').trim();

    const dbDrug = findDrug(drugName);
    const transcribingCandidate = dbDrug ? null : checkTranscribingError(drugName);

    // 2. Transcribing Error (LASA / Spelling)
    if (!dbDrug && transcribingCandidate) {
      errors.push({
        id: generateId(),
        type: 'transcribing_error',
        severity: 'major',
        title: `Possible Transcribing Error: "${drugName}"`,
        description: `"${drugName}" was not recognized. Did you mean "${transcribingCandidate.name}"?`,
        medicationId: row.id,
        drugName: drugName,
        suggestion: `Verify prescription and consider changing to "${transcribingCandidate.name}".`
      });
    }

    // 3. Unknown Drug (Prescribing Error)
    if (!dbDrug && !transcribingCandidate) {
      errors.push({
        id: generateId(),
        type: 'prescribing_error',
        severity: 'warning',
        title: `Unknown Drug: "${drugName}"`,
        description: `"${drugName}" is not catalogued in the drug database. Verify spelling and clinical appropriateness.`,
        medicationId: row.id,
        drugName: drugName
      });
    }

    // Known drug checks
    if (dbDrug) {
      // 4. Missing or Invalid Dose
      if (dose === null || isNaN(dose) || dose <= 0) {
        errors.push({
          id: generateId(),
          type: 'dose_error',
          severity: 'critical',
          title: `Missing / Invalid Dose: ${dbDrug.name}`,
          description: `No valid numeric dose entered for ${dbDrug.name}. A specific dose must be recorded.`,
          medicationId: row.id,
          drugName: dbDrug.name
        });
      }

      // 5. Indication Checks
      if (indication) {
        const matchesIndication = dbDrug.indications && dbDrug.indications.some(ind => 
          ind.toLowerCase().includes(indication.toLowerCase()) || indication.toLowerCase().includes(ind.toLowerCase())
        );
        if (!matchesIndication) {
          errors.push({
            id: generateId(),
            type: 'prescribing_error',
            severity: 'major',
            title: `Indication Mismatch: ${dbDrug.name}`,
            description: `"${indication}" is not a recognized clinical indication for ${dbDrug.name}. Recognized: ${dbDrug.indications.join(', ')}.`,
            medicationId: row.id,
            drugName: dbDrug.name,
            suggestion: `Verify indication or consider alternatives: ${dbDrug.indications.slice(0, 3).join(', ')}.`
          });
        }
      } else {
        errors.push({
          id: generateId(),
          type: 'drug_without_indication',
          severity: 'warning',
          title: `No Indication Documented: ${dbDrug.name}`,
          description: `${dbDrug.name} is prescribed without a documented indication.`,
          medicationId: row.id,
          drugName: dbDrug.name,
          suggestion: `Add clinical indication (e.g., ${dbDrug.indications ? dbDrug.indications.slice(0, 2).join(', ') : 'documented reason'}).`
        });
      }

      // 6. Dosage checks (Adult / Pediatric / Geriatric)
      const dailyDose = calculateDailyDose(dose, frequency);

      const isPediatric = patient.age !== null && Number(patient.age) < 18;
      const isGeriatric = patient.age !== null && Number(patient.age) >= 65;

      if (isPediatric && dose) {
        if (dbDrug.pediatricDoseRange && patient.weight) {
          const weight = Number(patient.weight);
          const minDaily = dbDrug.pediatricDoseRange.minPerKg * weight;
          const maxDaily = dbDrug.pediatricDoseRange.maxPerKg * weight;

          if (dailyDose < minDaily * 0.8 || dailyDose > maxDaily * 1.2) {
            errors.push({
              id: generateId(),
              type: 'dosage_error',
              severity: dailyDose > maxDaily * 1.5 ? 'critical' : 'major',
              title: `Pediatric Dosage Error: ${dbDrug.name}`,
              description: `Calculated daily dose (${dailyDose} mg/day) is outside pediatric recommended range (${minDaily.toFixed(0)} - ${maxDaily.toFixed(0)} mg/day for ${weight} kg).`,
              medicationId: row.id,
              drugName: dbDrug.name,
              suggestion: `Adjust dose to ${minDaily.toFixed(0)} - ${maxDaily.toFixed(0)} mg/day.`
            });
          }
        } else if (!dbDrug.pediatricDoseRange) {
          errors.push({
            id: generateId(),
            type: 'pediatric_adjustment',
            severity: 'major',
            title: `No Pediatric Dosing Established: ${dbDrug.name}`,
            description: `${dbDrug.name} does not have safe established pediatric dosing. Use with extreme caution in patients < 18.`,
            medicationId: row.id,
            drugName: dbDrug.name
          });
        } else if (!patient.weight) {
          errors.push({
            id: generateId(),
            type: 'pediatric_adjustment',
            severity: 'warning',
            title: `Weight Required for Pediatric Dosing: ${dbDrug.name}`,
            description: `Patient weight is needed to safely calculate mg/kg pediatric dose for ${dbDrug.name}.`,
            medicationId: row.id,
            drugName: dbDrug.name,
            suggestion: 'Enter patient weight.'
          });
        }
      } else if (!isPediatric && dose && dbDrug.adultDoseRange) {
        if (dailyDose > dbDrug.adultDoseRange.max * 1.1) {
          errors.push({
            id: generateId(),
            type: 'dosage_error',
            severity: dailyDose > dbDrug.adultDoseRange.max * 2 ? 'critical' : 'major',
            title: `Excessive Adult Dose: ${dbDrug.name}`,
            description: `Prescribed daily dose (${dailyDose} mg/day) exceeds maximum recommended adult dose (${dbDrug.adultDoseRange.max} mg/day).`,
            medicationId: row.id,
            drugName: dbDrug.name,
            suggestion: `Maximum recommended: ${dbDrug.adultDoseRange.max} mg/day.`
          });
        } else if (dailyDose < dbDrug.adultDoseRange.min * 0.5) {
          errors.push({
            id: generateId(),
            type: 'dosage_error',
            severity: 'warning',
            title: `Subtherapeutic Dose: ${dbDrug.name}`,
            description: `Prescribed daily dose (${dailyDose} mg/day) is below minimum therapeutic dose (${dbDrug.adultDoseRange.min} mg/day).`,
            medicationId: row.id,
            drugName: dbDrug.name
          });
        }
      }

      // 7. Geriatric Considerations
      if (isGeriatric && dbDrug.geriatricAdjustment) {
        errors.push({
          id: generateId(),
          type: 'geriatric_adjustment',
          severity: 'warning',
          title: `Geriatric Dose Review: ${dbDrug.name}`,
          description: dbDrug.geriatricAdjustment,
          medicationId: row.id,
          drugName: dbDrug.name
        });
      }

      // 8. Allergy & Contraindications
      const patientAllergies = patient.allergies || [];
      if (patient.allergicHistory) {
        patientAllergies.push(...patient.allergicHistory.split(/[,;\n]/).map(s => s.trim()).filter(Boolean));
      }

      for (const allergy of patientAllergies) {
        if (allergy && dbDrug.contraindications && dbDrug.contraindications.some(c => c.toLowerCase().includes(allergy.toLowerCase()))) {
          errors.push({
            id: generateId(),
            type: 'prescribing_error',
            severity: 'critical',
            title: `Severe Contraindication: ${dbDrug.name}`,
            description: `Patient has documented allergy/condition "${allergy}". ${dbDrug.name} is strictly contraindicated.`,
            medicationId: row.id,
            drugName: dbDrug.name,
            suggestion: `Discontinue ${dbDrug.name} and select an alternative class.`
          });
        }
      }

      // 9. Renal Impairment
      if (patient.renalImpairment && dbDrug.renalAdjustment) {
        errors.push({
          id: generateId(),
          type: 'dosage_error',
          severity: 'major',
          title: `Renal Dose Adjustment Needed: ${dbDrug.name}`,
          description: dbDrug.renalAdjustment,
          medicationId: row.id,
          drugName: dbDrug.name
        });
      }

      // 10. Hepatic Impairment
      if (patient.hepaticImpairment && dbDrug.hepaticAdjustment) {
        errors.push({
          id: generateId(),
          type: 'dosage_error',
          severity: 'major',
          title: `Hepatic Dose Caution: ${dbDrug.name}`,
          description: dbDrug.hepaticAdjustment,
          medicationId: row.id,
          drugName: dbDrug.name
        });
      }

      // 11. Hospital Reference Max Dose Limit
      const hospitalLimit = checkHospitalDoseLimits(dbDrug.name, dailyDose);
      if (hospitalLimit && hospitalLimit.maxMgPerDay && dailyDose > hospitalLimit.maxMgPerDay) {
        errors.push({
          id: generateId(),
          type: 'max_daily_dose',
          severity: dailyDose > hospitalLimit.maxMgPerDay * 1.5 ? 'critical' : 'major',
          title: `Hospital Max Daily Dose Exceeded: ${hospitalLimit.drug}`,
          description: `Prescribed daily dose ${dailyDose} mg/day exceeds hospital reference limit (${hospitalLimit.maxText}).`,
          medicationId: row.id,
          drugName: dbDrug.name,
          suggestion: `Reduce dose to within ${hospitalLimit.maxText}.`
        });
      }
    }
  }

  // 12. Drug-Drug Interactions
  const drugInteractions = checkDrugInteractions(drugNames);
  for (const inter of drugInteractions) {
    errors.push({
      id: generateId(),
      type: 'drug_interaction',
      severity: inter.severity === 'critical' ? 'critical' : inter.severity === 'major' ? 'major' : 'warning',
      title: `Drug Interaction (${inter.severity.toUpperCase()}): ${inter.drugA} + ${inter.drugB}`,
      description: `${inter.mechanism}\n\nClinical Management: ${inter.management}`,
      drugName: `${inter.drugA}, ${inter.drugB}`,
      suggestion: inter.management
    });
  }

  // 13. Drug-Food Interactions
  const drugFoodInteractions = checkDrugFoodInteractions(drugNames);
  for (const inter of drugFoodInteractions) {
    errors.push({
      id: generateId(),
      type: 'drug_food_interaction',
      severity: inter.severity === 'major' ? 'major' : 'warning',
      title: `Drug–Food Interaction (${inter.severity}): ${inter.drug} + ${inter.food}`,
      description: `${inter.mechanism}\nManagement: ${inter.management}`,
      drugName: inter.drug,
      suggestion: inter.management
    });
  }

  // 14. Drug-Disease Interactions
  const clinicalContext = [
    patient.complaints,
    patient.pastMedicalHistory,
    ...(patient.diagnoses || [])
  ].filter(Boolean).join('. ');

  const diseaseInteractions = checkDrugDiseaseInteractions(drugNames, clinicalContext);
  for (const inter of diseaseInteractions) {
    errors.push({
      id: generateId(),
      type: 'drug_disease_interaction',
      severity: inter.severity === 'major' ? 'critical' : 'major',
      title: `Drug–Disease Concern (${inter.severity}): ${inter.drug} in ${inter.disease}`,
      description: `${inter.mechanism}\nManagement: ${inter.management}`,
      drugName: inter.drug,
      suggestion: inter.management
    });
  }

  // 15. Untreated Diagnoses
  if (patient.diagnoses && patient.diagnoses.length > 0) {
    for (const diag of patient.diagnoses) {
      const diagLower = diag.toLowerCase();
      const hasMed = activeDrugs.some(row => {
        const drug = findDrug(row.genericName || row.brandName);
        return drug && drug.indications && drug.indications.some(ind => ind.toLowerCase().includes(diagLower) || diagLower.includes(ind.toLowerCase()));
      });

      if (!hasMed) {
        errors.push({
          id: generateId(),
          type: 'indication_without_drug',
          severity: 'info',
          title: `Untreated Condition: ${diag}`,
          description: `Diagnosed condition "${diag}" does not have an active medication recorded in this case chart.`,
          suggestion: `Review and consider appropriate therapy for ${diag}.`
        });
      }
    }
  }

  return errors;
}
