import React, { useState } from 'react';
import { Star, ArrowRight, Calendar, Stethoscope, Award, Clock, X, Check } from 'lucide-react';

export default function Doctors({ doctors = [], onBookDoctor }) {
  const [activeDoctorModal, setActiveDoctorModal] = useState(null);

  return (
    <section id="doctors" className="py-20 bg-[#F4F8FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header matching reference image */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-100/60 px-3.5 py-1 rounded-full mb-3">
              OUR DOCTORS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#092C59] tracking-tight">
              Meet Our Expert Dentists
            </h2>
            <p className="mt-2 text-base text-slate-500 max-w-xl">
              Our experienced and caring team is committed to your oral health.
            </p>
          </div>

          <div>
            <a
              href="#appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-[#092C59] bg-white hover:bg-blue-50 border border-slate-200 shadow-xs transition"
            >
              <span>View All Doctors</span>
              <ArrowRight className="w-4 h-4 text-[#0756A6]" />
            </a>
          </div>
        </div>

        {/* Doctor Cards Grid matching reference image cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Photo */}
                <div className="relative aspect-[4/4.2] overflow-hidden bg-slate-100">
                  <img
                    src={doctor.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80'}
                    alt={doctor.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Floating specialty badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0756A6] shadow-xs">
                    {doctor.specialization}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#092C59] group-hover:text-[#0756A6] transition-colors leading-snug">
                        {doctor.name}
                      </h3>
                      <div className="text-xs text-[#0756A6] font-medium mt-0.5">
                        {doctor.qualification}
                      </div>
                    </div>

                    {/* Circle arrow button matching reference image */}
                    <button
                      onClick={() => setActiveDoctorModal(doctor)}
                      className="w-8 h-8 rounded-full bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
                      title="View Full Profile"
                      aria-label="View doctor profile"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Experience and Rating matching reference */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {doctor.experience_years}+ Years Experience
                    </span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(doctor.rating).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({doctor.reviews_count || 100}+)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => onBookDoctor(doctor, 'consultation')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-[#092C59] hover:text-white bg-blue-50 hover:bg-[#092C59] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-100"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Doctor Profile Modal */}
      {activeDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveDoctorModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-blue-100 shadow-md">
                <img
                  src={activeDoctorModal.photo}
                  alt={activeDoctorModal.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="text-center sm:text-left">
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#0756A6] text-xs font-bold rounded-full mb-1">
                  {activeDoctorModal.specialization}
                </span>
                <h3 className="text-2xl font-black text-[#092C59]">
                  {activeDoctorModal.name}
                </h3>
                <div className="text-xs text-slate-600 font-semibold mt-0.5">
                  {activeDoctorModal.qualification}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{Number(activeDoctorModal.rating).toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({activeDoctorModal.reviews_count || 120} reviews)</span>
                  </div>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {activeDoctorModal.experience_years}+ Years Clinical Practice
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div>
                <h4 className="font-bold text-[#092C59] text-xs uppercase tracking-wider mb-1">
                  Doctor Biography & Clinical Focus
                </h4>
                <p className="leading-relaxed">
                  {activeDoctorModal.bio}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div>
                  <span className="text-xs text-slate-500">Consultation Fee</span>
                  <div className="text-base font-extrabold text-[#092C59]">
                    PKR {Number(activeDoctorModal.consultation_fee || 2500).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Clinic Availability</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {activeDoctorModal.available_days?.split(',').slice(0, 3).join(', ')}... (11 AM - 12 AM)
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  const doc = activeDoctorModal;
                  setActiveDoctorModal(null);
                  onBookDoctor(doc);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-200" />
                Book With {activeDoctorModal.name}
              </button>
              <button
                onClick={() => setActiveDoctorModal(null)}
                className="px-5 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

