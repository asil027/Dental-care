import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function Contact({ settings }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const clinicPhone = settings?.phone || '+92 42 3578 9000';
  const emergencyPhone = settings?.emergency_phone || '+92 300 123 4567';
  const clinicEmail = settings?.email || 'contact@dentalcareclinic.pk';
  const clinicAddress = settings?.address || 'Suite 402, Dental Care Medical Tower, Main Boulevard, Gulberg III, Lahore, Pakistan';

  // Automatically sync Google Maps embed URL directly with latitude/longitude or address
  const lat = settings?.latitude;
  const lng = settings?.longitude;
  const hasCoordinates = Boolean(lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)));

  const resolvedMapUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(clinicAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const externalMapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Save locally to ensure immediate persistence across reloads
      try {
        const localMsgs = JSON.parse(localStorage.getItem('dc_submitted_messages') || '[]');
        const newRecord = res.messageRecord || {
          id: Date.now(),
          ...formData,
          is_read: 0,
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        localMsgs.unshift(newRecord);
        localStorage.setItem('dc_submitted_messages', JSON.stringify(localMsgs));
      } catch (e) {}

      setSubmittedSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-[#F4F8FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-100/60 px-3.5 py-1 rounded-full mb-3">
            GET IN TOUCH
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#092C59] tracking-tight">
            Contact Dental Care Clinic
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            We are here to assist with appointments, dental queries, and emergency consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 cols): Contact Cards + Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100/80 shadow-xs space-y-5">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center shrink-0 border border-blue-100">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Clinic Address
                  </h4>
                  <p className="text-sm font-semibold text-[#092C59] mt-0.5 leading-snug">
                    {clinicAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center shrink-0 border border-blue-100">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Phone & Emergency
                  </h4>
                  <div className="mt-0.5">
                    <a href={`tel:${clinicPhone}`} className="text-sm font-bold text-[#0756A6] hover:underline block">
                      {clinicPhone}
                    </a>
                    <span className="text-xs text-rose-600 font-semibold block mt-0.5">
                      Urgent Emergency: {emergencyPhone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center shrink-0 border border-blue-100">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Email Correspondence
                  </h4>
                  <a href={`mailto:${clinicEmail}`} className="text-sm font-semibold text-[#092C59] hover:text-[#0756A6] mt-0.5 block">
                    {clinicEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center shrink-0 border border-blue-100">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Working Hours (Asia/Karachi)
                  </h4>
                  <p className="text-xs font-bold text-[#092C59] mt-0.5">
                    {settings?.working_hours_weekday || `${settings?.operating_start_time || '11:00 AM'} – ${settings?.operating_end_time || '12:00 AM'}`}
                  </p>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">
                    Off Day(s): {settings?.weekly_holiday || 'Sunday'} (CLOSED)
                  </p>
                </div>
              </div>

            </div>

            {/* Google Maps embed preview - Automatically synchronized with clinic coordinates/address */}
            <div className="bg-white rounded-3xl overflow-hidden border border-blue-100/80 shadow-xs h-72 w-full relative group">
              <iframe
                key={`${lat}-${lng}-${clinicAddress}`}
                title="Dental Care Clinic Location"
                src={resolvedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={externalMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#092C59] hover:text-[#0756A6] text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1.5 transition opacity-90 hover:opacity-100"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3 text-[#0756A6]" />
              </a>
            </div>

          </div>

          {/* Right Column (7 cols): Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-9 border border-blue-100/80 shadow-xl">
            <h3 className="text-2xl font-extrabold text-[#092C59] mb-2">
              Send Us a Direct Message
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Fill out this quick form and our clinical coordinator will get back to you within 2 business hours.
            </p>

            {submittedSuccess ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-xl font-bold text-emerald-900">Message Delivered!</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Thank you for reaching out to Dental Care. We will contact you via email or phone shortly.
                </p>
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Zainab Iqbal"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. zainab@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. +92 300 9993344"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="e.g. Invisalign Consultation"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Message / Concerns *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows="4"
                    placeholder="Describe your dental symptoms or what procedure you are interested in..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] active:scale-[0.99] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-blue-200" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

