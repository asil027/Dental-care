import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PublicHome from './pages/PublicHome';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import DashboardHome from './admin/DashboardHome';
import AppointmentsManager from './admin/AppointmentsManager';
import ConsultationsManager from './admin/ConsultationsManager';
import PatientsManager from './admin/PatientsManager';
import DoctorsManager from './admin/DoctorsManager';
import ServicesManager from './admin/ServicesManager';
import TestimonialsManager from './admin/TestimonialsManager';
import InsuranceManager from './admin/InsuranceManager';
import BlogManager from './admin/BlogManager';
import FaqsManager from './admin/FaqsManager';
import GalleryManager from './admin/GalleryManager';
import CmsManager from './admin/CmsManager';
import SettingsManager from './admin/SettingsManager';
import ProfileManager from './admin/ProfileManager';
import MessagesManager from './admin/MessagesManager';
import { apiRequest, getAdminToken, setAdminToken } from './utils/api';

function ProtectedAdminRoute({ children, admin, setAdmin }) {
  const token = getAdminToken();
  const [checking, setChecking] = useState(!admin && Boolean(token));

  useEffect(() => {
    if (!admin && token) {
      apiRequest('/auth/me')
        .then((res) => {
          setAdmin(res.admin);
        })
        .catch(() => {
          setAdminToken(null);
          setAdmin(null);
        })
        .finally(() => {
          setChecking(false);
        });
    }
  }, [admin, token]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F4F8FF] flex items-center justify-center">
        <span className="text-sm font-bold text-[#092C59]">Verifying Admin Access...</span>
      </div>
    );
  }

  return children;
}

export default function App() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      apiRequest('/auth/me')
        .then((res) => setAdmin(res.admin))
        .catch(() => {
          setAdminToken(null);
          setAdmin(null);
        });
    }
  }, []);

  return (
    <Routes>
      {/* 1. Public-Facing Dental Care Website */}
      <Route path="/" element={<PublicHome />} />

      {/* 2. Admin Authentication */}
      <Route
        path="/admin/login"
        element={<AdminLogin onLoginSuccess={(ad) => setAdmin(ad)} />}
      />

      {/* 3. Private Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute admin={admin} setAdmin={setAdmin}>
            <AdminLayout admin={admin} onLogout={() => setAdmin(null)} />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="appointments" element={<AppointmentsManager />} />
        <Route path="messages" element={<MessagesManager />} />
        <Route path="consultations" element={<ConsultationsManager />} />
        <Route path="patients" element={<PatientsManager />} />
        <Route path="doctors" element={<DoctorsManager />} />
        <Route path="services" element={<ServicesManager />} />
        <Route path="testimonials" element={<TestimonialsManager />} />
        <Route path="insurance" element={<InsuranceManager />} />
        <Route path="blog" element={<BlogManager />} />
        <Route path="faqs" element={<FaqsManager />} />
        <Route path="gallery" element={<GalleryManager />} />
        <Route path="cms" element={<CmsManager />} />
        <Route path="settings" element={<SettingsManager onSettingsUpdated={() => {}} />} />
        <Route path="profile" element={<ProfileManager admin={admin} onProfileUpdated={(updated) => setAdmin(updated)} />} />
      </Route>

      {/* Fallback to Public Homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

