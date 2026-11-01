import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit, Trash2, Eye, EyeOff, Loader2, CheckCircle2, Clock, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    patient_name: '',
    photo: '',
    rating: 5.0,
    treatment: 'Teeth Whitening',
    review_text: '',
    is_approved: 1
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/testimonials/all');
      const serverList = res.testimonials || [];
      const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
      const serverIds = new Set(serverList.map(r => r.id));
      const missingRevs = localRevs.filter(r => !serverIds.has(r.id));
      setTestimonials([...missingRevs, ...serverList]);
    } catch (err) {
      console.error('Fetch testimonials error:', err);
      const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
      if (localRevs.length > 0) setTestimonials(localRevs);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingList = testimonials.filter((t) => !t.is_approved);
  const approvedList = testimonials.filter((t) => t.is_approved);

  const filteredList = testimonials
    .filter((t) => {
      if (activeTab === 'pending') return !t.is_approved;
      if (activeTab === 'approved') return t.is_approved;
      return true;
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.patient_name && t.patient_name.toLowerCase().includes(q)) ||
        (t.treatment && t.treatment.toLowerCase().includes(q)) ||
        (t.review_text && t.review_text.toLowerCase().includes(q))
      );
    });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      patient_name: '',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      treatment: 'General Dentistry',
      review_text: '',
      is_approved: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      patient_name: item.patient_name,
      photo: item.photo || '',
      rating: item.rating,
      treatment: item.treatment || '',
      review_text: item.review_text,
      is_approved: item.is_approved
    });
    setShowModal(true);
  };

  const handleToggleApprove = async (id) => {
    try {
      await apiRequest(`/testimonials/${id}/toggle-approve`, { method: 'PATCH' }).catch(() => {});
      try {
        const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
        const updated = localRevs.map(r => (r.id === id ? { ...r, is_approved: r.is_approved ? 0 : 1 } : r));
        localStorage.setItem('dc_submitted_reviews', JSON.stringify(updated));
      } catch (e) {}
      fetchTestimonials();
    } catch (err) {
      alert(err.message || 'Toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient review permanently?')) return;
    try {
      await apiRequest(`/testimonials/${id}`, { method: 'DELETE' }).catch(() => {});
      try {
        const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
        const updated = localRevs.filter(r => r.id !== id);
        localStorage.setItem('dc_submitted_reviews', JSON.stringify(updated));
      } catch (e) {}
      fetchTestimonials();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiRequest(`/testimonials/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/testimonials', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (err) {
      alert(err.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Patient Reviews & Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve client-submitted reviews before they appear live on the homepage.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin Review</span>
        </button>
      </div>

      {/* Pending Reviews Alert Banner */}
      {pendingList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {pendingList.length} New Patient Review{pendingList.length > 1 ? 's' : ''} Awaiting Approval
              </h4>
              <p className="text-xs text-amber-700">
                Patients have submitted feedback from the website. Review and click "Approve & Publish" to show them on the homepage.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pending')}
            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#092C59] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Reviews ({testimonials.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Pending Approval</span>
            {pendingList.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pending' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'
              }`}>
                {pendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Live on Website ({approvedList.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-[#0756A6] outline-none"
          />
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading reviews...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">
              {activeTab === 'pending'
                ? 'No reviews waiting for approval'
                : activeTab === 'approved'
                ? 'No approved reviews currently live'
                : 'No reviews found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const isApproved = Boolean(item.is_approved);
              return (
                <div
                  key={item.id}
                  className={`p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                    !isApproved ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-amber-400' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                      alt={item.patient_name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5 shadow-xs"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#092C59]">{item.patient_name}</span>
                        <span className="text-[11px] text-[#0756A6] font-medium">• {item.treatment}</span>
                        <div className="flex items-center gap-0.5 text-amber-500 ml-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(item.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-slate-700 ml-1">{item.rating}</span>
                        </div>
                        
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}
                        >
                          {isApproved ? '✓ Live on Website' : '⏳ Pending Approval'}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 text-xs italic leading-relaxed pt-0.5">
                        "{item.review_text}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Main Approve / Hide Action Button */}
                    <button
                      onClick={() => handleToggleApprove(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                        isApproved
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                      }`}
                      title={isApproved ? 'Hide review from website' : 'Approve and publish to website'}
                    >
                      {isApproved ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hide Review</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Approve & Publish</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit Review"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-4">
              {editingItem ? 'Edit Patient Review' : 'Add New Review'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Ahmed"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Treatment Given *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teeth Whitening"
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rating (1 to 5)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Patient Photo URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Approval Status
                </label>
                <select
                  value={formData.is_approved}
                  onChange={(e) => setFormData({ ...formData, is_approved: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6]"
                >
                  <option value={1}>Approved (Show on Public Website)</option>
                  <option value={0}>Pending / Hidden (Do not show on website)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Review Text *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Patient testimonial..."
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0756A6] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer shadow-xs"
              >
                {editingItem ? 'Update Review' : 'Save Review'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
