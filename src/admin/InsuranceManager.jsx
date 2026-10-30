import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function InsuranceManager() {
  const [insurance, setInsurance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    coverage_summary: ''
  });

  useEffect(() => {
    fetchInsurance();
  }, []);

  const fetchInsurance = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/insurance/all');
      setInsurance(res.insurance || []);
    } catch (err) {
      console.error('Fetch insurance error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', logo: '', coverage_summary: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      logo: item.logo || '',
      coverage_summary: item.coverage_summary || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this insurance partner?')) return;
    try {
      await apiRequest(`/insurance/${id}`, { method: 'DELETE' });
      fetchInsurance();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiRequest(`/insurance/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiRequest('/insurance', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchInsurance();
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
            Insurance & Corporate Partners
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage supported corporate insurance panels and cashless billing partners.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Provider</span>
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
            <span className="text-xs">Loading insurance panels...</span>
          </div>
        ) : insurance.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No insurance partners configured</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {insurance.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50/60 transition flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#0756A6]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#092C59]">{item.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{item.coverage_summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-[#092C59] mb-4">
              {editingItem ? 'Edit Insurance Provider' : 'Add Insurance Provider'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Provider Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jubilee Life Insurance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Coverage Details / Summary
                </label>
                <textarea
                  rows="2"
                  placeholder="Direct cashless billing for corporate dental..."
                  value={formData.coverage_summary}
                  onChange={(e) => setFormData({ ...formData, coverage_summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition text-sm cursor-pointer"
              >
                {editingItem ? 'Update Provider' : 'Save Provider'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

