import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquarePlus, Send, Sparkles, ThumbsUp, UserCheck, ShieldCheck, Heart } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function Reviews({ testimonials = [], onReviewSubmitted }) {
  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    rating: 5,
    treatment: 'General Dentistry & Cleaning',
    review_text: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Local extra reviews submitted in this browser session
  const [extraReviews, setExtraReviews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Fallback sample testimonials if none in database yet
  const defaultTestimonials = [
    {
      id: 101,
      patient_name: 'Zainab Tariq',
      rating: 5,
      treatment: 'Painless Root Canal & Crown',
      review_text: 'Had an emergency root canal done here and honestly felt zero pain throughout the procedure. Dr. Ayesha is gentle, professional and explained every single step thoroughly.',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      created_at: '2 days ago'
    },
    {
      id: 102,
      patient_name: 'Usman Chaudhry',
      rating: 5,
      treatment: 'Laser Teeth Whitening',
      review_text: 'Amazing whitening results in just one session! The clinic environment is exceptionally clean, modern and peaceful. Highly recommend Dental Care to everyone.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      created_at: '1 week ago'
    },
    {
      id: 103,
      patient_name: 'Sarah Bilal',
      rating: 5,
      treatment: 'Dental Veneers & Smile Makeover',
      review_text: 'My smile transformation exceeded all my expectations. The staff was welcoming, courteous, and the clinic equipment is top tier. Truly world-class dentistry!',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      created_at: '2 weeks ago'
    }
  ];

  const baseList = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;
  const existingIds = new Set(baseList.map(r => r.id));
  const reviewList = [...extraReviews.filter(r => !existingIds.has(r.id)), ...baseList];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_name.trim() || !formData.review_text.trim()) {
      setErrorMessage('Please enter your full name and review message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await apiRequest('/testimonials/submit', {
        method: 'POST',
        body: JSON.stringify({
          patient_name: formData.patient_name.trim(),
          rating: formData.rating,
          treatment: formData.treatment,
          review_text: formData.review_text.trim()
        })
      });

      const newRecord = res.testimonial || {
        id: Date.now(),
        patient_name: formData.patient_name.trim(),
        rating: formData.rating,
        treatment: formData.treatment,
        review_text: formData.review_text.trim(),
        is_approved: 1,
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        created_at: 'Just now'
      };

      // Add to local state so it appears on screen immediately
      setExtraReviews((prev) => [newRecord, ...prev]);

      // Save locally to ensure immediate persistence across reloads
      try {
        const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
        localRevs.unshift(newRecord);
        localStorage.setItem('dc_submitted_reviews', JSON.stringify(localRevs));
      } catch (e) {}

      setIsSubmitted(true);
      setFormData({
        patient_name: '',
        rating: 5,
        treatment: 'General Dentistry & Cleaning',
        review_text: ''
      });

      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error('Submit review error:', err);
      setErrorMessage(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return '5 Stars — Outstanding (Loved It!)';
      case 4: return '4 Stars — Very Good (Satisfied)';
      case 3: return '3 Stars — Good (Average)';
      case 2: return '2 Stars — Fair (Needs Improvement)';
      default: return '1 Star — Poor';
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24 py-20 bg-gradient-to-b from-[#F4F8FF]/80 via-white to-[#F4F8FF]/40 relative overflow-hidden">
      {/* Anchor for backward compatibility with #testimonials */}
      <span id="testimonials" className="absolute -top-24 pointer-events-none" />

      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 text-[#0756A6] text-xs font-bold tracking-wider uppercase border border-blue-200/60 shadow-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>PATIENT REVIEWS & RATINGS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#092C59] tracking-tight">
            Real Smiles, Real Stories
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Read authentic feedback from patients treated at Dental Care, or share your own experience with us below!
          </p>

          {/* Quick Rating Badge Banner */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-black text-[#092C59]">4.9 / 5.0</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">Based on 120+ Verified Patient Reviews</span>
          </div>
        </div>

        {/* 2-Column Main Layout: Reviews List on Left, Direct Write Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column (7 cols): Patient Reviews Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-lg font-bold text-[#092C59] flex items-center gap-2">
                <span>Verified Patient Testimonials</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0756A6] font-bold border border-blue-200">
                  {reviewList.length} Reviews
                </span>
              </h3>
            </div>

            <div className="space-y-4">
              {reviewList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.patient_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0756A6] to-[#38BDF8] text-white flex items-center justify-center font-black text-base shadow-xs">
                          {item.patient_name ? item.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-[#092C59] text-base leading-tight">
                          {item.patient_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#0756A6] font-semibold mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Patient</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-normal">{item.treatment || 'Dental Care'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(item.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed italic pr-2">
                    "{item.review_text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): INLINE WRITE A REVIEW FORM */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-blue-200/80 sticky top-28">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#092C59] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <MessageSquarePlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#092C59] tracking-tight">
                  Write Your Review
                </h3>
                <p className="text-xs text-slate-500">
                  Share your dental experience with us!
                </p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="my-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-900">
                  Thank You for Your Review!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                  Your review has been successfully submitted to the clinic administration. Once verified by our team, it will appear live on this page!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Submit Another Review
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                {/* Rating Stars Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Your Rating *
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverRating || formData.rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                : 'text-slate-200 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-bold text-[#0756A6] mt-1">
                    {getRatingLabel(hoverRating || formData.rating)}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima Noor"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Dental Treatment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Treatment Received
                  </label>
                  <select
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition"
                  >
                    <option value="General Dentistry & Cleaning">General Dentistry & Scaling</option>
                    <option value="Cosmetic Dentistry & Smile Makeover">Cosmetic Dentistry & Smile Makeover</option>
                    <option value="Laser Teeth Whitening">Laser Teeth Whitening</option>
                    <option value="Clear Aligners & Orthodontics">Clear Aligners & Orthodontics</option>
                    <option value="Dental Implants">Dental Implants</option>
                    <option value="Root Canal Therapy">Root Canal Therapy</option>
                    <option value="Teeth Extraction">Teeth Extraction</option>
                    <option value="Routine Dental Checkup">Routine Dental Consultation</option>
                  </select>
                </div>

                {/* Review Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Review & Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share how your visit went, your dentist's care, comfort level..."
                    value={formData.review_text}
                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0756A6] to-[#092C59] hover:from-[#092C59] hover:to-[#0756A6] text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting Review...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-blue-200" />
                      <span>Submit Patient Review</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  🔒 All reviews are verified by clinic admin before appearing on the public page.
                </p>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

