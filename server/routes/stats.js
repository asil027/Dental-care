const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    let supaAppointments = null;
    let supaMessages = null;
    let supaTestimonials = null;

    if (supabase) {
      try {
        const [apptsRes, msgsRes, testsRes] = await Promise.all([
          supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
          supabase.from('contact_messages').select('*').order('id', { ascending: false }),
          supabase.from('testimonials').select('*').order('id', { ascending: false })
        ]);
        if (!apptsRes.error && apptsRes.data) supaAppointments = apptsRes.data;
        if (!msgsRes.error && msgsRes.data) supaMessages = msgsRes.data;
        if (!testsRes.error && testsRes.data) supaTestimonials = testsRes.data;
      } catch (e) {
        console.warn('[Supabase Stats Error]', e.message);
      }
    }

    // 1. Total counts
    const totalAppointments = supaAppointments 
      ? supaAppointments.length 
      : db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;

    const pendingAppointments = supaAppointments 
      ? supaAppointments.filter(a => a.status === 'Pending').length 
      : db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Pending'").get().count;

    const confirmedAppointments = supaAppointments 
      ? supaAppointments.filter(a => a.status === 'Confirmed').length 
      : db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Confirmed'").get().count;

    const completedAppointments = supaAppointments 
      ? supaAppointments.filter(a => a.status === 'Completed').length 
      : db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Completed'").get().count;
    
    // Today's date in Asia/Karachi
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
    const todayAppointments = supaAppointments 
      ? supaAppointments.filter(a => a.appointment_date === todayStr).length 
      : db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(todayStr).count;

    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors WHERE is_active = 1').get().count;
    const totalConsultations = db.prepare('SELECT COUNT(*) as count FROM consultations').get().count;
    
    // Inquiries / Messages & Testimonial review counts
    const totalMessages = supaMessages 
      ? supaMessages.length 
      : db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;

    const unreadMessages = supaMessages 
      ? supaMessages.filter(m => !m.is_read).length 
      : db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get().count;

    const totalTestimonials = supaTestimonials 
      ? supaTestimonials.length 
      : db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;

    const pendingTestimonials = supaTestimonials 
      ? supaTestimonials.filter(t => !t.is_approved).length 
      : db.prepare('SELECT COUNT(*) as count FROM testimonials WHERE is_approved = 0').get().count;

    const recentMessages = supaMessages 
      ? supaMessages.slice(0, 6) 
      : db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 6').all();

    const recentTestimonials = supaTestimonials 
      ? supaTestimonials.slice(0, 6) 
      : db.prepare('SELECT * FROM testimonials ORDER BY id DESC LIMIT 6').all();

    // Total Revenue (sum of fees of confirmed/completed appointments)
    let totalRevenue = 0;
    if (supaAppointments) {
      totalRevenue = supaAppointments
        .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
        .reduce((sum, a) => sum + (Number(a.fee) || 0), 0);
    } else {
      const revRow = db.prepare("SELECT SUM(fee) as revenue FROM appointments WHERE status IN ('Confirmed', 'Completed')").get();
      totalRevenue = revRow.revenue || 0;
    }

    // 2. Upcoming / Recent Appointments for table
    const upcomingAppointments = supaAppointments 
      ? supaAppointments.slice(0, 8) 
      : db.prepare(`
          SELECT id, patient_name, doctor_name, appointment_date, appointment_time, status, fee, service_name, appointment_code
          FROM appointments
          ORDER BY appointment_date DESC, appointment_time ASC
          LIMIT 8
        `).all();

    // 3. Recent Patients with their latest doctor & time
    const recentPatients = db.prepare(`
      SELECT p.id, p.name, p.phone, p.total_visits,
             a.appointment_time, a.appointment_date, a.doctor_name
      FROM patients p
      LEFT JOIN (
        SELECT patient_id, appointment_time, appointment_date, doctor_name
        FROM appointments
        ORDER BY appointment_date DESC
      ) a ON a.patient_id = p.id
      ORDER BY p.id DESC
      LIMIT 5
    `).all();

    // 4. Weekly appointments chart (Mon to Sun)
    // Map dates of this week
    const now = new Date();
    // find Monday of current week
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(dStr).count;
      weeklyData.push({
        day: weekLabels[i],
        date: dStr,
        appointments: count
      });
    }

    // Monthly breakdown (last 6 months)
    const monthlyStats = db.prepare(`
      SELECT SUBSTR(appointment_date, 1, 7) as month, COUNT(*) as count, SUM(fee) as revenue
      FROM appointments
      GROUP BY SUBSTR(appointment_date, 1, 7)
      ORDER BY month DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      stats: {
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        totalPatients,
        totalDoctors,
        totalConsultations,
        totalRevenue,
        totalMessages,
        unreadMessages,
        totalTestimonials,
        pendingTestimonials
      },
      upcomingAppointments,
      recentPatients,
      recentMessages,
      recentTestimonials,
      weeklyChart: weeklyData,
      monthlyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

