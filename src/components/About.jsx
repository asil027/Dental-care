import React from 'react';
import { ShieldCheck, Award, Users, Sparkles, CheckCircle2, Calendar, ArrowRight, HeartHandshake } from 'lucide-react';

export default function About({ cms, settings, onOpenBooking }) {
  const aboutData = cms?.about || {};
  const kicker = aboutData.kicker || 'ABOUT DENTAL CARE';
  const heading = aboutData.heading || 'Dedicated to Excellence in Painless Modern Dentistry';
  const description = aboutData.description || 'Since 2012, Dental Care has delivered compassionate, world-class dental treatments in Lahore. Our clinic combines hospital-grade sterilization, digital 3D intraoral imaging, and computer-guided painless anesthesia so every patient feels relaxed and confident in their smile.';
  
  const stats = [
    { label: 'Happy Patients', value: aboutData.happyPatients || '15,000+', icon: Users },
    { label: 'Years of Excellence', value: aboutData.experienceYears || '12+', icon: Award },
    { label: 'Patient Satisfaction', value: '99.4%', icon: HeartHandshake },
    { label: 'Certified Dentists', value: aboutData.specialistCount || '4+', icon: ShieldCheck }
  ];

  const highlights = [
    'Painless computerized local anesthesia',
    'High-resolution 3D digital oral scanner',
    'Strict 4-stage autoclave hospital sterilization',
    'Tailored cosmetic & restorative smile makeovers',
    'Same-day emergency dental relief',
    'Comfortable relaxing clinic lounge'
  ];

  return (
    <section id="about" className="scroll-mt-24 py-20 bg-gradient-to-b from-white via-[#F4F8FF]/60 to-white relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column (6 cols): Visual Collage */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Clinic Image */}
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=800&q=80"
                  alt="Modern Dental Clinic Treatment Room"
                  className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Floating Secondary Image Badge */}
              <div className="hidden sm:block absolute -bottom-8 -right-6 w-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
                  alt="3D Digital Dental Technology"
                  className="w-full h-36 object-cover"
                />
                <div className="p-2.5 bg-[#092C59] text-white text-center">
                  <span className="text-[11px] font-bold block">3D Digital Dentistry</span>
                  <span className="text-[9px] text-blue-200">Latest Dental Tech</span>
                </div>
              </div>

              {/* Experience Badge */}
              <div className="absolute -top-6 -left-6 bg-gradient-to-br from-[#0756A6] to-[#092C59] text-white rounded-2xl p-4 shadow-xl border border-blue-400/30 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-2xl text-amber-300">
                  12+
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">Years of</span>
                  <span className="text-[11px] text-blue-200 font-medium block">Clinical Trust</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (6 cols): Story & Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/70 text-[#0756A6] text-xs font-bold tracking-wider uppercase border border-blue-200/50">
              <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
              {kicker}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#092C59] tracking-tight leading-tight">
              {heading}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {description}
            </p>

            {/* Checklist of highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
              {stats.map((s, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs text-center">
                  <div className="text-xl sm:text-2xl font-black text-[#0756A6]">
                    {s.value}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm hover:shadow transition cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-200" />
                <span>Book Appointment</span>
              </button>

              <a
                href="#doctors"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold text-[#0756A6] bg-blue-50 hover:bg-blue-100 transition"
              >
                <span>Meet Our Doctors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

