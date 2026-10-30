import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getTodayDateKarachi, isDateOff, generateTimeSlots, getDayName } from '../utils/time';

export default function AppointmentsManager() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'new');
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [viewDetailsAppt, setViewDetailsAppt] = useState(null);

  // New manual appointment form state
  const [newApptData, setNewApptData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    doctor_id: '',
    service_id: '',
    appointment_date: getTodayDateKarachi(),
    appointment_time: '11:30 AM',
    fee: 2500,
    status: 'Confirmed',
    notes: 'Walk-in / Reception entry'
  });

  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({
    appointment_date: getTodayDateKarachi(),
    appointment_time: '11:30 AM',
    doctor_id: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [search, statusFilter, doctorFilter, dateFilter]);

  const fetchInitialData = async () => {
    try {
      const [docsRes, servsRes, settingsRes] = await Promise.all([
        apiRequest('/doctors/all'),
        apiRequest('/services/all'),
        apiRequest('/settings')
      ]);
      setDoctors(docsRes.doctors || []);
      setServices(servsRes.services || []);
      setSettings(settingsRes.settings || {});
      if (docsRes.doctors?.length > 0) {
        setNewApptData((prev) => ({ ...prev, doctor_id: docsRes.doctors[0].id }));
      }
      if (servsRes.services?.length > 0) {
        setNewApptData((prev) => ({ ...prev, service_id: servsRes.services[0].id }));
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let url = '/appointments?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter && statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (doctorFilter && doctorFilter !== 'All') url += `doctor_id=${encodeURIComponent(doctorFilter)}&`;
      if (dateFilter) url += `date=${encodeURIComponent(dateFilter)}&`;

      const res = await apiRequest(url);
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchAppointments();
      if (viewDetailsAppt && viewDetailsAppt.id === id) {
        setViewDetailsAppt((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;
    try {
      await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
      if (viewDetailsAppt?.id === id) setViewDetailsAppt(null);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isDateOff(newApptData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(newApptData.appointment_date);
      setFormError(`Clinic is closed on ${day}s! (Off day: ${settings?.weekly_holiday || 'Sunday'})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/appointments/manual', {
        method: 'POST',
        body: JSON.stringify(newApptData)
      });
      setShowAddModal(false);
      fetchAppointments();
      // Reset
      setNewApptData((prev) => ({
        ...prev,
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        notes: 'Walk-in / Reception entry'
      }));
    } catch (err) {
      setFormError(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isDateOff(rescheduleData.appointment_date, settings?.weekly_holiday)) {
      const day = getDayName(rescheduleData.appointment_date);
      setFormError(`Clinic is closed on ${day}s! (Off day: ${settings?.weekly_holiday || 'Sunday'})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/appointments/${rescheduleModalAppt.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(rescheduleData)
      });
      setRescheduleModalAppt(null);
      fetchAppointments();
    } catch (err) {
      setFormError(err.message || 'Failed to reschedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dynamicSlots = generateTimeSlots(
    settings?.operating_start_time || '11:00 AM',
    settings?.operating_end_time || '12:00 AM',
    settings?.slot_duration || 30
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, schedule, reschedule, and update patient appointments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by patient name, phone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Doctor filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] cursor-pointer"
          >
            <option value="All">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0756A6] cursor-pointer"
          />
        </div>

        {(search || statusFilter !== 'All' || doctorFilter !== 'All' || dateFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setDoctorFilter('All');
              setDateFilter('');
            }}
            className="text-xs font-semibold text-[#0756A6] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading appointments...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No appointments found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Fee (PKR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0756A6]">
                      {appt.appointment_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#092C59]">{appt.patient_name}</div>
                      <div className="text-[11px] text-slate-400">{appt.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {appt.doctor_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {appt.service_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{appt.appointment_date}</div>
                      <div className="text-[11px] text-[#0756A6]">{appt.appointment_time}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {Number(appt.fee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : appt.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : appt.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewDetailsAppt(appt)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white font-bold text-[11px] transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleModalAppt(appt);
                            setRescheduleData({
                              appointment_date: appt.appointment_date,
                              appointment_time: appt.appointment_time,
                              doctor_id: appt.doctor_id
                            });
                          }}
                          className="p-1 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
                          title="Reschedule Appointment"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                          title="Delete Record"
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

      {/* Manual Appointment Modal */}
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
              Schedule Manual Appointment
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={newApptData.patient_name}
                  onChange={(e) => setNewApptData({ ...newApptData, patient_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 0000000"
                    value={newApptData.patient_phone}
                    onChange={(e) => setNewApptData({ ...newApptData, patient_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={newApptData.patient_email}
                    onChange={(e) => setNewApptData({ ...newApptData, patient_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor *
                  </label>
                  <select
                    required
                    value={newApptData.doctor_id}
                    onChange={(e) => setNewApptData({ ...newApptData, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service *
                  </label>
                  <select
                    required
                    value={newApptData.service_id}
                    onChange={(e) => setNewApptData({ ...newApptData, service_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date {settings?.weekly_holiday ? `(${settings.weekly_holiday} Off)` : ''} *
                  </label>
                  <input
                    type="date"
                    required
                    value={newApptData.appointment_date}
                    onChange={(e) => setNewApptData({ ...newApptData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Slot *
                  </label>
                  <select
                    required
                    value={newApptData.appointment_time}
                    onChange={(e) => setNewApptData({ ...newApptData, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {dynamicSlots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={newApptData.fee}
                    onChange={(e) => setNewApptData({ ...newApptData, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newApptData.status}
                    onChange={(e) => setNewApptData({ ...newApptData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={newApptData.notes}
                  onChange={(e) => setNewApptData({ ...newApptData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Create Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative">
            <button
              onClick={() => setRescheduleModalAppt(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-1">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: <span className="font-bold text-slate-800">{rescheduleModalAppt.patient_name}</span>
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor
                </label>
                <select
                  value={rescheduleData.doctor_id}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Date {settings?.weekly_holiday ? `(${settings.weekly_holiday} Off)` : ''} *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleData.appointment_date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, appointment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Slot *
                </label>
                <select
                  value={rescheduleData.appointment_time}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, appointment_time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {dynamicSlots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative">
            <button
              onClick={() => setViewDetailsAppt(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-1">
              {viewDetailsAppt.appointment_code}
            </h3>
            <span className="text-xs text-slate-400">Created on {viewDetailsAppt.created_at}</span>

            <div className="my-5 space-y-2.5 text-xs sm:text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-800">{viewDetailsAppt.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-800">{viewDetailsAppt.patient_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{viewDetailsAppt.patient_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-[#092C59]">{viewDetailsAppt.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800">{viewDetailsAppt.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled:</span>
                <span className="font-bold text-[#0756A6]">{viewDetailsAppt.appointment_date} at {viewDetailsAppt.appointment_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Treatment Fee:</span>
                <span className="font-bold text-emerald-700">PKR {Number(viewDetailsAppt.fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-[#0756A6]">{viewDetailsAppt.status}</span>
              </div>
              <div className="py-2 border-t border-slate-100">
                <span className="text-slate-500 block text-xs mb-1">Patient Concern / Notes:</span>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 text-xs">
                  {viewDetailsAppt.notes || 'No extra notes provided.'}
                </div>
              </div>
            </div>

            {/* Change Status Fast Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Change Status:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusUpdate(viewDetailsAppt.id, st)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      viewDetailsAppt.status === st
                        ? 'bg-[#092C59] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewDetailsAppt(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

