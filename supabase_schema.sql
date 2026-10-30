-- ================================================================
-- DENTAL CARE CLINIC — SUPABASE (POSTGRESQL) COMPLETE SCHEMA & SEED
-- ================================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  rating REAL DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 100,
  photo TEXT,
  bio TEXT,
  consultation_fee INTEGER DEFAULT 2500,
  available_days TEXT DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
  available_start_time TEXT DEFAULT '11:00',
  available_end_time TEXT DEFAULT '23:59',
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dental Services Table
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  short_desc TEXT NOT NULL,
  full_desc TEXT,
  price INTEGER DEFAULT 3000,
  duration_mins INTEGER DEFAULT 45,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  medical_notes TEXT,
  total_visits INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  appointment_code TEXT UNIQUE NOT NULL,
  patient_id BIGINT,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_id BIGINT NOT NULL,
  doctor_name TEXT NOT NULL,
  service_id BIGINT NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  fee INTEGER DEFAULT 2500,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
  id BIGSERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_id BIGINT,
  preferred_date TEXT,
  preferred_time TEXT,
  dental_concern TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Testimonials & Reviews Table
CREATE TABLE IF NOT EXISTS testimonials (
  id BIGSERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  photo TEXT,
  rating REAL DEFAULT 5.0,
  treatment TEXT,
  review_text TEXT NOT NULL,
  is_approved INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Insurance Providers Table
CREATE TABLE IF NOT EXISTS insurance_providers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  coverage_summary TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Blog Articles Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Oral Health',
  image TEXT,
  short_desc TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Dr. Ayesha Khan',
  read_time TEXT DEFAULT '4 min read',
  is_published INTEGER DEFAULT 1,
  published_at TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 11. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Clinic',
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 14. CMS Homepage Sections Table
CREATE TABLE IF NOT EXISTS cms_sections (
  section_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content JSONB,
  is_visible INTEGER DEFAULT 1
);

-- ================================================================
-- SEED INITIAL CLINIC DATA
-- ================================================================

-- Default Admin User (Password: admin123)
INSERT INTO admins (username, email, password_hash, name, role)
VALUES (
  'admin',
  'admin@dentalcareclinic.pk',
  '$2a$10$wT0X8XqI91tW1eD4Z7qQDeD9rYV4L7sN.H3t4sA5Z1a9oE0bS6Tee',
  'Dr. Ayesha Khan',
  'Super Admin'
) ON CONFLICT (username) DO NOTHING;

-- Initial Doctors
INSERT INTO doctors (name, qualification, specialization, experience_years, rating, photo, bio, consultation_fee)
VALUES 
  ('Dr. Ayesha Khan', 'BDS, RDS (Gold Medalist), FCPS', 'General & Restorative Dentist', 5, 4.9, 'https://images.unsplash.com/photo-1594824813637-c7e49c71a39b?auto=format&fit=crop&w=400&q=80', 'Dedicated to painless dentistry and smile preservation with advanced digital tools.', 2500),
  ('Dr. Ahmed Raza', 'BDS, M.Orth, FDS RCPS (Glasgow)', 'Specialist Orthodontist', 7, 4.8, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80', 'Expert in clear aligners, aesthetic ceramic braces, and jaw alignment.', 3000),
  ('Dr. Sana Malik', 'BDS, MSc Aesthetic Dentistry', 'Cosmetic Dental Surgeon', 6, 4.9, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80', 'Specializes in porcelain veneers, composite bonding, and full smile makeovers.', 2800),
  ('Dr. Faisal Butt', 'BDS, FCPS (Oral & Maxillofacial)', 'Endodontist & Implantologist', 8, 4.8, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80', 'Specialized in single-visit root canal therapy and titanium implantology.', 3500)
ON CONFLICT DO NOTHING;

-- Initial Services
INSERT INTO services (name, icon, short_desc, full_desc, price)
VALUES 
  ('General Dentistry', 'Sparkles', 'Checkups, deep cleanings, tooth-colored fillings, and preventative care.', 'Comprehensive checkups with ultrasonic scaling, polishing, and composite restorations.', 3000),
  ('Cosmetic Dentistry', 'Smile', 'Whitening, veneers, and complete smile transformations.', 'Porcelain veneers, cosmetic bonding, and gum contouring.', 8000),
  ('Orthodontics', 'Activity', 'Braces and clear aligners for healthy, perfectly aligned teeth.', 'Invisible aligners and precision brackets designed for adults and teens.', 25000),
  ('Root Canal Treatment', 'Shield', 'Painless single-visit therapy with modern rotary instruments.', 'Advanced single-visit rotary endodontics designed to save infected teeth.', 12000),
  ('Dental Implants', 'Heart', 'Permanent natural-looking titanium tooth replacements.', 'Precision dental implants designed to restore biting power and aesthetics.', 45000),
  ('Teeth Extraction', 'Activity', 'Safe, gentle, and painless tooth removal with quick recovery.', 'Gentle surgical extractions and wisdom tooth care.', 4000)
ON CONFLICT DO NOTHING;

-- Initial Settings (Configured for Pakistan & Saifabad coordinates)
INSERT INTO clinic_settings (key, value)
VALUES 
  ('clinic_name', 'Dental Care'),
  ('tagline', 'Healthy Smiles, Brighter Future'),
  ('phone', '+92 42 3578 9000'),
  ('emergency_phone', '+92 300 123 4567'),
  ('email', 'contact@dentalcareclinic.pk'),
  ('address', 'dental care ,street 15 ,saifabad no 1,punjab, Pakistan'),
  ('latitude', '31.4330'),
  ('longitude', '73.0650'),
  ('google_maps_url', 'https://maps.google.com/maps?q=31.4330,73.0650&t=&z=16&ie=UTF8&iwloc=&output=embed'),
  ('operating_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'),
  ('weekly_holiday', 'Sunday'),
  ('working_hours_weekday', '11:00 AM – 12:00 AM'),
  ('working_hours_saturday', '11:00 AM – 12:00 AM'),
  ('working_hours_sunday', 'Closed'),
  ('operating_start_time', '11:00 AM'),
  ('operating_end_time', '12:00 AM'),
  ('currency', 'PKR'),
  ('currency_symbol', 'PKR '),
  ('timezone', 'Asia/Karachi'),
  ('slot_duration', '30')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;

-- Allow public read access to clinic content
DO $$ BEGIN
  CREATE POLICY "Public doctors read" ON doctors FOR SELECT USING (true);
  CREATE POLICY "Public services read" ON services FOR SELECT USING (true);
  CREATE POLICY "Public testimonials read" ON testimonials FOR SELECT USING (is_approved = 1);
  CREATE POLICY "Public insurance read" ON insurance_providers FOR SELECT USING (true);
  CREATE POLICY "Public blog read" ON blog_posts FOR SELECT USING (is_published = 1);
  CREATE POLICY "Public faqs read" ON faqs FOR SELECT USING (true);
  CREATE POLICY "Public gallery read" ON gallery FOR SELECT USING (true);
  CREATE POLICY "Public settings read" ON clinic_settings FOR SELECT USING (true);
  CREATE POLICY "Public cms read" ON cms_sections FOR SELECT USING (true);
  
  -- Allow public submissions (appointments, consultations, contact messages, reviews)
  CREATE POLICY "Public book appointment" ON appointments FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public consultation request" ON consultations FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public contact message" ON contact_messages FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public submit review" ON testimonials FOR INSERT WITH CHECK (true);

  -- Full backend / service role access
  CREATE POLICY "Service role full access admins" ON admins FOR ALL USING (true);
  CREATE POLICY "Service role full access appointments" ON appointments FOR ALL USING (true);
  CREATE POLICY "Service role full access patients" ON patients FOR ALL USING (true);
  CREATE POLICY "Service role full access messages" ON contact_messages FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


