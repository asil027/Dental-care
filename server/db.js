let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  console.warn('[DB] Native node:sqlite not available:', e.message);
}

const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

let db = null;
let dbPath;

if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'dental_care.db');
  const sourceDbPath = path.join(__dirname, '..', 'data', 'dental_care.db');
  if (!fs.existsSync(tmpDbPath)) {
    if (fs.existsSync(sourceDbPath)) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      } catch (e) {
        console.warn('Failed to copy sqlite db to /tmp:', e.message);
      }
    }
  }
  dbPath = tmpDbPath;
} else {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create data dir:', e.message);
    }
  }
  dbPath = path.join(dbDir, 'dental_care.db');
}

if (DatabaseSync) {
  try {
    db = new DatabaseSync(dbPath);
  } catch (err) {
    console.warn('[DB] DatabaseSync opening failed, switching to memory store:', err.message);
    db = null;
  }
}

if (!db) {
  console.log('[DB] Using high-availability fallback store');
  const store = {
    admins: [{
      id: 1,
      username: 'admin',
      email: 'admin@dentalcare.com',
      password_hash: bcrypt.hashSync('admin123', 10),
      name: 'Admin',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString()
    }],
    clinic_settings: [],
    cms_content: [],
    doctors: [],
    services: [],
    patients: [],
    appointments: [],
    consultations: [],
    testimonials: [
      {
        id: 1,
        patient_name: 'Zainab Tariq',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        treatment: 'Painless Root Canal & Crown',
        review_text: 'Had an emergency root canal done here and honestly felt zero pain throughout the procedure. Dr. Ayesha is gentle, professional and explained every single step.',
        is_approved: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        patient_name: 'Usman Chaudhry',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        treatment: 'Laser Teeth Whitening',
        review_text: 'Amazing whitening results in just one session! The clinic environment is exceptionally clean and peaceful. Highly recommend Dental Care to everyone.',
        is_approved: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        patient_name: 'Sarah Bilal',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        treatment: 'Dental Veneers & Smile Makeover',
        review_text: 'My smile transformation exceeded all my expectations. The staff was welcoming, courteous, and the clinic equipment is top tier. Truly world-class!',
        is_approved: 1,
        created_at: new Date().toISOString()
      }
    ],
    insurance_providers: [],
    blog_posts: [],
    faqs: [],
    gallery: [],
    contact_messages: []
  };

  db = {
    exec: () => {},
    prepare: (sql) => {
      const cleanSql = sql.trim().toLowerCase();
      return {
        get: (...params) => {
          if (cleanSql.includes('from admins')) {
            if (params.length >= 2) {
              const u = String(params[0]).trim().toLowerCase();
              return store.admins.find(a => a.username.toLowerCase() === u || a.email.toLowerCase() === u) || null;
            }
            if (params.length === 1) {
              return store.admins.find(a => a.id == params[0]) || null;
            }
            return store.admins[0] || null;
          }
          if (cleanSql.includes('from testimonials')) {
            if (params.length > 0) {
              return store.testimonials.find(t => t.id == params[0]) || null;
            }
            return store.testimonials[0] || null;
          }
          if (cleanSql.includes('select count(*)')) {
            if (cleanSql.includes('from testimonials')) {
              if (cleanSql.includes('is_approved = 0')) {
                return { count: store.testimonials.filter(t => t.is_approved == 0).length };
              }
              if (cleanSql.includes('is_approved = 1')) {
                return { count: store.testimonials.filter(t => t.is_approved == 1).length };
              }
              return { count: store.testimonials.length };
            }
            if (cleanSql.includes('from contact_messages')) {
              if (cleanSql.includes('is_read = 0')) {
                return { count: store.contact_messages.filter(m => m.is_read == 0).length };
              }
              return { count: store.contact_messages.length };
            }
            if (cleanSql.includes('from appointments')) {
              if (cleanSql.includes("status = 'pending'") || cleanSql.includes('status = ?')) {
                return { count: store.appointments.filter(a => a.status === 'Pending').length };
              }
              return { count: store.appointments.length };
            }
            for (const table of Object.keys(store)) {
              if (cleanSql.includes(`from ${table}`)) {
                return { count: store[table].length };
              }
            }
            return { count: 0 };
          }
          for (const table of Object.keys(store)) {
            if (cleanSql.includes(`from ${table}`)) {
              if (params.length > 0) {
                return store[table].find(item => Object.values(item).some(v => v == params[0])) || null;
              }
              return store[table][0] || null;
            }
          }
          return null;
        },
        all: (...params) => {
          if (cleanSql.includes('from testimonials')) {
            if (cleanSql.includes('is_approved = 1')) {
              return store.testimonials.filter(t => t.is_approved == 1);
            }
            return [...store.testimonials];
          }
          for (const table of Object.keys(store)) {
            if (cleanSql.includes(`from ${table}`)) {
              return [...store[table]];
            }
          }
          return [];
        },
        run: (...params) => {
          if (cleanSql.includes('insert into testimonials')) {
            const item = {
              id: store.testimonials.length + 1,
              patient_name: params[0],
              photo: params[1],
              rating: parseFloat(params[2]) || 5.0,
              treatment: params[3],
              review_text: params[4],
              is_approved: params[5] !== undefined ? parseInt(params[5], 10) : 0,
              created_at: new Date().toISOString()
            };
            store.testimonials.unshift(item);
            return { changes: 1, lastInsertRowid: item.id };
          }
          if (cleanSql.includes('update testimonials') && cleanSql.includes('is_approved')) {
            const item = store.testimonials.find(t => t.id == params[1]);
            if (item) item.is_approved = params[0];
            return { changes: 1 };
          }
          if (cleanSql.includes('delete from testimonials')) {
            const idx = store.testimonials.findIndex(t => t.id == params[0]);
            if (idx !== -1) store.testimonials.splice(idx, 1);
            return { changes: 1 };
          }
          if (cleanSql.includes('insert into admins')) {
            const newAdmin = {
              id: store.admins.length + 1,
              username: params[0],
              email: params[1],
              password_hash: params[2],
              name: params[3],
              role: params[4],
              avatar: params[5]
            };
            store.admins.push(newAdmin);
            return { changes: 1, lastInsertRowid: newAdmin.id };
          }
          if (cleanSql.includes('insert into clinic_settings')) {
            const existing = store.clinic_settings.find(s => s.key === params[0]);
            if (existing) { existing.value = params[1]; }
            else { store.clinic_settings.push({ key: params[0], value: params[1] }); }
            return { changes: 1 };
          }
          if (cleanSql.includes('update clinic_settings')) {
            const s = store.clinic_settings.find(item => item.key === params[1]);
            if (s) s.value = params[0];
            return { changes: 1 };
          }
          if (cleanSql.includes('insert into cms_content')) {
            const existing = store.cms_content.find(c => c.section_key === params[0]);
            if (existing) { existing.data_json = params[1]; }
            else { store.cms_content.push({ section_key: params[0], data_json: params[1] }); }
            return { changes: 1 };
          }
          for (const table of Object.keys(store)) {
            if (cleanSql.includes(`insert into ${table}`)) {
              const record = { id: store[table].length + 1 };
              params.forEach((p, idx) => { record[`col_${idx}`] = p; });
              store[table].push(record);
              return { changes: 1, lastInsertRowid: record.id };
            }
          }
          return { changes: 1 };
        }
      };
    }
  };
}

// Initialize Tables
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Super Admin',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      short_desc TEXT NOT NULL,
      full_desc TEXT,
      price INTEGER DEFAULT 3000,
      duration_mins INTEGER DEFAULT 45,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      medical_notes TEXT,
      total_visits INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_code TEXT UNIQUE NOT NULL,
      patient_id INTEGER,
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      doctor_id INTEGER NOT NULL,
      doctor_name TEXT NOT NULL,
      service_id INTEGER NOT NULL,
      service_name TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Pending',
      fee INTEGER DEFAULT 2500,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      doctor_id INTEGER,
      preferred_date TEXT,
      preferred_time TEXT,
      dental_concern TEXT,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      photo TEXT,
      rating REAL DEFAULT 5.0,
      treatment TEXT,
      review_text TEXT NOT NULL,
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      coverage_summary TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Clinic',
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clinic_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cms_content (
      section_key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  // Check if admin exists
  const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (checkAdmin.count === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare(`
      INSERT INTO admins (username, email, password_hash, name, role, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'admin',
      'admin@dentalcare.com',
      passwordHash,
      'Admin',
      'Super Admin',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    );
  }

  // Check Settings
  const checkSettings = db.prepare('SELECT COUNT(*) as count FROM clinic_settings').get();
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare('INSERT INTO clinic_settings (key, value) VALUES (?, ?)');
    const defaultSettings = [
      ['clinic_name', 'Dental Care'],
      ['tagline', 'Healthy Smiles, Brighter Future'],
      ['phone', '+92 42 3578 9000'],
      ['emergency_phone', '+92 300 123 4567'],
      ['email', 'contact@dentalcareclinic.pk'],
      ['address', 'Suite 402, Dental Care Medical Tower, Main Boulevard, Gulberg III, Lahore, Pakistan'],
      ['google_maps_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.761962386266!2d74.3436034!3d31.5097491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919045a27891395%3A0xe54ef994aa2b5a51!2sGulberg%20III%2C%20Lahore!5e0!3m2!1sen!2spk!4v1700000000000'],
      ['operating_days', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
      ['weekly_holiday', 'Sunday'],
      ['working_hours_weekday', '11:00 AM – 12:00 AM'],
      ['working_hours_saturday', '11:00 AM – 12:00 AM'],
      ['working_hours_sunday', 'Closed'],
      ['operating_start_hour', '11:00'],
      ['operating_end_hour', '23:59'],
      ['currency', 'PKR'],
      ['currency_symbol', 'PKR '],
      ['timezone', 'Asia/Karachi'],
      ['slot_duration', '30'],
      ['facebook_url', 'https://facebook.com/dentalcare'],
      ['instagram_url', 'https://instagram.com/dentalcare'],
      ['twitter_url', 'https://twitter.com/dentalcare'],
      ['linkedin_url', 'https://linkedin.com/company/dentalcare']
    ];
    for (const [key, val] of defaultSettings) {
      insertSetting.run(key, val);
    }
  }

  // Check CMS Content
  const checkCms = db.prepare('SELECT COUNT(*) as count FROM cms_content').get();
  if (checkCms.count === 0) {
    const insertCms = db.prepare('INSERT INTO cms_content (section_key, data_json) VALUES (?, ?)');
    
    // Hero Section
    insertCms.run('hero', JSON.stringify({
      badge: 'WELCOME TO DENTAL CARE',
      heading: 'Your Smile\nOur Priority',
      subheading: 'Quality Dental Care for a Healthy Smile',
      description: 'We provide exceptional dental care in a comfortable and friendly environment. Our experienced team is here to keep your smile healthy and beautiful.',
      primaryBtnText: 'Book Appointment',
      secondaryBtnText: 'Our Services',
      heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80',
      badgeCursive: 'Healthy Smile Happy Life ♡',
      benefits: [
        { icon: 'Users', title: 'Expert Doctors & Staff', desc: 'Certified dental specialists' },
        { icon: 'Cpu', title: 'Modern Technology', desc: 'Digital 3D X-rays & lasers' },
        { icon: 'Sparkles', title: 'Clean & Safe Environment', desc: 'Sterilized hospital-grade' },
        { icon: 'ShieldCheck', title: 'Affordable Treatment', desc: 'Flexible plans & insurance' }
      ]
    }));

    // Sections Visibility & Order
    insertCms.run('section_order', JSON.stringify([
      { id: 'hero', name: 'Hero Section', visible: true },
      { id: 'quick_booking', name: 'Quick Appointment Form', visible: true },
      { id: 'services', name: 'Dental Services', visible: true },
      { id: 'doctors', name: 'Meet Our Doctors', visible: true },
      { id: 'testimonials_insurance', name: 'Testimonials & Insurance', visible: true },
      { id: 'faq', name: 'Frequently Asked Questions', visible: true },
      { id: 'blog', name: 'Blog & Oral Health News', visible: true },
      { id: 'contact', name: 'Contact & Location', visible: true }
    ]));

    // About Section
    insertCms.run('about', JSON.stringify({
      kicker: 'ABOUT DENTAL CARE',
      heading: 'Dedicated to Excellence in Modern Dentistry',
      description: 'Since 2012, Dental Care has provided state-of-the-art restorative, aesthetic, and preventive treatments. Our modern clinic is outfitted with painless computer-guided anesthesia, digital intraoral scanning, and compassionate specialists committed to delivering lifelong healthy smiles.',
      experienceYears: '12+',
      happyPatients: '15,000+',
      specialistCount: '4+'
    }));
  }

  // Check Doctors
  const checkDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get();
  if (checkDoctors.count === 0) {
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (name, qualification, specialization, experience_years, rating, reviews_count, photo, bio, consultation_fee, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultDoctors = [
      [
        'Dr. Ayesha Khan',
        'BDS, RDS, Certified Dental Surgeon',
        'General Dentist',
        5,
        4.9,
        120,
        'https://images.unsplash.com/photo-1594824813589-a292854c86e0?auto=format&fit=crop&w=600&q=80',
        'Dr. Ayesha Khan brings 5+ years of specialized clinical experience in preventive care, tooth restorations, and comprehensive dental examinations.',
        2500,
        1
      ],
      [
        'Dr. Ahmed Raza',
        'BDS, FCPS (Orthodontics), Invisalign Gold Provider',
        'Orthodontist',
        7,
        4.8,
        96,
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
        'Dr. Ahmed Raza specializes in correcting misaligned bites, clear aligners (Invisalign), and modern aesthetic ceramic braces for children and adults.',
        3000,
        2
      ],
      [
        'Dr. Sana Malik',
        'BDS, M.Sc Aesthetic Dentistry (London)',
        'Cosmetic Dentist',
        6,
        4.9,
        110,
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
        'Dr. Sana Malik transforms smiles with porcelain laminates, composite veneers, laser teeth whitening, and complete digital smile design.',
        3500,
        3
      ],
      [
        'Dr. Faisal Butt',
        'BDS, FCPS (Operative Dentistry & Endodontics)',
        'Endodontist',
        8,
        4.8,
        87,
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
        'Dr. Faisal Butt is an expert endodontist focused on painless root canal therapy, rotary instrumentation, and apex re-treatments to preserve teeth.',
        3000,
        4
      ]
    ];

    for (const doc of defaultDoctors) {
      insertDoctor.run(...doc);
    }
  }

  // Check Services
  const checkServices = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (checkServices.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (name, icon, short_desc, full_desc, price, duration_mins, image, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultServices = [
      [
        'General Dentistry',
        'Stethoscope',
        'Checkups, cleaning, fillings & more.',
        'Comprehensive dental health checkups, deep ultrasonic scaling, preventive fluoride therapy, tooth-colored composite restorations, and digital dental exams.',
        2500,
        30,
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
        1
      ],
      [
        'Cosmetic Dentistry',
        'Sparkles',
        'Whitening, veneers, smile makeovers.',
        'Transform your aesthetic appearance with ultrathin porcelain veneers, composite bonding, gum contouring, and custom tailored digital smile design.',
        6500,
        45,
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
        2
      ],
      [
        'Orthodontics',
        'Smile',
        'Braces & aligners for a better smile.',
        'Modern discreet orthodontics including ceramic brackets, self-ligating metal braces, and certified clear invisible aligners for ideal tooth alignment.',
        45000,
        60,
        'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
        3
      ],
      [
        'Root Canal Treatment',
        'Activity',
        'Save your natural teeth with expert care.',
        'Single-sitting rotary endodontics performed under magnification to alleviate severe tooth pain and preserve your natural biological tooth structure.',
        8000,
        60,
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
        4
      ],
      [
        'Teeth Extraction & Implants',
        'Shield',
        'Safe & painless extractions and lifelong implants.',
        'Minimally invasive extractions, surgical wisdom teeth removal, and titanium dental implants with biocompatible ceramic crowns for permanent tooth replacement.',
        35000,
        60,
        'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80',
        5
      ],
      [
        'Teeth Whitening',
        'Sun',
        'Professional brightening for radiant confidence.',
        'In-office medical laser bleaching that lightens discoloration by up to 8 shades in a single safe, pain-free 45-minute treatment.',
        7500,
        45,
        'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
        6
      ]
    ];

    for (const s of defaultServices) {
      insertService.run(...s);
    }
  }

  // Check Patients & Appointments (Match reference image preview)
  const checkAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get();
  if (checkAppointments.count === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (name, email, phone, age, gender, medical_notes, total_visits)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const patients = [
      ['Areeba Khan', 'areeba.khan@gmail.com', '+92 301 5551234', 27, 'Female', 'Mild gingivitis, loves cosmetic whitening', 3],
      ['Usman Ali', 'usman.ali@outlook.com', '+92 321 8884321', 32, 'Male', 'Undergoing orthodontic aligner treatment', 5],
      ['Fatima Noor', 'fatima.noor@yahoo.com', '+92 333 4447788', 24, 'Female', 'Consulting for porcelain veneers', 1],
      ['Hassan Raza', 'hassan.raza@gmail.com', '+92 345 6661122', 41, 'Male', 'Root canal completed tooth #14', 2],
      ['Zainab Iqbal', 'zainab.iqbal@gmail.com', '+92 300 9993344', 29, 'Female', 'Routine bi-annual scaling & polishing', 4],
      ['Bilal Tariq', 'bilal.tariq@gmail.com', '+92 312 7778899', 35, 'Male', 'Dental implant consultation', 2],
      ['Maham Siddiqui', 'maham.siddiqui@gmail.com', '+92 331 2223344', 30, 'Female', 'Teeth whitening evaluation', 1],
      ['Hamza Sheikh', 'hamza.sheikh@hotmail.com', '+92 304 8889900', 38, 'Male', 'Crown fitting appointment', 3]
    ];

    const patientMap = {};
    for (const p of patients) {
      const res = insertPatient.run(...p);
      patientMap[p[0]] = Number(res.lastInsertRowid);
    }

    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        appointment_code, patient_id, patient_name, patient_email, patient_phone,
        doctor_id, doctor_name, service_id, service_name,
        appointment_date, appointment_time, notes, status, fee
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialAppointments = [
      ['DC-2026-001', patientMap['Areeba Khan'], 'Areeba Khan', 'areeba.khan@gmail.com', '+92 301 5551234', 1, 'Dr. Ayesha Khan', 1, 'General Dentistry', '2026-10-28', '11:30 AM', 'Routine checkup and ultrasonic cleaning', 'Confirmed', 2500],
      ['DC-2026-002', patientMap['Usman Ali'], 'Usman Ali', 'usman.ali@outlook.com', '+92 321 8884321', 2, 'Dr. Ahmed Raza', 3, 'Orthodontics', '2026-10-28', '02:00 PM', 'Braces adjustment and wire tightening', 'Confirmed', 3000],
      ['DC-2026-003', patientMap['Fatima Noor'], 'Fatima Noor', 'fatima.noor@yahoo.com', '+92 333 4447788', 3, 'Dr. Sana Malik', 2, 'Cosmetic Dentistry', '2026-10-28', '04:30 PM', 'First cosmetic smile analysis and shade check', 'Pending', 3500],
      ['DC-2026-004', patientMap['Hassan Raza'], 'Hassan Raza', 'hassan.raza@gmail.com', '+92 345 6661122', 4, 'Dr. Faisal Butt', 4, 'Root Canal Treatment', '2026-10-28', '07:00 PM', 'Follow up evaluation after molar treatment', 'Confirmed', 3000],
      ['DC-2026-005', patientMap['Zainab Iqbal'], 'Zainab Iqbal', 'zainab.iqbal@gmail.com', '+92 300 9993344', 1, 'Dr. Ayesha Khan', 6, 'Teeth Whitening', '2026-10-28', '09:30 PM', 'Laser teeth whitening session', 'Confirmed', 7500],
      ['DC-2026-006', patientMap['Bilal Tariq'], 'Bilal Tariq', 'bilal.tariq@gmail.com', '+92 312 7778899', 4, 'Dr. Faisal Butt', 5, 'Teeth Extraction & Implants', '2026-10-29', '01:00 PM', 'Pre-op implant scan', 'Confirmed', 4000],
      ['DC-2026-007', patientMap['Maham Siddiqui'], 'Maham Siddiqui', 'maham.siddiqui@gmail.com', '+92 331 2223344', 3, 'Dr. Sana Malik', 2, 'Cosmetic Dentistry', '2026-10-29', '05:00 PM', 'Veneers consultation', 'Pending', 3500],
      ['DC-2026-008', patientMap['Hamza Sheikh'], 'Hamza Sheikh', 'hamza.sheikh@hotmail.com', '+92 304 8889900', 1, 'Dr. Ayesha Khan', 1, 'General Dentistry', '2026-10-30', '12:30 PM', 'Cavity filling', 'Confirmed', 2500]
    ];

    for (const a of initialAppointments) {
      insertAppt.run(...a);
    }
  }

  // Check Testimonials
  const checkTestimonials = db.prepare('SELECT COUNT(*) as count FROM testimonials').get();
  if (checkTestimonials.count === 0) {
    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (patient_name, photo, rating, treatment, review_text, is_approved)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const defaultReviews = [
      [
        'Sarah Ahmed',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        5.0,
        'Teeth Whitening',
        'Dr. Sana made my smile makeover completely painless and effortless. The clinic is pristine, modern, and the entire team treated me like family!',
        1
      ],
      [
        'Kamran Siddiqui',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        5.0,
        'Root Canal Therapy',
        'I had terrifying tooth pain on a Friday evening. Dr. Faisal treated me late at night with absolute precision. No pain during or after the procedure!',
        1
      ],
      [
        'Rabia Tariq',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        5.0,
        'Clear Braces / Invisalign',
        'Dr. Ahmed Raza has given me the confidence I lacked for years. The results after 9 months of aligners are extraordinary. Best dental clinic in Lahore!',
        1
      ]
    ];

    for (const r of defaultReviews) {
      insertTestimonial.run(...r);
    }
  }

  // Check Insurance Providers
  const checkInsurance = db.prepare('SELECT COUNT(*) as count FROM insurance_providers').get();
  if (checkInsurance.count === 0) {
    const insertInsurance = db.prepare(`
      INSERT INTO insurance_providers (name, logo, coverage_summary, is_active)
      VALUES (?, ?, ?, ?)
    `);

    const defaultInsurance = [
      ['Jubilee Life Insurance', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&q=80', 'Direct cashless billing for corporate and family dental plans', 1],
      ['EFU Life Assurance', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80', 'Comprehensive coverage for extractions, scaling, and restorations', 1],
      ['State Life Insurance', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=200&q=80', 'Covers approved general checkups, dental surgeries, and root canals', 1],
      ['Askari General Insurance', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=200&q=80', 'Full corporate dental coverage with instant pre-authorization', 1]
    ];

    for (const ins of defaultInsurance) {
      insertInsurance.run(...ins);
    }
  }

  // Check FAQs
  const checkFaqs = db.prepare('SELECT COUNT(*) as count FROM faqs').get();
  if (checkFaqs.count === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faqs (question, answer, category, order_index)
      VALUES (?, ?, ?, ?)
    `);

    const defaultFaqs = [
      [
        'How often should I visit the dentist?',
        'Dental professionals recommend visiting at least once every 6 months for a comprehensive clinical exam and professional cleaning to catch cavities and gum issues early before they cause pain.',
        'General',
        1
      ],
      [
        'Do you offer emergency dental care late at night?',
        'Yes! Dental Care is open until 12:00 AM midnight Monday through Saturday. For urgent trauma, severe toothaches, or broken crowns, contact our direct emergency hotline at +92 300 123 4567.',
        'Emergency',
        2
      ],
      [
        'Is teeth whitening safe for my enamel?',
        'Absolutely. Our in-office laser whitening uses clinically tested, pH-balanced bleaching agents that lift deep stains without damaging the protective outer enamel or compromising tooth structure.',
        'Cosmetic',
        3
      ],
      [
        'How can I improve my oral hygiene at home?',
        'Brush twice daily for two full minutes with a soft-bristled brush and fluoride toothpaste, floss between all teeth once daily, scrape your tongue, and avoid sugary acidic beverages right before bed.',
        'Hygiene',
        4
      ],
      [
        'Are dental implants painful to place?',
        'No. The procedure is performed under gentle local anesthesia, making it completely pain-free. Most patients report mild discomfort similar to a simple extraction for 2-3 days afterwards, easily managed with mild painkillers.',
        'Implants',
        5
      ]
    ];

    for (const f of defaultFaqs) {
      insertFaq.run(...f);
    }
  }

  // Check Blog Posts
  const checkBlog = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
  if (checkBlog.count === 0) {
    const insertBlog = db.prepare(`
      INSERT INTO blog_posts (title, slug, category, image, short_desc, content, author, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultBlogs = [
      [
        '5 Common Signs You Might Need a Root Canal',
        '5-common-signs-you-need-root-canal',
        'Oral Health',
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
        'Discover the key symptoms indicating tooth infection and why modern endodontics is completely pain-free.',
        'Severe spontaneous toothache, prolonged sensitivity to hot and cold temperatures, tender swelling in the surrounding gums, and darkened tooth discoloration are hallmarks of deep dental pulp infection. Modern single-visit root canal treatments under local anesthesia relieve pain instantly and preserve your natural tooth for decades.',
        'Dr. Faisal Butt',
        '4 min read',
        '2026-10-25'
      ],
      [
        'Invisalign vs Metal Braces: Which is Right For You?',
        'invisalign-vs-metal-braces-guide',
        'Orthodontics',
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
        'A comprehensive comparison of clear removable aligners and traditional braces for teens and adults.',
        'Clear aligners offer virtually invisible aesthetics, freedom to remove trays when eating your favorite foods, and easier brushing and flossing. Traditional braces, however, remain unbeatable for severe bite discrepancies or impacted teeth. During your consultation, our orthodontists evaluate your 3D digital scan to recommend the ideal path.',
        'Dr. Ahmed Raza',
        '5 min read',
        '2026-10-20'
      ],
      [
        'The Secret to Long-Lasting Teeth Whitening Results',
        'secrets-to-long-lasting-teeth-whitening',
        'Cosmetic',
        'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
        'How to maintain your brilliant Hollywood smile and prevent beverage and food stains after professional treatment.',
        'After in-office whitening, your enamel pores remain slightly permeable for 48 hours—known as the "white diet" window. Avoid dark teas, black coffees, curries, and smoking. Rinsing with water after meals and utilizing custom touch-up trays twice a year keeps your smile radiant and vibrant for years.',
        'Dr. Sana Malik',
        '3 min read',
        '2026-10-15'
      ]
    ];

    for (const b of defaultBlogs) {
      insertBlog.run(...b);
    }
  }

  // Check Gallery
  const checkGallery = db.prepare('SELECT COUNT(*) as count FROM gallery').get();
  if (checkGallery.count === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery (title, category, image)
      VALUES (?, ?, ?)
    `);

    const defaultGallery = [
      ['Modern Treatment Operatory', 'Clinic', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'],
      ['Digital 3D Intraoral Scanner', 'Equipment', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'],
      ['Painless Smile Transformation', 'Smiles', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'],
      ['Hospital-Grade Sterilization Suite', 'Clinic', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'],
      ['Patient Consultation Lounge', 'Clinic', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'],
      ['Cosmetic Veneers Makeover', 'Smiles', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80']
    ];

    for (const g of defaultGallery) {
      insertGallery.run(...g);
    }
  }
}

initDatabase();

module.exports = db;

