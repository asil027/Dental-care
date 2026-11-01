import React from 'react';
import { Calendar, Stethoscope, Cpu, Sparkles, ShieldCheck, Clock, PhoneCall, ArrowRight, MapPin } from 'lucide-react';
import { getHeroScheduleLines } from '../utils/time';

export default function Hero({ cms, settings, onOpenBooking }) {
  const scheduleLines = getHeroScheduleLines(settings);
  const heroData = cms?.hero || {};
  const badge = heroData.badge || 'WELCOME TO DENTAL CARE';
  const heading = heroData.heading || 'Your Smile\nOur Priority';
  const description = heroData.description || 'We provide exceptional dental care in a comfortable and friendly environment. Our experienced team is here to keep your smile healthy and beautiful.';
  const primaryBtnText = heroData.primaryBtnText || 'Book Appointment';
  const secondaryBtnText = heroData.secondaryBtnText || 'Our Services';
  const heroImage = heroData.heroImage || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80';
  const badgeCursive = heroData.badgeCursive || 'Healthy Smile Happy Life ♡';

  const benefits = heroData.benefits || [
    { icon: 'Stethoscope', title: 'Expert Doctors & Staff', desc: 'Certified specialists' },
    { icon: 'Cpu', title: 'Modern Technology', desc: '3D digital imaging' },
    { icon: 'Sparkles', title: 'Clean & Safe Environment', desc: 'Sterilized hospital grade' },
    { icon: 'ShieldCheck', title: 'Affordable Treatment', desc: 'Transparent pricing' }
  ];

  const getIcon = (name) => {
    switch (name) {
      case 'Stethoscope':
      case 'Users':
        return <Stethoscope className="w-5 h-5 text-[#0756A6]" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-[#0756A6]" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#0756A6]" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-[#0756A6]" />;
    }
  };

  return (
    <section id="home" className="relative pt-6 pb-12 lg:pt-10 lg:pb-16 overflow-hidden bg-gradient-to-b from-[#F4F8FF] via-white to-white">
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-blue-50/70 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline, subtext, CTA, 4 benefits */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Pill kicker badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/70 text-[#0756A6] text-xs font-bold tracking-wider uppercase border border-blue-200/50 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0756A6] animate-pulse"></span>
              {badge}
            </div>

            {/* Main title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#092C59] tracking-tight leading-[1.1] font-sans">
              {heading.split('\n').map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              {description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={() => onOpenBooking()}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-blue-200" />
                {primaryBtnText}
              </button>

              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold text-[#092C59] bg-white hover:bg-blue-50/50 border border-slate-300 hover:border-[#0756A6] transition-all duration-200 shadow-xs"
              >
                {secondaryBtnText}
              </a>
            </div>

            {/* 4 feature badges in a row below buttons */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0756A6] shrink-0 border border-blue-100/80">
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#092C59] leading-snug">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero photo with curved crop + handwritten badge + Opening Hours card */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            
            {/* Curved image container matching the reference image */}
            <div className="relative w-full max-w-md lg:max-w-none">
              
              {/* Main curved patient treatment photo */}
              <div className="relative overflow-hidden rounded-[36px] lg:rounded-[48px] shadow-2xl border-4 border-white bg-slate-100 aspect-[4/4.5] object-cover">
                <img
                  src={heroImage}
                  alt="Quality Dental Care Patient Treatment"
                  className="w-full h-full object-cover object-center"
                />

                {/* Gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#092C59]/40 via-transparent to-transparent pointer-events-none" />

                {/* Floating handwritten cursive badge matching reference: "Healthy Smile Happy Life ♡" */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/60 transform -rotate-3 transition hover:rotate-0">
                  <p className="font-['Caveat'] text-2xl font-bold text-[#0756A6] tracking-wide select-none">
                    {badgeCursive}
                  </p>
                </div>
              </div>

              {/* Floating Opening Hours & Clinic Location Card matching reference & prompt specs */}
              <div className="mt-5 sm:-mt-12 sm:absolute sm:-bottom-8 sm:-left-6 w-full sm:w-[94%] bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-blue-100/80 z-20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0756A6]" />
                    <span className="text-sm font-bold text-[#092C59]">Opening Hours</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {settings?.operating_end_time === '12:00 AM' ? 'Open Till Midnight' : `Open Till ${settings?.operating_end_time || '12:00 AM'}`}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {scheduleLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center ${line.isOff ? 'text-rose-600' : ''}`}
                    >
                      <span className={`font-medium ${line.isOff ? '' : 'text-slate-700'}`}>
                        {line.label}
                      </span>
                      <span className={line.isOff ? 'font-bold uppercase tracking-wider' : 'font-semibold text-[#0756A6]'}>
                        {line.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Clinic Location Address */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-[#0756A6] shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold text-[#092C59]">Clinic Location: </span>
                    <span className="text-slate-600 font-medium">
                      {settings?.address || 'Suite 402, Dental Care Plaza, Main Boulevard, Gulberg III, Lahore, Pakistan'}
                    </span>
                  </div>
                </div>

                {/* Emergency Care Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Need Urgent Dental Help?
                  </div>
                  <a
                    href={`tel:${settings?.emergency_phone || '+923001234567'}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Emergency Care
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

