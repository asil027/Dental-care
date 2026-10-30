import React, { useState } from 'react';
import { ArrowRight, Sparkles, Smile, Shield, Sun, Activity, Stethoscope, Clock, CheckCircle, X } from 'lucide-react';

export default function Services({ services = [], onBookService }) {
  const [selectedService, setSelectedService] = useState(null);

  const getServiceIcon = (iconName) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-[#0756A6]" />;
      case 'Smile':
        return <Smile className="w-6 h-6 text-[#0756A6]" />;
      case 'Sun':
        return <Sun className="w-6 h-6 text-[#0756A6]" />;
      case 'Activity':
        return <Activity className="w-6 h-6 text-[#0756A6]" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-[#0756A6]" />;
      default:
        return (
          <svg className="w-6 h-6 text-[#0756A6] fill-current" viewBox="0 0 24 24">
            <path d="M7 2C4 2 2 4.5 2 7.5c0 4 2 7.5 4 11.5 1 2 2.5 3 4 3s2-1 2.5-3c.5-2 1-3.5 1.5-3.5s1 1.5 1.5 3.5c.5 2 1 3 2.5 3s3-1 4-3c2-4 4-7.5 4-11.5C22 4.5 20 2 17 2c-2.5 0-4 2-5 3.5C11 4 9.5 2 7 2z" fillOpacity="0.2" stroke="#0756A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading matching reference image */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-50 px-3.5 py-1 rounded-full mb-3">
            OUR SERVICES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#092C59] tracking-tight">
            Complete Dental Care Services
          </h2>
          <p className="mt-3 text-base text-slate-500">
            From routine checkups to advanced treatments, we are here for your smile.
          </p>
        </div>

        {/* Services Cards Grid matching reference image cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl p-7 border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Icon in rounded card container */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-[#0756A6] group-hover:text-white transition-all">
                  {getServiceIcon(service.icon)}
                </div>

                <h3 className="text-xl font-bold text-[#092C59] group-hover:text-[#0756A6] transition-colors">
                  {service.name}
                </h3>

                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  {service.short_desc}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Starting from</span>
                  <div className="text-sm font-extrabold text-[#092C59]">
                    {service.price ? `PKR ${Number(service.price).toLocaleString()}` : 'Custom'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedService(service)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0756A6] hover:text-[#092C59] transition-colors group-hover:translate-x-1 duration-200 cursor-pointer"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedService.image && (
              <div className="rounded-2xl overflow-hidden h-48 w-full mb-6">
                <img
                  src={selectedService.image}
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full mb-2">
              Dental Treatment
            </div>
            <h3 className="text-2xl font-black text-[#092C59]">
              {selectedService.name}
            </h3>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {selectedService.full_desc || selectedService.short_desc}
            </p>

            <div className="my-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500">Standard Pricing</span>
                <div className="text-base font-extrabold text-[#092C59]">
                  {selectedService.price ? `PKR ${Number(selectedService.price).toLocaleString()}` : 'Consultation'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Duration</span>
                <div className="text-base font-extrabold text-[#092C59]">
                  {selectedService.duration_mins || 45} mins
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="text-xs font-bold text-[#092C59] uppercase tracking-wider">What to expect:</div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Painless treatment with state-of-the-art dental equipment</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Performed by certified specialist doctors</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Follow-up care and dental hygiene advice included</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedService(null);
                  onBookService(selectedService);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition shadow-md"
              >
                Book This Treatment
              </button>
              <button
                onClick={() => setSelectedService(null)}
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

