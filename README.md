# MedGuard - Healthcare Record Error Detection System

A high-fidelity clone of

MedGuard is a real-time clinical decision support and healthcare record error detection platform designed for hospitals, clinical pharmacists, and physicians to detect:
1. **Prescribing Errors** (Untreated conditions, contraindications, indication mismatches, unknown drugs)
2. **Transcribing Errors** (Look-Alike / Sound-Alike [LASA] drug confusion, misspelling corrections)
3. **Dosage Errors** (Maximum adult daily dose exceedance, subtherapeutic dosing, pediatric mg/kg calculations, geriatric adjustments, renal impairment dose reductions)
4. **Administration Errors** (Wrong route, frequency concerns, wrong-patient chart assignment mismatch)
5. **Drug Interactions** (Drug–Drug with severity rating, mechanism & management; Drug–Food; Drug–Disease interactions)

---

## 🏥 Clinical Modules

- **Inpatient Department (IPD)**:
  - Admitted patient case management with real-time error detection.
  - Comprehensive clinical demographics, vitals, and complaints.
  - ICD-10 diagnostic code lookup with auto-suggest rules from vitals (e.g. BP >= 140/90 -> Hypertension, HR > 100 -> Tachycardia) and symptom keywords.
  - Drug chart with given/missed administration tracking across Days 1–4.
  - Autocomplete across 185+ clinical drugs with adult, pediatric, and geriatric parameters.
  - Clinical risk assessment scales (Geneva, Hestia, Caprini, Wells, HAS-BLED, CHA2DS2-VASc, CURB-65, NEWS2, Glasgow Coma Scale, etc.).
  - Clinical pharmacist review, notes, and patient discharge summary generator.

- **Outpatient Department (OPD)**:
  - Outpatient consultation recording with vitals and complaints.
  - Outpatient prescription management with dosage, frequency, and instructions.
  - Duplicate patient record detection.

- **Medical Records Department (MRD)**:
  - Restricted to administrator **`dr.thirumalai`**.
  - Legal medical records archive of discharged IPD cases and OPD consultations.
  - Clinical staff activity and audit trail.

- **Lab Investigation**:
  - Diagnostic test orders with category classifications and automated costing calculation.

- **Pharmacy Inventory**:
  - Stock ledger, procurement, issue tracking, balance stock calculation, and total inventory valuation.

- **Pharmacy Dispensing**:
  - Search prescriptions across IPD discharge and OPD queues.
  - Clinical verification and dispensing status recording.

- **Hospital & Formulary Administration**:
  - Switch active hospital / formulary.
  - Import drug formularies and interaction rules via CSV/text format.

---

## 🚀 Getting Started

### 1. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Production Build
```bash
npm run build
npm run preview
```

---

## 🔑 Default Accounts (1-Click Login Available)

| Account | Username | Password | Role / Access |
|---|---|---|---|
| **Dr. Thirumalai (MRN Admin)** | `dr.thirumalai` | `password123` | Full access to all modules including MRD Archive & Hospital Administration |
| **Clinical Pharmacist** | `pharmacist` | `password123` | IPD, OPD, Lab, Inventory, and Pharmacy Dispensing |

*(A 1-Click quick login switcher is available directly on the login screen and top navigation bar.)*
