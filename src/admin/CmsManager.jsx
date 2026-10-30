import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Sparkles,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function CmsManager() {
  const [cms, setCms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [heroForm, setHeroForm] = useState({
    badge: 'WELCOME TO DENTAL CARE',
    heading: 'Your Smile\nOur Priority',
    subheading: 'Quality Dental Care for a Healthy Smile',
    description: 'We provide exceptional dental care in a comfortable and friendly environment. Our experienced team is here to keep your smile healthy and beautiful.',
    primaryBtnText: 'Book Appointment',
    secondaryBtnText: 'Our Services',
    heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80',
    badgeCursive: 'Healthy Smile Happy Life ♡',
  });

  const [sectionOrders, setSectionOrders] = useState([]);

  useEffect(() => {
    fetchCmsData();
  }, []);

  const fetchCmsData = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/cms');
      setCms(res.cms || {});
      if (res.cms?.hero) setHeroForm(res.cms.hero);
      if (res.cms?.section_order) setSectionOrders(res.cms.section_order);
    } catch (err) {
      console.error('Fetch CMS error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('image', file);

    try {
      const res = await apiRequest('/upload', { method: 'POST', body });
      setHeroForm((prev) => ({ ...prev, heroImage: res.url }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSectionVisibility = (id) => {
    setSectionOrders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleSaveAll = async () => {
    setSaveSuccess(false);
    try {
      await Promise.all([
        apiRequest('/cms/hero', {
          method: 'PUT',
          body: JSON.stringify(heroForm)
        }),
        apiRequest('/cms/section_order', {
          method: 'PUT',
          body: JSON.stringify(sectionOrders)
        })
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  if (isLoading || !cms) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
        <span className="text-xs">Loading CMS content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Website Content Management System (CMS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify text, hero banner, headlines, and toggle homepage section visibility in real-time.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Website content updated! Changes are live on the public front page.</span>
        </div>
      )}

      {/* 1. Hero Section CMS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-[#092C59]">
            Hero Section Content
          </h2>
          <span className="text-xs text-slate-400">
            Top banner text, primary CTA buttons, and patient hero photograph.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Top Pill Kicker
            </label>
            <input
              type="text"
              value={heroForm.badge}
              onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cursive Script Badge (Overlay)
            </label>
            <input
              type="text"
              value={heroForm.badgeCursive}
              onChange={(e) => setHeroForm({ ...heroForm, badgeCursive: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-['Caveat'] text-base"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Main Display Heading (Use Enter for new line)
          </label>
          <textarea
            rows="2"
            value={heroForm.heading}
            onChange={(e) => setHeroForm({ ...heroForm, heading: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#092C59]"
          />
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Hero Description Paragraph
          </label>
          <textarea
            rows="3"
            value={heroForm.description}
            onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Primary Button Text
            </label>
            <input
              type="text"
              value={heroForm.primaryBtnText}
              onChange={(e) => setHeroForm({ ...heroForm, primaryBtnText: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Secondary Button Text
            </label>
            <input
              type="text"
              value={heroForm.secondaryBtnText}
              onChange={(e) => setHeroForm({ ...heroForm, secondaryBtnText: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Hero Image */}
        <div className="text-xs">
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Hero Patient Photograph URL or Local Upload
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={heroForm.heroImage}
              onChange={(e) => setHeroForm({ ...heroForm, heroImage: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0">
              <Upload className="w-4 h-4 text-[#0756A6]" />
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
            </label>
          </div>
          {heroForm.heroImage && (
            <div className="mt-3 w-32 h-20 rounded-xl overflow-hidden border border-slate-200">
              <img src={heroForm.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Homepage Section Visibility */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-[#092C59]">
            Homepage Section Visibility Controls
          </h2>
          <span className="text-xs text-slate-400">
            Show or hide individual homepage sections without modifying any code.
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {sectionOrders.map((sec) => (
            <div key={sec.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">{sec.name}</span>
                <span className="text-[11px] text-slate-400">ID: #{sec.id}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleSectionVisibility(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  sec.visible
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{sec.visible ? 'Section Visible' : 'Section Hidden'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-md transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All CMS Changes</span>
        </button>
      </div>

    </div>
  );
}

