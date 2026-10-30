import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import QuickBooking from '../components/QuickBooking';
import Services from '../components/Services';
import Doctors from '../components/Doctors';
import TestimonialsInsurance from '../components/TestimonialsInsurance';
import Faq from '../components/Faq';
import Blog from '../components/Blog';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import { apiRequest } from '../utils/api';
import { Loader2 } from 'lucide-react';

export default function PublicHome() {
  const [cms, setCms] = useState({});
  const [settings, setSettings] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preSelectedDoctor, setPreSelectedDoctor] = useState(null);
  const [preSelectedService, setPreSelectedService] = useState(null);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      const [
        cmsRes,
        settingsRes,
        doctorsRes,
        servicesRes,
        testimonialsRes,
        insuranceRes,
        faqsRes,
        blogRes
      ] = await Promise.all([
        apiRequest('/cms'),
        apiRequest('/settings'),
        apiRequest('/doctors'),
        apiRequest('/services'),
        apiRequest('/testimonials'),
        apiRequest('/insurance'),
        apiRequest('/faqs'),
        apiRequest('/blog')
      ]);

      setCms(cmsRes.cms || {});
      setSettings(settingsRes.settings || {});
      setDoctors(doctorsRes.doctors || []);
      setServices(servicesRes.services || []);
      setTestimonials(testimonialsRes.testimonials || []);
      setInsurance(insuranceRes.insurance || []);
      setFaqs(faqsRes.faqs || []);
      setArticles(blogRes.articles || []);
    } catch (err) {
      console.error('Error loading public homepage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBooking = (doc = null, serv = null) => {
    setPreSelectedDoctor(doc);
    setPreSelectedService(serv);
    setIsBookingModalOpen(true);
  };

  const isSectionVisible = (id) => {
    const orders = cms?.section_order;
    if (!orders || !Array.isArray(orders)) return true;
    const found = orders.find((s) => s.id === id);
    return found ? found.visible !== false : true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0756A6] shadow-sm animate-pulse">
            <svg className="w-7 h-7 fill-current text-[#0756A6]" viewBox="0 0 24 24">
              <path d="M7 2C4 2 2 4.5 2 7.5c0 4 2 7.5 4 11.5 1 2 2.5 3 4 3s2-1 2.5-3c.5-2 1-3.5 1.5-3.5s1 1.5 1.5 3.5c.5 2 1 3 2.5 3s3-1 4-3c2-4 4-7.5 4-11.5C22 4.5 20 2 17 2c-2.5 0-4 2-5 3.5C11 4 9.5 2 7 2z" fillOpacity="0.2" stroke="#0756A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#092C59]">Loading Dental Care Clinic...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* A. Sticky Header / Navigation */}
      <Navbar
        settings={settings}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Main Sections in EXACT order */}
      <main className="flex-1">
        {/* B. Hero Section */}
        {isSectionVisible('hero') && (
          <Hero
            cms={cms}
            settings={settings}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {/* C. Quick Appointment Form */}
        {isSectionVisible('quick_booking') && (
          <QuickBooking
            doctors={doctors}
            services={services}
            settings={settings}
            onBookingSuccess={() => {}}
          />
        )}

        {/* E. Dental Services Section */}
        {isSectionVisible('services') && (
          <Services
            services={services}
            onBookService={(serv) => handleOpenBooking(null, serv)}
          />
        )}

        {/* D. Doctors Section */}
        {isSectionVisible('doctors') && (
          <Doctors
            doctors={doctors}
            onBookDoctor={(doc) => handleOpenBooking(doc, null)}
          />
        )}

        {/* F. Testimonials and Insurance Section */}
        {isSectionVisible('testimonials_insurance') && (
          <TestimonialsInsurance
            testimonials={testimonials}
            insurance={insurance}
          />
        )}

        {/* G. FAQ Section */}
        {isSectionVisible('faq') && (
          <Faq faqs={faqs} />
        )}

        {/* H. Blog & News Section */}
        {isSectionVisible('blog') && (
          <Blog articles={articles} />
        )}

        {/* I. Contact Section */}
        {isSectionVisible('contact') && (
          <Contact settings={settings} />
        )}
      </main>

      {/* J. Footer */}
      <Footer settings={settings} />

      {/* Universal Booking / Consultation Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        doctors={doctors}
        services={services}
        settings={settings}
        preSelectedDoctor={preSelectedDoctor}
        preSelectedService={preSelectedService}
      />
    </div>
  );
}

