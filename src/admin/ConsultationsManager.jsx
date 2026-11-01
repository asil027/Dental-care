import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function ConsultationsManager() {
  const [consultations, setConsultations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, [statusFilter]);

  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter !== 'All' ? `/consultations?status=${encodeURIComponent(statusFilter)}` : '/consultations';
      const res = await apiRequest(url);
      const serverList = res.consultations || [];
      const localCons = JSON.parse(localStorage.getItem('dc_submitted_consultations') || '[]');
      const serverIds = new Set(serverList.map(c => c.id));
      const missing = localCons.filter(c => !serverIds.has(c.id));
      setConsultations([...missing, ...serverList]);
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
        const updated = localCons.map(c => (c.id === id ? { ...c, status } : c));
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(updated));
      } catch (e) {}
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
        const updated = localCons.filter(c => c.id !== id);
        localStorage.setItem('dc_submitted_consultations', JSON.stringify(updated));
      } catch (e) {}
      fetchConsultations();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Consultation Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review patient online inquiry requests, dental concerns, and approve consultations.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6]"
        >
          <option value="All">All Inquiries</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Consultations List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading consultation requests...</span>
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No consultation inquiries found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {consultations.map((c) => (
              <div key={c.id} className="p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#092C59]">{c.patient_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-slate-500 text-[11px]">
                    <span>Phone: <strong className="text-slate-700">{c.patient_phone}</strong></span>
                    {c.patient_email && <span>Email: {c.patient_email}</span>}
                    {c.doctor_name && <span>Assigned Doctor: <strong className="text-[#0756A6]">{c.doctor_name}</strong></span>}
                    {c.preferred_date && <span>Preferred: {c.preferred_date} ({c.preferred_time || 'Anytime'})</span>}
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 mt-2">
                    <span className="font-semibold text-[#092C59] block mb-0.5">Dental Concern:</span>
                    {c.dental_concern}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Approved')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Completed')}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0756A6] font-bold text-xs transition"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Rejected')}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

