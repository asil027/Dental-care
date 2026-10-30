import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Upload,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function DoctorsManager() {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Add modal state
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'new');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    specialization: '',
    experience_years: 5,
    rating: 4.9,
    reviews_count: 100,
    photo: '',
    bio: '',
    consultation_fee: 2500,
    available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    available_start_time: '11:00',
    available_end_time: '23:59',
    is_active: 1
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/doctors/all');
      setDoctors(res.doctors || []);
    } catch (err) {
      console.error('Fetch doctors error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFormError('');
    setFormData({
      name: '',
      qualification: '',
      specialization: '',
      experience_years: 5,
      rating: 4.9,
      reviews_count: 100,
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
      bio: '',
      consultation_fee: 2500,
      available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      available_start_time: '11:00',
      available_end_time: '23:59',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoctor(doc);
    setFormError('');
    setFormData({
      name: doc.name,
      qualification: doc.qualification,
      specialization: doc.specialization,
      experience_years: doc.experience_years,
      rating: doc.rating,
      reviews_count: doc.reviews_count,
      photo: doc.photo,
      bio: doc.bio || '',
      consultation_fee: doc.consultation_fee,
      available_days: doc.available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      available_start_time: doc.available_start_time || '11:00',
      available_end_time: doc.available_end_time || '23:59',
      is_active: doc.is_active
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('image', file);

    try {
      const res = await apiRequest('/upload', {
        method: 'POST',
        body
      });
      setFormData((prev) => ({ ...prev, photo: res.url }));
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiRequest(`/doctors/${id}/toggle-status`, { method: 'PATCH' });
      fetchDoctors();
    } catch (err) {
      alert(err.message || 'Status toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor profile?')) return;
    try {
      await apiRequest(`/doctors/${id}`, { method: 'DELETE' });
      fetchDoctors();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingDoctor) {
        await apiRequest(`/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/doctors', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchDoctors();
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
            Doctor Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage dental surgeon profiles, photos, fees, and active availability.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
          <span className="text-xs">Loading doctors...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl overflow-hidden border transition shadow-xs flex flex-col justify-between ${
                doc.is_active ? 'border-slate-200/80 hover:shadow-md' : 'border-rose-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="relative aspect-[4/3.8] bg-slate-100 overflow-hidden">
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-[#0756A6]">
                    {doc.specialization}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleStatus(doc.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        doc.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-base font-bold text-[#092C59] leading-snug">
                    {doc.name}
                  </h3>
                  <p className="text-[11px] text-[#0756A6] font-medium">
                    {doc.qualification}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {doc.bio || 'Experienced specialist dentist.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      PKR {Number(doc.consultation_fee).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(doc.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-100 flex gap-2 mt-2">
                <button
                  onClick={() => handleOpenEdit(doc)}
                  className="flex-1 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0756A6] text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                  title="Delete Doctor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-4">
              {editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ayesha Khan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Dentist / Orthodontist"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qualifications & Certifications *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDS, FCPS (Orthodontics), RDS"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Photo Upload or URL */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Photograph (Upload or Image URL)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="https://... or upload local image"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4 text-[#0756A6]" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {formData.photo && (
                  <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover object-top" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Years Exp.
                  </label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Available Working Days
                </label>
                <input
                  type="text"
                  placeholder="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday"
                  value={formData.available_days}
                  onChange={(e) => setFormData({ ...formData, available_days: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Biography & Summary
                </label>
                <textarea
                  rows="3"
                  placeholder="Clinical experience, background, special techniques..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="doctor_active"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-[#0756A6] focus:ring-[#0756A6] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="doctor_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display this doctor publicly on the website
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingDoctor ? 'Save Changes' : 'Create Doctor'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

