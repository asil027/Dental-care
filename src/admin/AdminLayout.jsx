import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Users,
  UserCheck,
  Grid,
  Star,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Image,
  LayoutTemplate,
  Settings,
  UserCog,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
  Mail
} from 'lucide-react';
import { apiRequest, setAdminToken } from '../utils/api';
import BrandLogo from '../components/BrandLogo';

export default function AdminLayout({ admin, onLogout }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingConsultationsCount, setPendingConsultationsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const getReadSet = (key) => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || '[]').map(String));
    } catch (e) {
      return new Set();
    }
  };

  const markIdsRead = (key, ids = []) => {
    try {
      const existing = getReadSet(key);
      ids.forEach((id) => existing.add(String(id)));
      localStorage.setItem(key, JSON.stringify([...existing]));
    } catch (e) {}
  };

  useEffect(() => {
    const path = location.pathname;

    // Fetch quick stats for badges
    apiRequest('/stats/overview')
      .then((res) => {
        // 1. Appointments
        const apptIds = res.unreadIds?.appointments || [];
        if (path.startsWith('/admin/appointments')) {
          markIdsRead('dc_read_appointment_ids', apptIds);
          setPendingCount(0);
        } else {
          const readApptIds = getReadSet('dc_read_appointment_ids');
          const unreadAppts = apptIds.filter((id) => !readApptIds.has(String(id)));
          setPendingCount(unreadAppts.length);
        }

        // 2. Inquiries & Messages
        const msgIds = res.unreadIds?.messages || [];
        if (path.startsWith('/admin/messages')) {
          markIdsRead('dc_read_message_ids', msgIds);
          setUnreadMessagesCount(0);
        } else {
          const readMsgIds = getReadSet('dc_read_message_ids');
          const unreadMsgs = msgIds.filter((id) => !readMsgIds.has(String(id)));
          setUnreadMessagesCount(unreadMsgs.length);
        }

        // 3. Consultations
        const consIds = res.unreadIds?.consultations || [];
        if (path.startsWith('/admin/consultations')) {
          markIdsRead('dc_read_consultation_ids', consIds);
          setPendingConsultationsCount(0);
        } else {
          const readConsIds = getReadSet('dc_read_consultation_ids');
          const unreadCons = consIds.filter((id) => !readConsIds.has(String(id)));
          setPendingConsultationsCount(unreadCons.length);
        }

        // 4. Testimonials & Reviews
        const revIds = res.unreadIds?.reviews || [];
        if (path.startsWith('/admin/testimonials')) {
          markIdsRead('dc_read_review_ids', revIds);
          setPendingReviewsCount(0);
        } else {
          const readRevIds = getReadSet('dc_read_review_ids');
          const unreadRevs = revIds.filter((id) => !readRevIds.has(String(id)));
          setPendingReviewsCount(unreadRevs.length);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    setAdminToken(null);
    if (onLogout) onLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar, badge: pendingCount, badgeColor: 'bg-amber-400 text-slate-900' },
    { name: 'Inquiries & Messages', path: '/admin/messages', icon: Mail, badge: unreadMessagesCount, badgeColor: 'bg-rose-500 text-white' },
    { name: 'Consultations', path: '/admin/consultations', icon: MessageSquare, badge: pendingConsultationsCount, badgeColor: 'bg-amber-400 text-slate-900' },
    { name: 'Patients', path: '/admin/patients', icon: Users },
    { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
    { name: 'Services', path: '/admin/services', icon: Grid },
    { name: 'Reviews', path: '/admin/testimonials', icon: Star, badge: pendingReviewsCount, badgeColor: 'bg-amber-500 text-slate-900' },
    { name: 'Insurance', path: '/admin/insurance', icon: ShieldCheck },
    { name: 'Blog', path: '/admin/blog', icon: BookOpen },
    { name: 'FAQs', path: '/admin/faqs', icon: HelpCircle },
    { name: 'Gallery', path: '/admin/gallery', icon: Image },
    { name: 'Website Content', path: '/admin/cms', icon: LayoutTemplate },
    { name: 'Clinic Settings', path: '/admin/settings', icon: Settings },
    { name: 'Admin Profile', path: '/admin/profile', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8FF] flex">
      
      {/* Dark Navy Sidebar matching reference image */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#092C59] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Clinic Tagline */}
          <div className="p-6 border-b border-blue-900/60 flex items-center justify-between">
            <BrandLogo
              clinicName="Dental Care"
              tagline="Healthy Smiles, Brighter Future"
              size="sm"
              variant="light"
            />

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-blue-300 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#0756A6] text-white shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-blue-300" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-amber-400 text-slate-900'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Logout & Live Site link */}
        <div className="p-4 border-t border-blue-900/60 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Website</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Top Header matching reference image */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-[#092C59] tracking-tight">
                Dashboard
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Welcome back, {admin?.name || 'Admin'}! Here's what's happening today.
              </p>
            </div>
          </div>

          {/* Right Header: Search, Notifications, Messages, Admin Profile */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/messages')}
              className="relative p-2 text-slate-500 hover:text-[#0756A6] hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Patient Inquiries & Messages"
            >
              <Mail className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/appointments?status=Pending')}
              className="relative p-2 text-slate-500 hover:text-[#0756A6] hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Pending Appointments"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Profile Avatar Chip matching reference image */}
            <div
              onClick={() => navigate('/admin/profile')}
              className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
            >
              <img
                src={admin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={admin?.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
              <div className="hidden md:block text-left text-xs leading-tight">
                <span className="font-bold text-[#092C59] block">
                  {admin?.name || 'Admin'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {admin?.role || 'Super Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
    </div>
  );
}

