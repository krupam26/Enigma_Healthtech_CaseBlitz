# CaseBlitz

## Personalized Medication Management & Adherence

### Team

- **Team name:** CaseBlitz
- **Kavya Chauhan**
- **Krupa Mehta**
- **Siya Rozani**

## Problem Statement

Misunderstanding prescriptions and complex medication regimens can lead to missed doses, incorrect medication usage, and poor treatment adherence. Patients often struggle to understand their prescriptions, manage multiple medicines, recognize potential medication-related risks, and stay consistent with their treatment plans.

## Objective

Develop an AI-powered platform for personalized medication management and adherence.

- Help users identify potential medication-related risks and receive timely support.
- Enable secure coordination between patients and their trusted caregivers.
- Simplify prescriptions into understandable daily routines.
- Track medication schedules, dose history, adherence, and missed-dose risks.
- Provide an authenticated AI assistant for medication questions and safety guidance.

## Solution Overview

MedCheck combines a patient-facing medication dashboard with secure authentication, medication and schedule management, safety checks, caregiver privacy controls, prescription processing, adherence analysis, and an AI medication assistant.

The application is organized into three services:

```text
frontend/  ->  backend/  ->  Supabase
								 |
								 ->  ml/  ->  Google Gemini and adherence models
```

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand for client state and local persistence
- Supabase JavaScript client for authentication
- Three.js, React Three Fiber, and Drei for 3D experiences
- Framer Motion for interface animation

### Backend API

- Python
- FastAPI
- Uvicorn
- Pydantic
- Supabase Python client and PostgreSQL
- Google Gemini REST API for the authenticated AI assistant
- HTTPX for service-to-service requests
- Multipart upload support for prescription images

### ML Service

- Python FastAPI service
- Google GenAI SDK for the medication chatbot
- Pillow and RapidFuzz for prescription processing and normalization
- Pandas and scikit-learn for adherence analysis and prediction
- Joblib for loading the adherence model
- Pytest for ML tests

### Data and Security

- Supabase Auth for patient and caregiver authentication
- Supabase PostgreSQL for profiles, caregiver links, medications, dose logs, alerts, and interactions
- Bearer-token authorization for protected backend routes
- Database-backed caregiver relationships and medication-detail consent

## Project Structure

```text
_frontend-publish/
	frontend/       React and Vite application
	backend/        Main FastAPI API and Supabase integration
	ml/             AI, OCR, safety, and adherence FastAPI service
	docs/           Project documentation
```

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- A Supabase project
- A Google Gemini API key
- PowerShell on Windows, or an equivalent shell on macOS/Linux

## Setup Instructions

### 1. Configure Supabase

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open [backend/supabase_schema.sql](backend/supabase_schema.sql), copy the complete file, paste it into a new SQL query, and click **Run**.
4. Confirm that the `profiles`, `caregiver_links`, `medications`, `dose_logs`, and `alerts` tables were created.
5. Confirm that the `on_auth_user_created` trigger exists. It creates an application profile whenever a user registers through Supabase Auth.

### 2. Configure the frontend

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Install dependencies and start Vite:

```powershell
cd _frontend-publish\frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 3. Configure and run the backend

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-key
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
ML_SERVICE_URL=http://localhost:8001
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

In a second terminal:

```powershell
cd _frontend-publish\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend API and Swagger documentation are available at `http://localhost:8000/docs`.

### 4. Configure and run the ML service

Create `ml/.env`:

```env
gemini_api_key=your-gemini-api-key
gemini_model=gemini-1.5-flash
```

In a third terminal:

```powershell
cd _frontend-publish\ml
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

The ML API documentation is available at `http://localhost:8001/docs`.

## Using the Application

1. Open `http://localhost:5173`.
2. Create a patient or caregiver account, or sign in with an existing Supabase Auth account.
3. Open **Assistant** to ask medication questions.
4. Use **Medications**, **Schedule**, and **Adherence** to manage treatment information.
5. Use **Caregiver** to manage linked caregiver access and medication-detail consent.

The chatbot endpoint is `POST /api/ai/chat`. It requires a Supabase bearer token and loads the authenticated patient's context from Supabase. Caregivers must have an accepted caregiver link and only receive medication details when the patient has enabled sharing.

## Useful Checks

Backend health check:

```text
http://localhost:8000/health
```

Frontend production build:

```powershell
cd _frontend-publish\frontend
npm run build
```

Backend syntax check:

```powershell
cd _frontend-publish\backend
.\.venv\Scripts\python.exe -m compileall -q app
```

## Security Notes

- Never commit `.env` files or API keys.
- Keep `GEMINI_API_KEY` on the backend or ML service; do not expose it through frontend environment variables.
- Use the Supabase anon key only in the frontend. Use the backend Supabase key only in the backend environment.
- Apply the Supabase schema before registering new users so their profile rows are created automatically.