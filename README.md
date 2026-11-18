# MedGuard - Healthcare Record Error Detection System (MERN Stack)

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) clinical decision support and healthcare record error detection platform designed for hospitals, clinical pharmacists, and physicians. Based on MedGuard.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Responsibilities |
| :--- | :--- | :--- |
| **M** (MongoDB) | MongoDB + Mongoose | Schemas and collections for Patients, Inpatients, Outpatients, Pharmacy Dispenses, Lab Orders, Inventory Stock, Users, and Audit Logs. |
| **E** (Express.js) | Express 5 + REST API | Modular controllers & routes (`/api/auth`, `/api/cases`, `/api/opd`, `/api/lab`, `/api/inventory`, `/api/pharmacy`, `/api/clinical`, `/api/mrd`). |
| **R** (React 18) | React + Tailwind CSS + Lucide | Fast responsive clinical station, real-time error detection panel, 28 risk calculators, printable case sheets. |
| **N** (Node.js) | Node.js Runtime | Concurrently runs Express API (port 5000) and Vite Dev Server (port 5173) with automated proxying. |

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

## ⚡ Quick Start (1-Click)

### 1. Start Both Backend & Frontend (Full MERN Stack)
Double-click **`start.bat`** or run:
```bash
npm run dev
```
- **React Frontend**: [http://localhost:5173](http://localhost:5173)
- **Express Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. Seed MongoDB Demo Hospital Data
Double-click **`seed.bat`** or run:
```bash
npm run seed
```

### 3. Push to GitHub
Double-click **`push.bat`** or run:
```bash
npm run push
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status, MongoDB connectivity, and uptime |
| `GET` | `/api/auth/users` | List hospital users |
| `POST` | `/api/auth/login` | Authenticate physician or pharmacist |
| `GET` | `/api/cases` | Fetch inpatient cases (filter by `status`, `department`) |
| `POST` | `/api/cases` | Create or update inpatient clinical case |
| `POST` | `/api/cases/:patientId/discharge` | Discharge patient record to MRD archive |
| `GET` | `/api/opd` | List outpatient consultations |
| `POST` | `/api/opd` | Create outpatient consultation and prescription |
| `GET` | `/api/lab` | List diagnostic lab requisitions |
| `POST` | `/api/lab` | Place lab investigation order |
| `GET` | `/api/inventory` | List pharmacy inventory ledger |
| `POST` | `/api/inventory/:id/adjust` | Quick-adjust stock procured/issued (+50, +500) |
| `POST` | `/api/pharmacy/dispense` | Record prescription dispensing |
| `POST` | `/api/pharmacy/dispense-all` | Batch dispense all queued prescriptions |
| `POST` | `/api/clinical/check-errors` | Server-side real-time prescription validation engine |
| `POST` | `/api/clinical/suggest-diagnosis` | AI / symptom diagnostic suggestions |
| `GET` | `/api/mrd/stats` | Aggregated hospital KPI metrics |
| `GET` | `/api/mrd/export` | Complete legal hospital archive JSON export (`dr.thirumalai`) |

---

## 🔑 Default Accounts

- **Physician / MRD Admin**:
  - Username: `dr.thirumalai`
  - Password: `password123`
- **Clinical Pharmacist**:
  - Username: `pharmacist`
  - Password: `password123`
