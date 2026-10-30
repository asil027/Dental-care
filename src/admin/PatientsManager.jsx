import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function PatientsManager() {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'new');
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);
  const [patientHistoryData, setPatientHistoryData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Female',
    medical_notes: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const url = search ? `/patients?search=${encodeURIComponent(search)}` : '/patients';
      const res = await apiRequest(url);
      setPatients(res.patients || []);
    } catch (err) {
      console.error('Fetch patients error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: 'Female',
      medical_notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPatient(p);
    setFormError('');
    setFormData({
      name: p.name,
      email: p.email || '',
      phone: p.phone,
      age: p.age || '',
      gender: p.gender || 'Female',
      medical_notes: p.medical_notes || ''
    });
    setShowAddModal(true);
  };

  const handleOpenHistory = async (patient) => {
    setViewHistoryPatient(patient);
    setPatientHistoryData(null);
    try {
      const res = await apiRequest(`/patients/${patient.id}`);
      setPatientHistoryData(res);
    } catch (err) {
      alert('Failed to load patient history: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient record?')) return;
    try {
      await apiRequest(`/patients/${id}`, { method: 'DELETE' });
      fetchPatients();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingPatient) {
        await apiRequest(`/patients/${editingPatient.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/patients', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowAddModal(false);
      fetchPatients();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Patient Directory & Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered clinic patients, past clinical visits, and dental notes.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patients by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs font-semibold text-[#0756A6] hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading patients...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No patient records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Medical Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-[#092C59]">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {p.email || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.age ? `${p.age} yrs` : ''} {p.gender ? `(${p.gender})` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0756A6] border border-blue-100">
                        {p.total_visits} visits
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {p.medical_notes || 'No notes'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(p)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white font-bold text-[11px] transition"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Patient"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient History Modal */}
      {viewHistoryPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewHistoryPatient(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-1">
              Patient Dental History
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {viewHistoryPatient.name} • {viewHistoryPatient.phone}
            </p>

            {!patientHistoryData ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                  <span className="font-bold text-[#092C59] block mb-0.5">Clinical Notes:</span>
                  <p className="text-slate-700">{patientHistoryData.patient.medical_notes || 'None recorded.'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Appointment Records ({patientHistoryData.appointments.length})
                  </h4>
                  {patientHistoryData.appointments.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No appointments on file.</div>
                  ) : (
                    <div className="space-y-2">
                      {patientHistoryData.appointments.map((a) => (
                        <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[#092C59] block">{a.service_name} with {a.doctor_name}</span>
                            <span className="text-slate-500">{a.appointment_date} at {a.appointment_time}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setViewHistoryPatient(null)}
                    className="w-full py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-4">
              {editingPatient ? 'Edit Patient Information' : 'Register New Patient'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Patient Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Medical Notes & Dental Allergies
                </label>
                <textarea
                  rows="3"
                  placeholder="Medical conditions, known allergies, previous surgeries..."
                  value={formData.medical_notes}
                  onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

