import React, { useState } from 'react';
import { ShieldCheck, CreditCard, CheckCircle2, ChevronRight, Info, X } from 'lucide-react';

export default function InsurancePartners({ insurance = [] }) {
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const defaultProviders = [
    { id: 1, name: 'Jubilee Life Insurance', coverage_summary: 'Up to 80% coverage on root canals, scaling, fillings & consultations.' },
    { id: 2, name: 'EFU General Insurance', coverage_summary: 'Comprehensive corporate outpatient dental coverage & direct billing.' },
    { id: 3, name: 'Adamjee Insurance', coverage_summary: 'Cashless OPD treatments, emergency dental care & scaling.' },
    { id: 4, name: 'Askari General Insurance', coverage_summary: 'Coverage for preventive, restorative and pediatric dentistry.' },
    { id: 5, name: 'TPL Insurance', coverage_summary: 'Direct panel cashless claims for consultations and fillings.' },
    { id: 6, name: 'State Life Insurance', coverage_summary: 'Subsidized treatment coverage for corporate cardholders.' }
  ];

  const providers = insurance && insurance.length > 0 ? insurance : defaultProviders;

  return (
    <section className="py-16 bg-[#092C59] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column (5 cols): Info & Explanation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>INSURANCE & PAYMENTS</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Seamless Insurance Coverage & Cashless Billing
            </h3>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              We partner with Pakistan's premier corporate and personal health insurance providers. Our reception team handles fast pre-authorizations, direct panel claims, and zero-paperwork billing.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Direct Panel Cashless Claims</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All Major Credit/Debit Cards</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer"
              >
                <span>View Full Dental Insurance Panel Guide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column (7 cols): Partners Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {providers.map((prov) => (
                <div
                  key={prov.id}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex items-center gap-3 transition-all duration-150"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">
                      {prov.name}
                    </h5>
                    <span className="text-[10px] text-blue-300">
                      Approved Panel
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Insurance Details Modal */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowInsuranceModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-[#0756A6] rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h4 className="text-xl font-bold text-[#092C59] mb-2">
              Dental Insurance Panel Verification
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              Bring your corporate health card and CNIC during your appointment. Our administrative desk will process instant verification.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {providers.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-bold text-xs text-[#092C59]">{p.name}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {p.coverage_summary || 'Outpatient dental coverage, emergency care & routine treatments.'}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowInsuranceModal(false)}
              className="w-full mt-6 py-3 rounded-xl bg-[#092C59] text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

