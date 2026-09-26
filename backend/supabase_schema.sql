-- =========================================================================
-- ENIGMA HEALTHTECH - MEDICATION MANAGEMENT & ADHERENCE
-- SUPABASE POSTGRESQL SCHEMA MIGRATION
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Can link to auth.users or standalone UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('PATIENT', 'CAREGIVER')) DEFAULT 'PATIENT',
    chronic_conditions TEXT[] DEFAULT '{}',
    known_allergies TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the application profile when a user registers through Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'Patient'), '@', 1)),
        CASE
            WHEN NEW.raw_user_meta_data->>'role' = 'CAREGIVER' THEN 'CAREGIVER'
            ELSE 'PATIENT'
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CAREGIVER LINKS & CONSENT
CREATE TABLE IF NOT EXISTS public.caregiver_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
    share_med_details BOOLEAN DEFAULT FALSE, -- Privacy toggle: hide drug names if false
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, caregiver_id)
);

-- 3. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_name TEXT, -- Multiple doctors conflict tracking
    image_url TEXT,
    raw_extracted_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEDICATIONS (Handles Chronic, Short-course, OTC, SOS)
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    is_otc BOOLEAN DEFAULT FALSE, -- OTC / self-taken edge case (Crocin, Ibuprofen)
    is_sos BOOLEAN DEFAULT FALSE, -- As-needed / SOS edge case
    food_relation TEXT CHECK (food_relation IN ('BEFORE_FOOD', 'AFTER_FOOD', 'EMPTY_STOMACH', 'WITH_FOOD', 'NO_RELATION')) DEFAULT 'AFTER_FOOD',
    schedule_times TIME[] DEFAULT '{}',
    interval_hours INT DEFAULT 24, -- Used for missed-dose clinical logic
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE, -- Short course auto-expiry (e.g. 5-day antibiotic)
    is_active BOOLEAN DEFAULT TRUE,
    discontinue_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOSE LOGS (Adherence & Schedule Timeline)
CREATE TABLE IF NOT EXISTS public.dose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('SCHEDULED', 'TAKEN', 'SKIPPED', 'MISSED')) DEFAULT 'SCHEDULED',
    taken_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DRUG INTERACTIONS SEED & RULES
CREATE TABLE IF NOT EXISTS public.drug_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_a TEXT NOT NULL,
    drug_b TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('HIGH', 'MODERATE', 'LOW')) NOT NULL,
    description TEXT NOT NULL,
    guidance TEXT NOT NULL
);

-- 7. ALERTS & CAREGIVER ESCALATIONS
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN ('CONSECUTIVE_MISSED_DOSE', 'HIGH_RISK_INTERACTION', 'REFILL_LOW')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED CLINICAL INTERACTIONS
INSERT INTO public.drug_interactions (drug_a, drug_b, severity, description, guidance)
VALUES
('Aspirin', 'Ibuprofen', 'HIGH', 'Combining Ibuprofen with Aspirin increases gastrointestinal bleeding risks and inhibits Aspirin cardioprotection.', 'Avoid concurrent use. Use Paracetamol for fever/mild pain.'),
('Warfarin', 'Aspirin', 'HIGH', 'Dual anticoagulant and antiplatelet effect severely elevates hemorrhage risk.', 'Do not take together without explicit cardiologist instruction.'),
('Lisinopril', 'Potassium', 'HIGH', 'Risk of severe hyperkalemia leading to cardiac arrhythmia.', 'Avoid potassium supplements or high-potassium salt substitutes.'),
('Tramadol', 'Fluoxetine', 'HIGH', 'Synergistic serotonergic risk may precipitate Serotonin Syndrome.', 'Consult prescribing physician for alternative analgesic.')
ON CONFLICT DO NOTHING;
