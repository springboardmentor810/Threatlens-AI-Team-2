# 🛡️ ThreatLens AI

### AI-Powered Malware Classification & Threat Intelligence Platform

ThreatLens AI is a full-stack cybersecurity platform designed to analyze potentially malicious files by combining **static file analysis, suspicious behavior detection, YARA-based signature analysis, VirusTotal threat intelligence, and machine-learning-based malware classification**.

The platform provides security analysts with a centralized dashboard where files can be uploaded, analyzed, classified, and tracked through persistent analysis records.

---
# TEAM 2 : 
 Dimple Sachanandani | Prasanna.G | Nalam Beema Satya Sai | Abhishek Swami | K.Shiva Kumar Reddy | Gangappagari Kuruva Ajay | ShriPavani

Springboard Mentor: Anusha Maam
Program: Infosys Springboard Virtual Internship 7.0  •  Domain: AI

---

---

## 🚀 Live Application

| Service                  | Link                                                         |
| ------------------------ | ------------------------------------------------------------ |
| 🌐 **Frontend**          | https://threatlens-ai-team2.vercel.app                       |
| ⚙️ **Backend API**       | https://threatlens-backend-vef1.onrender.com                 |
| 📚 **API Documentation** | https://threatlens-backend-vef1.onrender.com/docs            |
| 💚 **Backend Health**    | https://threatlens-backend-vef1.onrender.com/health          |
| 🐙 **GitHub Repository** | https://github.com/springboardmentor810/Threatlens-AI-Team-2 |

### Production Status

* Frontend: **Vercel**
* Backend: **Render**
* Database: **Neon PostgreSQL**
* ML Engine: **Integrated into backend deployment**
* Monitoring: **UptimeRobot**
* Production authentication: **JWT**
* Branch: **Final-integration**

---

# 📌 Table of Contents

* [Overview](#-overview)
* [Problem Statement](#-problem-statement)
* [Solution](#-solution)
* [Key Features](#-key-features)
* [System Workflow](#-system-workflow)
* [Architecture](#-architecture)
* [Cybersecurity Analysis](#-cybersecurity-analysis)
* [Machine Learning Pipeline](#-machine-learning-pipeline)
* [Technology Stack](#-technology-stack)
* [Project Structure](#-project-structure)
* [Authentication & Authorization](#-authentication--authorization)
* [Database](#-database)
* [API](#-api)
* [Local Setup](#-local-setup)
* [Environment Variables](#-environment-variables)
* [Production Deployment](#-production-deployment)
* [Monitoring](#-monitoring)
* [Security Notes](#-security-notes)
* [Testing & Verification](#-testing--verification)
* [Future Scope](#-future-scope)

---

# 🔍 Overview

Traditional malware detection systems often depend on a single detection mechanism such as signatures or antivirus databases.

ThreatLens AI uses a **multi-layer analysis pipeline** that combines:

1. Static file analysis
2. Suspicious behavior/API analysis
3. YARA signature matching
4. Known malware signature detection
5. VirusTotal threat intelligence
6. Machine-learning classification
7. Malware family classification
8. Risk scoring
9. Persistent database storage
10. Dashboard-based visualization

This allows multiple sources of evidence to contribute to the final security assessment.

---

# ❗ Problem Statement

Modern malware can evade traditional signature-based detection through techniques such as:

* Obfuscation
* Packing
* Modified binaries
* Fileless behavior
* API abuse
* New malware variants
* Polymorphic techniques

A detection system relying on only one method can therefore miss suspicious files or generate incomplete results.

ThreatLens AI addresses this problem by combining **traditional cybersecurity analysis with machine learning and external threat intelligence**.

---

# 💡 Solution

ThreatLens AI follows a layered analysis approach.

```text
                    ┌──────────────────────┐
                    │     User Uploads     │
                    │        File          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   File Validation    │
                    │   & Static Analysis  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │    YARA     │  │  Signature  │  │ Suspicious  │
       │   Analysis  │  │  Detection  │  │   Analysis  │
       └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │   VirusTotal Threat  │
                    │     Intelligence     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    ML Classification │
                    │ LSTM Autoencoder +   │
                    │      XGBoost         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Risk & Final Verdict │
                    │ Clean / Suspicious / │
                    │      Malware        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PostgreSQL Database  │
                    │   + Web Dashboard    │
                    └──────────────────────┘
```

---

# ✨ Key Features

### 🔬 Static File Analysis

Extracts relevant characteristics from uploaded files, including:

* File metadata
* File hashes
* PE information
* Sections
* Imports
* Exports
* Strings
* Entropy
* File characteristics
* Debug/signature information

---

### 🧬 YARA Detection

YARA rules are used to identify known malicious patterns and suspicious characteristics.

The system records whether uploaded files match configured YARA rules.

---

### 📝 Signature-Based Detection

Files are checked against known malware signatures and patterns.

This provides a traditional detection layer alongside the ML pipeline.

---

### 🔎 Suspicious Behavior Analysis

The platform identifies potentially suspicious APIs and characteristics.

Examples include APIs associated with:

* Process creation
* Process manipulation
* Memory protection changes
* Potential injection behavior

---

### 🌐 VirusTotal Integration

ThreatLens AI integrates with the VirusTotal API to obtain external threat-intelligence information.

VirusTotal results are treated as an additional security signal rather than the only detection mechanism.

---

### 🤖 Machine Learning Classification

The ML engine combines anomaly detection and supervised classification.

The pipeline uses:

* LSTM Autoencoder
* XGBoost classifier
* Malware family Random Forest model
* Feature extraction
* Reconstruction error
* Risk classification

---

### 📊 Risk Assessment

The platform generates a final security assessment based on multiple analysis signals.

The ML risk levels are:

```text
LOW
MEDIUM
HIGH
```

The final analysis also records the overall malware/clean verdict.

---

### 👥 Role-Based Access

The system supports multiple user roles:

* Analyst
* Security Analyst
* Administrator

Administrative functionality is protected on the backend rather than relying only on frontend visibility.

---

### 🔐 Authentication

Authentication uses:

* Email/password login
* bcrypt password hashing
* JWT access tokens
* Configurable token expiration
* Protected API routes

---

### 📁 Analysis History

Completed analyses are stored in PostgreSQL so users can review previous file-analysis results from the dashboard.

---

### 🚨 Alerts

The backend provides alert functionality including:

* Alert retrieval
* Alert status
* Acknowledgement

---

# 🔄 System Workflow

```text
1. User logs into ThreatLens AI
              ↓
2. JWT authentication
              ↓
3. User uploads a file
              ↓
4. File stored and registered
              ↓
5. Static analysis
              ↓
6. YARA analysis
              ↓
7. Signature analysis
              ↓
8. Suspicious API/behavior analysis
              ↓
9. VirusTotal lookup
              ↓
10. ML feature extraction
              ↓
11. LSTM Autoencoder anomaly detection
              ↓
12. XGBoost malware classification
              ↓
13. Malware family classification
              ↓
14. Risk calculation
              ↓
15. Final verdict generated
              ↓
16. Result stored in PostgreSQL
              ↓
17. Dashboard displays analysis
```

---

# 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────┐
│                    Vercel Frontend                   │
│                                                      │
│              React + Vite Application                │
└───────────────────────┬──────────────────────────────┘
                        │ HTTPS / REST API
                        ▼
┌──────────────────────────────────────────────────────┐
│                    Render Backend                    │
│                                                      │
│                 FastAPI Application                  │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌───────────────────────┐ │
│ │   Auth   │ │  Upload  │ │ Cybersecurity Analysis│ │
│ └──────────┘ └──────────┘ └───────────────────────┘ │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌───────────────────────┐ │
│ │  Alerts  │ │  Admin   │ │      ML Engine        │ │
│ └──────────┘ └──────────┘ └───────────────────────┘ │
└───────────────┬──────────────────────┬───────────────┘
                │                      │
                ▼                      ▼
       ┌─────────────────┐    ┌────────────────────┐
       │ Neon PostgreSQL │    │ External Services  │
       │                 │    │                    │
       │ Users           │    │ VirusTotal         │
       │ Files           │    │                    │
       │ Analyses        │    └────────────────────┘
       │ Alerts          │
       └─────────────────┘
```

---

# 🛡️ Cybersecurity Analysis

The cybersecurity layer combines several independent detection mechanisms.

## YARA

YARA rules identify files matching predefined malicious or suspicious patterns.

## Signature Detection

Known signatures and patterns are used to identify previously known malicious characteristics.

## Static Analysis

The system extracts binary-level information including:

* PE headers
* Imports
* Exports
* Sections
* Strings
* Entropy
* File size
* Debug information
* Digital signature information

## Suspicious API Analysis

Potentially dangerous Windows APIs are identified during static analysis.

## VirusTotal

VirusTotal provides an additional external threat-intelligence signal based on the uploaded file's hash.

## Final Security Result

The cybersecurity signals are combined with the ML output to provide a consolidated analysis result.

---

# 🤖 Machine Learning Pipeline

ThreatLens AI uses a hybrid machine-learning pipeline.

## 1. Feature Extraction

The ML feature extractor generates the following features:

```text
id,imports_count,strings_avlength,total_imported_functions,strings_entropy,hist_min,general_importsentropy_max,general_vsize,general_has_tls,strings_MZ,entropy_std,strings_urls,hist_std,strings_printables,hist_max,strings_numstrings,general_size,hist_sum,hist_mean,entropy_mean,general_has_debug,section_sections_count,strings_paths,general_has_signature,general_exports
```

---

## 2. LSTM Autoencoder

The autoencoder learns patterns from normal file behavior.

The reconstruction error is used as an anomaly signal.

```text
Normal Features
      ↓
LSTM Encoder
      ↓
Latent Representation
      ↓
LSTM Decoder
      ↓
Reconstructed Features
      ↓
Reconstruction Error
```

---

## 3. XGBoost Classifier

The XGBoost classifier combines:

* Extracted file features
* Reconstruction error
* Statistical features

to classify files as:

```text
0 → Normal
1 → Malware
```

---

## 4. Malware Family Classification

For files classified as malware, the system can use the malware-family model to determine the predicted malware family.

---

## 5. Explainability

SHAP-based explainability is part of the ML design to help identify which features contribute to classification decisions.

---

# 🧰 Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* REST API integration

## Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* bcrypt
* Pydantic

## Cybersecurity

* YARA
* PE analysis
* `pefile`
* LIEF
* VirusTotal API
* Static analysis
* Signature-based detection

## Machine Learning

* Python
* NumPy
* Pandas
* Scikit-learn
* Joblib
* LSTM Autoencoder
* XGBoost
* Random Forest
* SHAP

## Database

* PostgreSQL
* Neon

## Deployment

* Vercel — Frontend
* Render — Backend/ML
* Neon — PostgreSQL
* UptimeRobot — Monitoring

---

# 📂 Project Structure

```text
Threatlens-AI-Team-2/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── upload.py
│   │   │   ├── analysis.py
│   │   │   ├── alerts.py
│   │   │   └── admin.py
│   │   │
│   │   ├── core/
│   │   │   └── security.py
│   │   │
│   │   ├── database/
│   │   │   └── ...
│   │   │
│   │   ├── models/
│   │   │   └── user.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   └── ...
│   │   │
│   │   ├── config/
│   │   │   └── settings.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── uploads/
│
├── ml-engine/
│   ├── feature_extractor.py
│   ├── inference.py
│   ├── model.py
│   └── models/
│       ├── family_labels.pkl
│       ├── final_features.pkl
│       ├── final_malware_rf.pkl
│       └── malware_family_rf.pkl
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   ├── vercel.json
│   └── ...
│
├── README.md
└── .gitignore
```

---

# 🔐 Authentication & Authorization

ThreatLens AI uses JWT-based authentication.

### Authentication endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/token
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
```

Passwords are hashed using bcrypt before being stored.

Protected operations require a valid bearer token.

Administrative operations additionally require the appropriate administrator role.

---

# 🗄️ Database

The production application uses:

**Neon PostgreSQL**

The database stores application information such as:

* Users
* Uploaded files
* Analysis records
* Alerts
* User roles
* Authentication-related information

Production database credentials are stored as environment variables and are **not committed to GitHub**.

MongoDB configuration remains optional in the application configuration and is not required for the production deployment.

---

# 🔌 API

FastAPI automatically provides interactive documentation.

### Production API Documentation

https://threatlens-backend-vef1.onrender.com/docs

### Health Check

```http
GET /health
```

Expected response:

```json
{
  "status": "Healthy"
}
```

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
POST /api/v1/auth/token
```

### File Analysis

```http
POST /upload/
POST /analysis/{file_id}
```

### Alerts

```http
GET   /alerts
PATCH /alerts/{alert_id}/acknowledge
```

Additional endpoints are available through the FastAPI Swagger documentation.

---

# 💻 Local Setup

## Prerequisites

* Python 3.12+
* Node.js 22+
* PostgreSQL
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/springboardmentor810/Threatlens-AI-Team-2.git
cd Threatlens-AI-Team-2
```

Switch to the integration branch:

```bash
git checkout Final-integration
```

---

# 2. Backend Setup

```bash
cd backend
python -m venv venv
```

### Windows

```powershell
.\venv\Scripts\Activate.ps1
```

### Install dependencies

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Run:

```bash
npm run dev
```

The Vite development server will display the local frontend URL.

---

# ☁️ Production Deployment

## Frontend — Vercel

The React/Vite frontend is deployed on Vercel.

Production URL:

https://threatlens-ai-team2.vercel.app

The frontend communicates with the Render backend through:

```text
VITE_API_BASE_URL
```

---

## Backend — Render

The FastAPI backend and ML engine are deployed on Render.

Production URL:

https://threatlens-backend-vef1.onrender.com

Render starts the application using:

```bash
PYTHONPATH=.. uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Database — Neon

Production PostgreSQL is hosted on Neon.

The application accesses the database through:

```text
DATABASE_URL
```

No database credentials are committed to the repository.

---

# 📡 Monitoring

UptimeRobot monitors the production backend health endpoint:

```text
https://threatlens-backend-vef1.onrender.com/health
```

The monitor checks whether the production API remains available.

UptimeRobot monitoring is independent of the application database and does not store monitoring data in Neon.

---

# 🧪 Testing & Verification

The production system has been verified end-to-end.

### Verified Components

* [x] Frontend deployment
* [x] Backend deployment
* [x] Backend health endpoint
* [x] Frontend/backend CORS
* [x] Neon PostgreSQL connection
* [x] Production user creation
* [x] JWT authentication
* [x] Admin role
* [x] Frontend login
* [x] File upload
* [x] Malware analysis
* [x] ML inference
* [x] Cybersecurity analysis
* [x] Database persistence
* [x] Dashboard results
* [x] UptimeRobot monitoring

### Production Flow Tested

```text
Vercel
  ↓
Render
  ↓
Neon PostgreSQL
  ↓
Cybersecurity Analysis
  ↓
ML Engine
  ↓
Analysis Result
  ↓
Dashboard
```

---

# 🔒 Security Notes

ThreatLens AI is designed as a cybersecurity analysis platform, but uploaded files should still be handled carefully.

### Important practices

* Never commit secrets to Git.
* Keep VirusTotal API keys server-side.
* Never expose database credentials to the frontend.
* Use JWT authentication for protected routes.
* Use role-based authorization for administrative operations.
* Do not upload sensitive production files unnecessarily.
* Treat automated malware classifications as analysis signals rather than absolute proof.
* Keep dependencies updated.
* Keep production secrets inside deployment environment variables.

---

# 🔮 Future Scope

Potential future enhancements include:

* Expanded malware family classification
* Additional file-format support
* More advanced behavioral analysis
* Real-time threat-intelligence enrichment
* Improved ML explainability
* Larger malware datasets
* Automated threat reports
* More advanced alerting and notification mechanisms
* Containerized deployment using Docker
* Kubernetes-based scaling
* Continuous model retraining and evaluation

---

## 🔗 Important Links

**Live Application**

https://threatlens-ai-team2.vercel.app

**Backend**

https://threatlens-backend-vef1.onrender.com

**API Documentation**

https://threatlens-backend-vef1.onrender.com/docs

**Health Check**

https://threatlens-backend-vef1.onrender.com/health

**GitHub**

https://github.com/springboardmentor810/Threatlens-AI-Team-2

---

## 👩‍💻 Project Team

**ThreatLens AI — Team 2**

A collaborative cybersecurity project combining full-stack development, threat intelligence, static analysis, and machine learning for automated malware classification.
