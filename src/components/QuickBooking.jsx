import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, Stethoscope, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getTodayDateKarachi, isDateOff, generateTimeSlots, getDayName, getNextAvailableWorkingDate } from '../utils/time';

export default function QuickBooking({ doctors = [], services = [], settings = {}, onBookingSuccess }) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    doctor_id: '',
    service_id: '',
    appointment_date: getNextAvailableWorkingDate(settings?.weekly_holiday),
    appointment_time: '11:30 AM',
    notes: ''
  });

  const defaultSlots = generateTimeSlots(
    settings?.operating_start_time || '11:00 AM',
    settings?.operating_end_time || '12:00 AM',
    settings?.slot_duration || 30
  );
  const [availableSlots, setAvailableSlots] = useState(defaultSlots);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationData, setConfirmationData] = useState(null);

  // Set default doctor & service when loaded
  useEffect(() => {
    if (doctors.length > 0 && !formData.doctor_id) {
      setFormData((prev) => ({ ...prev, doctor_id: doctors[0].id }));
    }
    if (services.length > 0 && !formData.service_id) {
      setFormData((prev) => ({ ...prev, service_id: services[0].id }));
    }
  }, [doctors, services]);

  // When settings load or change, ensure default date is an available working day
  useEffect(() => {
    if (settings?.weekly_holiday && isDateOff(formData.appointment_date, settings.weekly_holiday)) {
      setFormData((prev) => ({
        ...prev,
        appointment_date: getNextAvailableWorkingDate(settings.weekly_holiday)
      }));
      setErrorMessage('');
    }
  }, [settings?.weekly_holiday]);

  // Check slot availability when doctor or date changes
  useEffect(() => {
    if (!formData.doctor_id || !formData.appointment_date) return;

    if (isDateOff(formData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(formData.appointment_date);
      setErrorMessage(`Dental Care clinic is closed on ${day}s. Configured off day: ${settings?.weekly_holiday || 'Friday'}.`);
      setAvailableSlots([]);
      return;
    } else {
      setErrorMessage('');
    }

    let active = true;
    const fetchSlots = async () => {
      setIsCheckingSlots(true);
      try {
        const res = await apiRequest(`/appointments/check-availability?doctor_id=${formData.doctor_id}&date=${formData.appointment_date}`);
        if (!active) return;
        if (res.isClosed) {
          setErrorMessage(res.message || 'Clinic is closed on this date.');
          setAvailableSlots([]);
        } else {
          setAvailableSlots(res.availableSlots || []);
          setBookedSlots(res.bookedSlots || []);
          if (res.availableSlots?.length > 0 && !res.availableSlots.includes(formData.appointment_time)) {
            setFormData((prev) => ({ ...prev, appointment_time: res.availableSlots[0] }));
          }
        }
      } catch (err) {
        setAvailableSlots(defaultSlots);
      } finally {
        if (active) setIsCheckingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      active = false;
    };
  }, [formData.doctor_id, formData.appointment_date, settings?.weekly_holiday]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'appointment_date') {
      if (!isDateOff(value, settings?.weekly_holiday)) {
        setErrorMessage('');
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isDateOff(formData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(formData.appointment_date);
      setErrorMessage(`Clinic is closed on ${day}s. Please select a working day.`);
      return;
    }

    if (!formData.appointment_time) {
      setErrorMessage('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/appointments/book', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      // Save locally to ensure immediate persistence across reloads
      try {
        const localAppts = JSON.parse(localStorage.getItem('dc_submitted_appointments') || '[]');
        const newRecord = res.appointment || {
          id: Date.now(),
          ...formData,
          status: 'Pending',
          appointment_code: `DC-${Date.now().toString().slice(-4)}`,
          created_at: new Date().toISOString()
        };
        localAppts.unshift(newRecord);
        localStorage.setItem('dc_submitted_appointments', JSON.stringify(localAppts));
      } catch (e) {}

      setConfirmationData(res.appointment);
      if (onBookingSuccess) onBookingSuccess(res.appointment);

      // Reset form
      setFormData((prev) => ({
        ...prev,
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        appointment_date: getNextAvailableWorkingDate(settings?.weekly_holiday),
        notes: ''
      }));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="appointments" className="relative -mt-6 lg:-mt-10 z-30 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-blue-100/80 p-6 sm:p-8 lg:p-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0756A6]" />
              Quick Online Booking
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#092C59] tracking-tight">
              Book Your Dental Appointment
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your preferred specialist and time. Operating hours: {settings?.operating_start_time || '11:00 AM'} – {settings?.operating_end_time || '12:00 AM'} ({settings?.weekly_holiday && settings.weekly_holiday.toLowerCase() !== 'none' ? `${settings.weekly_holiday} Closed` : 'Open Daily'}).
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-right">
            <div className="p-3 bg-blue-50 rounded-2xl text-[#0756A6]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#092C59]">Pakistan Standard Time</div>
              <div className="text-[11px] text-slate-500">Asia/Karachi • Direct DB Synced</div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Booking Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="patient_name"
                  required
                  placeholder="e.g. Areeba Khan"
                  value={formData.patient_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="patient_email"
                  required
                  placeholder="e.g. areeba@example.com"
                  value={formData.patient_email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="patient_phone"
                  required
                  placeholder="e.g. +92 301 5551234"
                  value={formData.patient_phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Select Service */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Service *
              </label>
              <div className="relative">
                <select
                  name="service_id"
                  required
                  value={formData.service_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition appearance-none cursor-pointer"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price ? `PKR ${s.price.toLocaleString()}` : 'Consultation'})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Select Doctor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Doctor *
              </label>
              <div className="relative">
                <select
                  name="doctor_id"
                  required
                  value={formData.doctor_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition appearance-none cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Select Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Date {settings?.weekly_holiday && settings.weekly_holiday.toLowerCase() !== 'none' ? `(${settings.weekly_holiday} Off)` : ''} *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  name="appointment_date"
                  required
                  min={getTodayDateKarachi()}
                  value={formData.appointment_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition cursor-pointer"
                />
              </div>
            </div>

            {/* Select Time Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Available Time Slot *</span>
                {isCheckingSlots && (
                  <span className="text-[10px] text-blue-600 font-normal flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> checking...
                  </span>
                )}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  name="appointment_time"
                  required
                  disabled={availableSlots.length === 0}
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} (Available)
                      </option>
                    ))
                  ) : (
                    <option value="">No slots available (Closed)</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting || availableSlots.length === 0}
                className="w-full py-3 px-6 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 text-blue-200" />
                    <span>Book Now</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>

      </div>

      {/* Booking Confirmation Receipt Modal */}
      {confirmationData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#092C59]">
                Appointment Booked!
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Your booking reference number is{' '}
                <span className="font-bold text-[#0756A6]">{confirmationData.appointment_code}</span>
              </p>
            </div>

            <div className="my-6 p-5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{confirmationData.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-800">{confirmationData.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800">{confirmationData.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-[#0756A6]">
                  {confirmationData.appointment_date} at {confirmationData.appointment_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Fee:</span>
                <span className="font-bold text-emerald-700">PKR {Number(confirmationData.fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">
                  {confirmationData.status}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center space-y-1 mb-6">
              <p>Our reception team will call or WhatsApp you to confirm your arrival.</p>
              <p>For urgent queries, call our clinic desk at +92 42 3578 9000.</p>
            </div>

            <button
              onClick={() => setConfirmationData(null)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition shadow-md"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

