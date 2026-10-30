import React, { useState, useEffect } from 'react';
import {
  Grid,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Smile,
  Sun,
  Activity,
  Shield,
  Stethoscope,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Stethoscope',
    short_desc: '',
    full_desc: '',
    price: 3000,
    duration_mins: 45,
    image: '',
    is_active: 1
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/services/all');
      setServices(res.services || []);
    } catch (err) {
      console.error('Fetch services error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormError('');
    setFormData({
      name: '',
      icon: 'Stethoscope',
      short_desc: '',
      full_desc: '',
      price: 3000,
      duration_mins: 45,
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
      is_active: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingService(s);
    setFormError('');
    setFormData({
      name: s.name,
      icon: s.icon || 'Stethoscope',
      short_desc: s.short_desc,
      full_desc: s.full_desc || '',
      price: s.price,
      duration_mins: s.duration_mins,
      image: s.image || '',
      is_active: s.is_active
    });
    setShowModal(true);
  };

  const handleToggleVisibility = async (id) => {
    try {
      await apiRequest(`/services/${id}/toggle-status`, { method: 'PATCH' });
      fetchServices();
    } catch (err) {
      alert(err.message || 'Status toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await apiRequest(`/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingService) {
        await apiRequest(`/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/services', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      setFormError(err.message || 'Save failed');
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
            Services & Treatments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinic service offerings, descriptions, pricing, and public visibility.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading services...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Icon</th>
                  <th className="py-3 px-4">Price (PKR)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-[#092C59]">
                      {service.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#0756A6] font-semibold">
                      {service.icon}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      PKR {Number(service.price).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {service.duration_mins} mins
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {service.short_desc}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleVisibility(service.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          service.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {service.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{service.is_active ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="p-1.5 rounded-lg bg-blue-50 text-[#0756A6] hover:bg-blue-100 transition"
                          title="Edit Service"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                          title="Delete Service"
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

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-4">
              {editingService ? 'Edit Dental Service' : 'Add New Dental Service'}
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
                  Treatment / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Teeth Whitening"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Icon Name
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Stethoscope">Stethoscope</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="Smile">Smile</option>
                    <option value="Activity">Activity</option>
                    <option value="Shield">Shield</option>
                    <option value="Sun">Sun</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_mins}
                    onChange={(e) => setFormData({ ...formData, duration_mins: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description (Shown on Card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Short 1-line overview..."
                  value={formData.short_desc}
                  onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Description (Shown in Learn More modal)
                </label>
                <textarea
                  rows="3"
                  placeholder="Full clinical explanation of the procedure..."
                  value={formData.full_desc}
                  onChange={(e) => setFormData({ ...formData, full_desc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cover Photo URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="service_active"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-[#0756A6] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="service_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Show this service on the public website
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

