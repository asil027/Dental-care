import React, { useState } from 'react';
import { Star, ShieldCheck, CreditCard, CheckCircle2, ChevronRight, Info, X, MessageSquarePlus, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function TestimonialsInsurance({ testimonials = [], insurance = [] }) {
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    patient_name: '',
    rating: 5,
    treatment: 'General Dentistry',
    review_text: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await apiRequest('/testimonials/submit', {
        method: 'POST',
        body: JSON.stringify(reviewForm)
      });
      setSubmittedSuccess(true);
      setReviewForm({
        patient_name: '',
        rating: 5,
        treatment: 'General Dentistry',
        review_text: ''
      });
      setTimeout(() => {
        setSubmittedSuccess(false);
        setShowReviewModal(false);
      }, 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column (7 cols): Patient Testimonials */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-50 px-3.5 py-1 rounded-full mb-2">
                  PATIENT REVIEWS
                </div>
                <h2 className="text-3xl font-extrabold text-[#092C59] tracking-tight">
                  What Our Patients Say
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Real feedback from individuals and families treated at Dental Care.
                </p>
              </div>

              {/* Write a Review Button */}
              <button
                type="button"
                onClick={() => {
                  setSubmittedSuccess(false);
                  setErrorMessage('');
                  setShowReviewModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#0756A6] hover:bg-[#092C59] transition shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4 text-blue-200" />
                <span>Write a Review</span>
              </button>
            </div>

            <div className="space-y-4">
              {testimonials.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F4F8FF]/80 rounded-2xl p-6 border border-blue-100 hover:border-blue-200 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'}
                        alt={item.patient_name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      <div>
                        <h4 className="font-bold text-[#092C59] text-sm">
                          {item.patient_name}
                        </h4>
                        <div className="text-[11px] text-[#0756A6] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Patient • {item.treatment || 'Dental Care'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(item.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 italic leading-relaxed">
                    "{item.review_text}"
                  </p>
                </div>
              ))}

              {/* Bottom Quick Callout to Write Review */}
              <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#0756A6] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#092C59]">
                      Are you a recent Dental Care patient?
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Share your experience, rate your dentist & help others smile brighter!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setErrorMessage('');
                    setShowReviewModal(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0756A6] hover:bg-[#092C59] transition shadow-xs whitespace-nowrap cursor-pointer shrink-0"
                >
                  Write a Review
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Insurance Partners & Payment Options */}
          <div className="lg:col-span-5 bg-[#092C59] rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                Insurance & Payments
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
                Seamless Insurance Coverage & Flexible Options
              </h3>

              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed mb-6">
                We accept leading corporate dental insurance policies across Pakistan with direct cashless billing, pre-authorization, and easy payment plans.
              </p>

              {/* Insurance Providers Grid */}
              <div className="space-y-3 mb-6">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Partner Insurance Companies
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {insurance.map((prov) => (
                    <div
                      key={prov.id}
                      className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-200" />
                      </div>
                      <span className="text-xs font-semibold text-white leading-tight">
                        {prov.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 mb-6 pt-4 border-t border-white/10">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Accepted Payment Methods
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-blue-100">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">Cash</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">Visa & MasterCard</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">EasyPaisa</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">JazzCash</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10">Online Bank Transfer</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInsuranceModal(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-[#092C59] bg-white hover:bg-blue-50 transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              <span>Learn More About Coverage</span>
              <ChevronRight className="w-4 h-4 text-[#0756A6]" />
            </button>
          </div>

        </div>

      </div>

      {/* Insurance Modal */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative">
            <button
              onClick={() => setShowInsuranceModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-[#0756A6] rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-black text-[#092C59]">
              Insurance & Direct Billing
            </h3>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Dental Care coordinates directly with insurance companies so you don't face upfront stress. Please bring your insurance membership card and CNIC to your appointment.
            </p>

            <div className="my-5 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-[#092C59] block">1. Verification:</span>
                Our front desk checks your eligibility and co-pay details within minutes.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-[#092C59] block">2. Cashless Billing:</span>
                Covered dental treatments are directly invoiced to your provider.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-[#092C59] block">3. Easy Installments:</span>
                For cosmetic treatments or braces, flexible 3 to 6-month monthly plans are available.
              </div>
            </div>

            <button
              onClick={() => setShowInsuranceModal(false)}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition"
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Write a Patient Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 border border-amber-200">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <h3 className="text-2xl font-black text-[#092C59] tracking-tight">
              Share Your Dental Experience
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Your honest feedback helps us maintain the highest standard of dental care.
            </p>

            {submittedSuccess ? (
              <div className="my-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-900">
                  Review Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                  Thank you for your valuable feedback! Your review has been submitted to clinic administration. Once approved, it will be published on our homepage.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                {/* Rating Stars Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || reviewForm.rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                  : 'text-slate-300 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-extrabold text-[#092C59] ml-2">
                      {reviewForm.rating === 5 && '★★★★★ (Excellent)'}
                      {reviewForm.rating === 4 && '★★★★☆ (Very Good)'}
                      {reviewForm.rating === 3 && '★★★☆☆ (Good)'}
                      {reviewForm.rating === 2 && '★★☆☆☆ (Fair)'}
                      {reviewForm.rating === 1 && '★☆☆☆☆ (Poor)'}
                    </span>
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
                    placeholder="e.g. Ayesha Khan"
                    value={reviewForm.patient_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, patient_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Dental Treatment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dental Treatment Received
                  </label>
                  <select
                    value={reviewForm.treatment}
                    onChange={(e) => setReviewForm({ ...reviewForm, treatment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition"
                  >
                    <option value="General Dentistry">General Dentistry & Cleaning</option>
                    <option value="Cosmetic Dentistry">Cosmetic Dentistry & Smile Makeover</option>
                    <option value="Orthodontics">Orthodontics & Clear Aligners</option>
                    <option value="Teeth Whitening">Teeth Whitening & Bleaching</option>
                    <option value="Dental Implants">Dental Implants</option>
                    <option value="Root Canal Therapy">Root Canal Therapy</option>
                    <option value="Teeth Extraction">Teeth Extraction</option>
                    <option value="Routine Dental Checkup">Routine Dental Checkup</option>
                  </select>
                </div>

                {/* Review Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Detailed Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your treatment experience, doctor's gentle care, staff politeness, clinic hygiene, and results..."
                    value={reviewForm.review_text}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-[#0756A6] focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                {/* Moderation Policy Notice */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-[11px] text-[#0756A6]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    To prevent spam and protect patient privacy, new reviews are sent to the <strong>Admin Dashboard</strong> for verification before appearing live on the homepage.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                      <span>Submitting for Admin Approval...</span>
                    </>
                  ) : (
                    <span>Submit Review for Approval</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
}

