# Dental Care — Complete Modern Dental Clinic Website & Admin CMS

A premium, modern, fully functional and responsive dental clinic website named **Dental Care**, built precisely in alignment with the reference design specifications.

---

## 🌟 Architecture & Highlights

The project is structured into two completely separate parts:
1. **Public-Facing Dental Care Website (`/`)**:
   - Faithful recreation of the reference design (colors `#0756A6`, `#092C59`, `#F4F8FF`, white `#FFFFFF`, modern typography, rounded corners, subtle elevation).
   - **Sticky Navigation Bar** with logo, tooth icon, tagline (*"We Care For Your Smile"* / *"Healthy Smiles, Brighter Future"*), quick search, and appointment CTA.
   - **Hero Section** with high-resolution clinical patient photo, curved aesthetic framing, cursive *"Healthy Smile Happy Life ♡"* script badge, 4 feature badges (*Expert Doctors & Staff*, *Modern Technology*, *Clean & Safe Environment*, *Affordable Treatment*), and an interactive **Opening Hours Card** (11:00 AM – 12:00 AM midnight, Sunday Closed, Emergency Hotline).
   - **Quick Appointment Form** directly below the hero section with real-time slot checking, Sunday prevention, doctor conflict validation, and instant appointment receipt code generation (`DC-2026-XXXX`).
   - **Comprehensive Dental Services Grid** (General Dentistry, Cosmetic, Orthodontics, Root Canal, Dental Implants, Teeth Whitening) with *"Learn More"* details modal and direct booking.
   - **Doctor Profile Cards** matching reference image (Dr. Ayesha Khan, Dr. Ahmed Raza, Dr. Sana Malik, Dr. Faisal Butt) with photos, qualifications, experience, ratings, and profile modal. **100% database-driven.**
   - **Testimonials & Insurance 2-Column Section**: Patient reviews with 5-star ratings on the left, partner insurance panels (Jubilee, EFU, State Life, Askari) and flexible payment methods on the right.
   - **Expandable FAQ Accordion** for common patient questions.
   - **Blog & News Section** with oral health articles, category badges, read times, and full article reader modal.
   - **Contact & Location Area** with clinic address, phone numbers, Google Maps integration, and working contact form.
   - **Footer** with quick navigation, treatment links, newsletter subscription, and copyright notice.

2. **Private Admin Dashboard (`/admin`)**:
   - Completely private and separate: **NEVER exposed on the public homepage or navigation**.
   - Accessible at `/admin` (Login at `/admin/login`).
   - Styled with a dark navy sidebar (`#092C59`) and light blue/white content area (`#F4F8FF`).
   - **Live Statistics Overview**: Total Appointments, Today's Appointments, Pending Appointments, Confirmed Appointments, Total Patients, Active Doctors, and Total Revenue in PKR.
   - **Appointments Overview Interactive Spline Chart** breaking down weekly patient traffic from Monday to Sunday.
   - **Upcoming Appointments Table** with quick status updater (Pending, Confirmed, Completed, Cancelled).
   - **Recent Patients Widget** and **Quick Action Shortcuts**.
   - **Dedicated Management Modules**:
     - **Appointments**: Full CRUD, search by patient/phone, filter by doctor/date/status, reschedule modal, manual booking.
     - **Consultations**: Review patient online inquiries and approve/reject/reschedule.
     - **Patients**: Patient directory, medical history, visit counts, allergy notes.
     - **Doctors**: Add/Edit/Delete doctors, upload photos, set consultation fees, availability days, and active/inactive toggle.
     - **Services**: Manage treatments, descriptions, pricing in PKR, icons, and public visibility.
     - **Testimonials**: Approve, edit, or delete patient reviews.
     - **Insurance**: Manage corporate insurance panels and coverage terms.
     - **Blog**: Author, publish, draft, and delete dental articles.
     - **FAQs**: Add, edit, reorder, and categorize questions.
     - **Gallery**: Manage operatory and smile transformation photos.
     - **Website Content (CMS)**: Control Hero headings, subtext, CTA buttons, and **toggle homepage section visibility**.
     - **Clinic Settings**: Edit clinic name, address, phone numbers, Google Maps embed, operating hours, slot duration, currency (PKR), and timezone (Asia/Karachi).
     - **Admin Profile**: Change administrator name, email, avatar, and password.

---

## 🔐 Admin Credentials

- **Admin URL**: `http://localhost:5000/admin`
- **Username**: `admin`
- **Password**: `admin123`
*(A quick "Use Default Credentials" button is also provided on the login page for convenience).*

---

## ⚙️ Operating Hours & Timezone Rules

- **Timezone**: Pakistan Standard Time (`Asia/Karachi`, UTC+5)
- **Clinic Working Hours**: 11:00 AM – 12:00 AM (Midnight)
- **Operating Days**: Monday through Saturday
- **Sunday**: Strictly **CLOSED** (System enforces backend & frontend rejection of Sunday bookings)
- **Conflict Prevention**: Doctor double-booking prevention for overlapping slots.

---

## 🚀 Running the Project

### Start Production Server (Serves both API and Frontend):
```bash
node server/index.js
```
The application will be live at `http://localhost:5000`.

### Run Development Mode (Vite Hot Reload + Express API):
1. Terminal 1 (Backend API):
   ```bash
   npm run dev:server
   ```
2. Terminal 2 (Vite Frontend):
   ```bash
   npm run dev:client
   ```

### Rebuild Frontend:
```bash
npm run build:client
```

### Run Automated Backend & DB Test Suite:
```bash
node server/test-suite.js
```

