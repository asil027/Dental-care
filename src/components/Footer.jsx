import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, ArrowRight, Heart, CheckCircle2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer({ settings }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const clinicName = settings?.clinic_name || 'Dental Care';
  const tagline = settings?.tagline || 'Healthy Smiles, Brighter Future';
  const clinicPhone = settings?.phone || '+92 42 3578 9000';
  const clinicEmail = settings?.email || 'contact@dentalcareclinic.pk';
  const clinicAddress = settings?.address || 'Suite 402, Dental Care Medical Tower, Main Boulevard, Gulberg III, Lahore, Pakistan';

  return (
    <footer className="bg-[#092C59] text-white pt-16 pb-12 border-t border-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-blue-900/60">
          
          {/* Col 1 (4 cols): Brand & Info */}
          <div className="lg:col-span-4 space-y-4">
            {/* Stylish Brand Logo */}
            <BrandLogo
              clinicName={clinicName}
              tagline={tagline}
              size="md"
              variant="light"
            />

            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed pr-4">
              Providing modern, compassionate, and painless dentistry in Lahore. Equipped with digital scanners, painless computer anesthesia, and specialized consultants.
            </p>

            <div className="pt-2 text-xs text-blue-200/90 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{clinicAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  {settings?.operating_start_time
                    ? `${settings?.operating_start_time} – ${settings?.operating_end_time} (${settings?.weekly_holiday || 'Sunday'} Closed)`
                    : `${settings?.working_hours_weekday || '11:00 AM – 12:00 AM'} (${settings?.weekly_holiday || 'Sunday'} Closed)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{clinicPhone}</span>
              </div>
            </div>
          </div>

          {/* Col 2 (2 cols): Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-100">
              <li><a href="#home" className="hover:text-white transition">Home</a></li>
              <li><a href="#services" className="hover:text-white transition">Services</a></li>
              <li><a href="#doctors" className="hover:text-white transition">Our Doctors</a></li>
              <li><a href="#appointments" className="hover:text-white transition">Appointments</a></li>
              <li><a href="#testimonials" className="hover:text-white transition">Reviews</a></li>
              <li><a href="#faq" className="hover:text-white transition">FAQs</a></li>
              <li><a href="#contact" className="hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>

          {/* Col 3 (3 cols): Treatments */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Dental Treatments
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-100">
              <li><a href="#services" className="hover:text-white transition">General Dentistry & Cleaning</a></li>
              <li><a href="#services" className="hover:text-white transition">Porcelain Veneers & Makeovers</a></li>
              <li><a href="#services" className="hover:text-white transition">Invisalign & Clear Aligners</a></li>
              <li><a href="#services" className="hover:text-white transition">Microscopic Root Canal</a></li>
              <li><a href="#services" className="hover:text-white transition">Permanent Dental Implants</a></li>
              <li><a href="#services" className="hover:text-white transition">In-Office Laser Whitening</a></li>
            </ul>
          </div>

          {/* Col 4 (3 cols): Newsletter & Connect */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Stay Connected
            </h4>
            <p className="text-xs text-blue-200 leading-relaxed">
              Subscribe to get dental care tips, smile care advice, and exclusive clinic updates.
            </p>

            {subscribed ? (
              <div className="p-3 bg-blue-500/20 border border-blue-400/40 rounded-xl text-xs text-blue-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thank you! You are subscribed to Dental Care news.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl text-xs font-bold text-[#092C59] bg-white hover:bg-blue-50 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0756A6]" />
                </button>
              </form>
            )}

            <div className="pt-2 text-xs text-blue-300/80">
              <span>Timezone: Pakistan Standard Time (PKT)</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-200/70 gap-4">
          <p>
            © {new Date().getFullYear()} {clinicName}. All rights reserved. Registered Dental Surgery Practice.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition">Terms of Service</a>
            <a href="#contact" className="hover:text-white transition">Patient Support</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

