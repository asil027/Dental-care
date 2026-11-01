import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Stethoscope
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import {
  getTodayDateKarachi,
  isDateOff,
  generateTimeSlots,
  getDayName,
  getNextAvailableWorkingDate
} from '../utils/time';

export default function BookingModal({
  isOpen,
  onClose,
  doctors = [],
  services = [],
  settings = {},
  preSelectedDoctor = null,
  preSelectedService = null,
  initialMode = 'appointment'
}) {
  const [activeTab, setActiveTab] = useState(initialMode || 'appointment');

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
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedAppt, setConfirmedAppt] = useState(null);
  const [confirmedConsultation, setConfirmedConsultation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode || 'appointment');
      setConfirmedAppt(null);
      setConfirmedConsultation(null);
      setErrorMessage('');
      setFormData({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        doctor_id: preSelectedDoctor ? preSelectedDoctor.id : (doctors[0]?.id || ''),
        service_id: preSelectedService ? preSelectedService.id : (services[0]?.id || ''),
        appointment_date: getNextAvailableWorkingDate(settings?.weekly_holiday),
        appointment_time: '11:30 AM',
        notes: ''
      });
    }
  }, [isOpen, preSelectedDoctor, preSelectedService, doctors, services, settings?.weekly_holiday, initialMode]);

  useEffect(() => {
    if (settings?.weekly_holiday && isDateOff(formData.appointment_date, settings.weekly_holiday)) {
      setFormData((prev) => ({
        ...prev,
        appointment_date: getNextAvailableWorkingDate(settings.weekly_holiday)
      }));
      setErrorMessage('');
    }
  }, [settings?.weekly_holiday]);

  useEffect(() => {
    if (!formData.doctor_id || !formData.appointment_date) return;

    if (isDateOff(formData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(formData.appointment_date);
      setErrorMessage(`Clinic is closed on ${day}s. Configured off day: ${settings?.weekly_holiday || 'Sunday'}.`);
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'appointment_date' && !isDateOff(value, settings?.weekly_holiday)) {
      setErrorMessage('');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isDateOff(formData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(formData.appointment_date);
      setErrorMessage(`Clinic is closed on ${day}s. Please select an available working day.`);
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

      setConfirmedAppt(res.appointment);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.patient_name || !formData.patient_phone || !formData.notes) {
      setErrorMessage('Please provide your name, phone number, and describe your dental concern.');
      return;
    }

    if (formData.appointment_date && isDateOff(formData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(formData.appointment_date);
      setErrorMessage(`Clinic is closed on ${day}s. Please select an open working day.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patient_name: formData.patient_name,
        patient_email: formData.patient_email || '',
        patient_phone: formData.patient_phone,
        doctor_id: formData.doctor_id ? parseInt(formData.doctor_id, 10) : null,
        preferred_date: formData.appointment_date || null,
        preferred_time: formData.appointment_time || null,
        dental_concern: formData.notes
      };

      const res = await apiRequest('/consultations/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const assignedDoc = doctors.find((d) => d.id == formData.doctor_id);
      const newRecord = res.consultation || {
        id: Date.now(),
        ...payload,
        doctor_name: assignedDoc ? assignedDoc.name : 'General Specialist',
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      try {
        const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
        localCons.unshift(newRecord);
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(localCons));
      } catch (e) {}

      setConfirmedConsultation(newRecord);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit consultation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Confirmation Screen: Appointment */}
        {confirmedAppt ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#092C59]">
              Appointment Confirmed!
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Your appointment tracking code is{' '}
              <span className="font-bold text-[#0756A6]">{confirmedAppt.appointment_code}</span>
            </p>

            <div className="my-6 p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{confirmedAppt.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-[#0756A6]">{confirmedAppt.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800">{confirmedAppt.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-800">
                  {confirmedAppt.appointment_date} at {confirmedAppt.appointment_time}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : confirmedConsultation ? (
          /* Confirmation Screen: Consultation */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0756A6]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#092C59]">
              Consultation Request Received!
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Thank you, <strong className="text-slate-800">{confirmedConsultation.patient_name}</strong>. Our specialist dental team has received your inquiry and will contact you directly at <strong className="text-[#0756A6]">{confirmedConsultation.patient_phone}</strong>.
            </p>

            <div className="my-6 p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Consultant:</span>
                <span className="font-bold text-[#0756A6]">{confirmedConsultation.doctor_name || 'Specialist Doctor'}</span>
              </div>
              {confirmedConsultation.preferred_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Preferred Date:</span>
                  <span className="font-bold text-slate-800">{confirmedConsultation.preferred_date}</span>
                </div>
              )}
              <div className="pt-2 border-t border-blue-100/80">
                <span className="text-slate-500 block mb-0.5">Dental Concern:</span>
                <span className="font-semibold text-slate-800">{confirmedConsultation.dental_concern}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#0756A6] hover:bg-[#092C59] transition shadow-md cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          /* Active Form Mode */
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-black text-[#092C59]">
                {activeTab === 'consultation' ? 'Request Dental Consultation' : 'Book Dental Appointment'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'consultation'
                  ? 'Describe your dental symptoms or inquiry to get expert evaluation and scheduled advice.'
                  : `Operating hours: ${settings?.operating_start_time || '11:00 AM'} – ${settings?.operating_end_time || '12:00 AM'} (${settings?.weekly_holiday ? `${settings.weekly_holiday} Closed` : 'Sunday Closed'})`}
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('appointment');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'appointment'
                    ? 'bg-white text-[#092C59] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Clinic Appointment</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('consultation');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'consultation'
                    ? 'bg-white text-[#0756A6] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Doctor Consultation</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Appointment Form */}
            {activeTab === 'appointment' ? (
              <form onSubmit={handleSubmitAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="patient_name"
                      required
                      placeholder="e.g. Areeba Khan"
                      value={formData.patient_name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="patient_phone"
                      required
                      placeholder="+92 300 1234567"
                      value={formData.patient_phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="patient_email"
                    required
                    placeholder="name@example.com"
                    value={formData.patient_email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Doctor *
                    </label>
                    <select
                      name="doctor_id"
                      required
                      value={formData.doctor_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Service *
                    </label>
                    <select
                      name="service_id"
                      required
                      value={formData.service_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.price ? `(PKR ${s.price})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Appointment Date {settings?.weekly_holiday ? `(${settings.weekly_holiday} Off)` : ''} *
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      required
                      min={getTodayDateKarachi()}
                      value={formData.appointment_date}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Time Slot *
                    </label>
                    <select
                      name="appointment_time"
                      required
                      disabled={availableSlots.length === 0}
                      value={formData.appointment_time}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white disabled:opacity-50"
                    >
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))
                      ) : (
                        <option value="">No Slots (Closed)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dental Concern / Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows="2"
                    placeholder="Describe your symptoms or reason for visit..."
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || availableSlots.length === 0}
                  className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-blue-200" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Consultation Request Form */
              <form onSubmit={handleSubmitConsultation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="patient_name"
                      required
                      placeholder="e.g. Usman Ali"
                      value={formData.patient_name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="patient_phone"
                      required
                      placeholder="+92 300 1234567"
                      value={formData.patient_phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="patient_email"
                      placeholder="patient@example.com"
                      value={formData.patient_email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preferred Specialist *
                    </label>
                    <select
                      name="doctor_id"
                      value={formData.doctor_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    >
                      <option value="">General Specialist</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preferred Date {settings?.weekly_holiday ? `(${settings.weekly_holiday} Off)` : ''}
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      min={getTodayDateKarachi()}
                      value={formData.appointment_date}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preferred Time Slot
                    </label>
                    <select
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
                    >
                      <option value="Anytime (11 AM - 12 AM)">Anytime (11 AM - 12 AM)</option>
                      <option value="Morning / Afternoon (11 AM - 04 PM)">Morning / Afternoon (11 AM - 04 PM)</option>
                      <option value="Evening (04 PM - 08 PM)">Evening (04 PM - 08 PM)</option>
                      <option value="Night (08 PM - 12 AM)">Night (08 PM - 12 AM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Describe Your Dental Concern / Symptoms *
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    required
                    placeholder="e.g. Pain in lower right jaw, interested in teeth whitening or clear braces..."
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-white bg-[#0756A6] hover:bg-[#092C59] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 text-blue-200" />
                      <span>Submit Consultation Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
