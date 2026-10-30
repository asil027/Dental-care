import React, { useState, useEffect } from 'react';
import { Search, Calendar, Phone, Clock, Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({ onOpenBooking, settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clinicPhone = settings?.phone || '+92 42 3578 9000';
  const tagline = settings?.tagline || 'Healthy Smiles, Brighter Future';
  const clinicName = settings?.clinic_name || 'Dental Care';

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavScroll = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Top micro bar for phone & hours */}
      <div className="bg-[#092C59] text-white text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {settings?.operating_start_time
                ? `${settings?.operating_start_time} – ${settings?.operating_end_time} (${settings?.weekly_holiday || 'Sunday'} Closed)`
                : `${settings?.working_hours_weekday || '11:00 AM – 12:00 AM'} (${settings?.weekly_holiday || 'Sunday'} Closed)`}
            </span>
            <span className="flex items-center gap-1.5 text-blue-200">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              Emergency: {settings?.emergency_phone || '+92 300 123 4567'}
            </span>
          </div>
          <div className="text-blue-200">
            <span>Pakistan Standard Time (Asia/Karachi) • Excellence in Dentistry</span>
          </div>
        </div>
      </div>

      {/* Main sticky header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-3'
            : 'bg-white py-4 border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Stylish Modern Brand Logo */}
          <a href="#home" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl">
            <BrandLogo
              clinicName={clinicName}
              tagline={tagline}
              size="md"
              variant="dark"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavScroll(e, link.href)}
                className="text-[15px] font-medium text-slate-700 hover:text-[#0756A6] transition-colors relative py-1 hover:font-semibold cursor-pointer"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions: Search & Book Appointment */}
          <div className="hidden sm:flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 text-slate-500 hover:text-[#0756A6] hover:bg-slate-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => onOpenBooking()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm hover:shadow transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-200" />
              Book Appointment
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none"
              aria-label="Open Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavScroll(e, link.href);
                }}
                className="block py-2 text-base font-medium text-slate-700 hover:text-[#0756A6] border-b border-slate-50 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full py-3 rounded-xl bg-[#092C59] text-white font-semibold text-center flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-200" />
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#092C59]">Search Dental Care</h3>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 relative">
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments, dentists, procedures..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0756A6]"
                autoFocus
              />
            </div>
            <div className="mt-4 text-xs text-slate-500 space-y-2">
              <div className="font-semibold text-slate-700">Popular Quick Links:</div>
              <div className="flex flex-wrap gap-2">
                {['Root Canal', 'Teeth Whitening', 'Invisalign', 'Dr. Ayesha Khan', 'Emergency Care', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href="#services"
                    onClick={() => setSearchOpen(false)}
                    className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#0756A6] rounded-full text-slate-700 transition"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

