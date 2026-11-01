import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
  Plus,
  Search,
  User,
  Phone,
  Mail,
  X,
  Stethoscope
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getTodayDateKarachi, getNextAvailableWorkingDate } from '../utils/time';

export default function ConsultationsManager() {
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    doctor_id: '',
    preferred_date: getTodayDateKarachi(),
    preferred_time: '04:00 PM',
    dental_concern: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [statusFilter]);

  const fetchInitialData = async () => {
    try {
      const docRes = await apiRequest('/doctors').catch(() => ({ doctors: [] }));
      const docs = docRes.doctors || [];
      setDoctors(docs);
      if (docs.length > 0) {
        setFormData((prev) => ({ ...prev, doctor_id: docs[0].id }));
      }
    } catch (e) {}
  };

  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter !== 'All' ? `/consultations?status=${encodeURIComponent(statusFilter)}` : '/consultations';
      const res = await apiRequest(url);
      const serverList = res.consultations || [];
      const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
      const serverIds = new Set(serverList.map((c) => c.id));
      const missing = localCons.filter((c) => !serverIds.has(c.id));
      const allMerged = [...missing, ...serverList];
      setConsultations(allMerged);

      // Automatically mark all loaded consultations as read/seen
      try {
        const readIds = new Set(JSON.parse(localStorage.getItem('dc_read_consultation_ids') || '[]').map(String));
        allMerged.forEach((c) => readIds.add(String(c.id)));
        localStorage.setItem('dc_read_consultation_ids', JSON.stringify([...readIds]));
      } catch (e) {}
    } catch (err) {
      console.error('Fetch consultations error:', err);
      const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
      if (localCons.length > 0) setConsultations(localCons);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiRequest(`/consultations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }).catch(() => {});

      try {
        const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
        const updated = localCons.map((c) => (c.id === id ? { ...c, status } : c));
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(updated));
      } catch (e) {}

      setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      fetchConsultations();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this consultation inquiry?')) return;
    try {
      await apiRequest(`/consultations/${id}`, { method: 'DELETE' }).catch(() => {});

      try {
        const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
        const updated = localCons.filter((c) => c.id !== id);
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(updated));
      } catch (e) {}

      setConsultations((prev) => prev.filter((c) => c.id !== id));
      fetchConsultations();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.patient_name || !formData.patient_phone || !formData.dental_concern) {
      setFormError('Patient Name, Phone, and Dental Concern are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/consultations/manual', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const newRecord = res.consultation || {
        id: Date.now(),
        ...formData,
        doctor_name: doctors.find((d) => d.id == formData.doctor_id)?.name || 'General Specialist',
        created_at: new Date().toISOString()
      };

      try {
        const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
        localCons.unshift(newRecord);
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(localCons));
      } catch (e) {}

      setIsModalOpen(false);
      setFormData({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        doctor_id: doctors[0]?.id || '',
        preferred_date: getTodayDateKarachi(),
        preferred_time: '04:00 PM',
        dental_concern: '',
        status: 'Pending'
      });
      fetchConsultations();
    } catch (err) {
      setFormError(err.message || 'Failed to save consultation inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list by search query
  const filteredList = consultations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.patient_name && c.patient_name.toLowerCase().includes(q)) ||
      (c.patient_phone && c.patient_phone.includes(q)) ||
      (c.dental_concern && c.dental_concern.toLowerCase().includes(q)) ||
      (c.doctor_name && c.doctor_name.toLowerCase().includes(q))
    );
  });

  const totalCount = consultations.length;
  const pendingCount = consultations.filter((c) => c.status === 'Pending').length;
  const approvedCount = consultations.filter((c) => c.status === 'Approved').length;
  const completedCount = consultations.filter((c) => c.status === 'Completed').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Consultation Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review patient online inquiry requests, dental concerns, and approve specialist consultations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0756A6] hover:bg-[#092C59] rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Add Consultation
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Requests</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-[#092C59] mt-2">{totalCount}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{approvedCount}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#0756A6] mt-2">{completedCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, phone, symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6]"
          >
            <option value="All">All Inquiries ({totalCount})</option>
            <option value="Pending">Pending ({pendingCount})</option>
            <option value="Approved">Approved ({approvedCount})</option>
            <option value="Completed">Completed ({completedCount})</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading consultation requests...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No consultation inquiries found</p>
            <p className="text-xs text-slate-400 mt-1">
              New inquiries submitted by patients online or created manually will appear here.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0756A6] bg-blue-50 rounded-xl hover:bg-blue-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Sample Inquiry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((c) => (
              <div key={c.id} className="p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#092C59]">{c.patient_name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : c.status === 'Completed'
                          ? 'bg-blue-50 text-[#0756A6] border border-blue-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.created_at && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-700">{c.patient_phone}</strong>
                    </span>
                    {c.patient_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.patient_email}
                      </span>
                    )}
                    {c.doctor_name && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-[#0756A6]" />
                        Specialist: <strong className="text-[#0756A6]">{c.doctor_name}</strong>
                      </span>
                    )}
                    {c.preferred_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Preferred: <strong>{c.preferred_date}</strong> ({c.preferred_time || 'Anytime'})
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 mt-2">
                    <span className="font-bold text-[#092C59] block mb-0.5 text-[11px] uppercase tracking-wider">
                      Dental Concern / Inquiry:
                    </span>
                    {c.dental_concern}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== 'Approved' && (
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'Approved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition cursor-pointer"
                      title="Approve consultation"
                    >
                      Approve
                    </button>
                  )}
                  {c.status !== 'Completed' && (
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'Completed')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0756A6] font-bold text-xs transition cursor-pointer"
                      title="Mark consultation completed"
                    >
                      Complete
                    </button>
                  )}
                  {c.status !== 'Rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'Rejected')}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition cursor-pointer"
                      title="Reject request"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Consultation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-[#0756A6] rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#092C59]">Record Consultation Inquiry</h3>
                <p className="text-xs text-slate-500">Add walk-in or telephone patient dental inquiry</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateConsultation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmed"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={formData.patient_phone}
                    onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@email.com"
                    value={formData.patient_email}
                    onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Specialist Doctor</label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                >
                  <option value="">General Specialist</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:00 PM"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dental Concern / Question *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe patient's dental symptoms or consultation inquiry..."
                  value={formData.dental_concern}
                  onChange={(e) => setFormData({ ...formData, dental_concern: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0756A6] hover:bg-[#092C59] text-white font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
