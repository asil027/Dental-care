import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Stethoscope,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Eye,
  CheckCircle,
  Clock,
  UserPlus,
  Settings,
  Grid,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  X,
  Phone,
  AlertCircle,
  Star,
  ChevronDown,
  Check
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { formatPKR } from '../utils/time';

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('This Week');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/stats/overview');

      // Merge local appointments
      const localAppts = JSON.parse(localStorage.getItem('dc_submitted_appointments') || '[]');
      const serverUpcoming = res.upcomingAppointments || [];
      const serverAll = res.allAppointments || serverUpcoming;

      const serverCodes = new Set(serverAll.map(a => a.appointment_code || a.id));
      const missingAppts = localAppts.filter(a => !serverCodes.has(a.appointment_code || a.id));
      const mergedAllAppts = [...missingAppts, ...serverAll];
      const mergedUpcoming = [...missingAppts, ...serverUpcoming];

      // Merge local contact messages
      const localMsgs = JSON.parse(localStorage.getItem('dc_submitted_messages') || '[]');
      const serverMsgs = res.recentMessages || [];
      const serverMsgKeys = new Set(serverMsgs.map(m => m.id || `${m.email}-${m.created_at}`));
      const missingMsgs = localMsgs.filter(m => !serverMsgKeys.has(m.id || `${m.email}-${m.created_at}`));
      const mergedMsgs = [...missingMsgs, ...serverMsgs];

      // Merge local patient reviews
      const localRevs = JSON.parse(localStorage.getItem('dc_submitted_reviews') || '[]');
      const serverRevs = res.recentTestimonials || [];
      const serverRevIds = new Set(serverRevs.map(r => r.id));
      const missingRevs = localRevs.filter(r => !serverRevIds.has(r.id));
      const mergedRevs = [...missingRevs, ...serverRevs];

      const mergedData = {
        ...res,
        upcomingAppointments: mergedUpcoming,
        allAppointments: mergedAllAppts,
        recentMessages: mergedMsgs,
        recentTestimonials: mergedRevs,
        stats: {
          ...res.stats,
          totalAppointments: (res.stats.totalAppointments || 0) + missingAppts.length,
          unreadMessages: (res.stats.unreadMessages || 0) + missingMsgs.filter(m => !m.is_read).length,
          totalMessages: (res.stats.totalMessages || 0) + missingMsgs.length,
          pendingTestimonials: (res.stats.pendingTestimonials || 0) + missingRevs.filter(r => !r.is_approved).length,
          totalTestimonials: (res.stats.totalTestimonials || 0) + missingRevs.length
        }
      };

      setData(mergedData);
      localStorage.setItem('dc_cached_dashboard', JSON.stringify(mergedData));
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
      const cached = localStorage.getItem('dc_cached_dashboard');
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkMessageRead = async (id) => {
    try {
      await apiRequest(`/messages/${id}/read`, { method: 'PATCH' }).catch(() => {});
      try {
        const localMsgs = JSON.parse(localStorage.getItem('dc_submitted_messages') || '[]');
        const updated = localMsgs.map(m => (m.id === id ? { ...m, is_read: 1 } : m));
        localStorage.setItem('dc_submitted_messages', JSON.stringify(updated));
      } catch (e) {}
      fetchStats();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => ({ ...prev, is_read: 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }).catch(() => {});
      try {
        const localAppts = JSON.parse(localStorage.getItem('dc_submitted_appointments') || '[]');
        const updated = localAppts.map(a => (a.id === id || a.appointment_code === id ? { ...a, status } : a));
        localStorage.setItem('dc_submitted_appointments', JSON.stringify(updated));
      } catch (e) {}
      fetchStats();
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update appointment status');
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0756A6]" />
          <span className="text-sm font-semibold text-slate-500">Loading live clinic analytics...</span>
        </div>
      </div>
    );
  }

  const { stats, upcomingAppointments, recentPatients, recentMessages = [], recentTestimonials = [], weeklyChart } = data;

  const handleToggleApproveReview = async (id) => {
    try {
      setData((prev) => {
        if (!prev) return prev;
        const updatedList = (prev.recentTestimonials || []).map((t) =>
          t.id === id ? { ...t, is_approved: t.is_approved ? 0 : 1 } : t
        );
        const pendingCount = updatedList.filter((t) => !t.is_approved).length;
        return {
          ...prev,
          recentTestimonials: updatedList,
          stats: {
            ...prev.stats,
            pendingTestimonials: pendingCount
          }
        };
      });
      await apiRequest(`/testimonials/${id}/toggle-approve`, { method: 'PATCH' });
      const res = await apiRequest('/stats/overview');
      setData(res);
    } catch (err) {
      console.error('Failed to toggle review approval:', err);
      fetchStats();
    }
  };

  // Dynamic chart data calculation matching selected timeframe
  const computeChartData = (timeframe, appointments = [], defaultWeekly = []) => {
    const now = new Date();

    if (timeframe === 'This Week') {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - distanceToMonday);

      const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return weekLabels.map((day, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const count = appointments.filter((a) => a.appointment_date === dStr).length;
        return {
          day,
          date: dStr,
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          appointments: count
        };
      });
    }

    if (timeframe === 'Last Week') {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7 + 7;
      const prevMonday = new Date(now);
      prevMonday.setDate(now.getDate() - distanceToMonday);

      const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return weekLabels.map((day, i) => {
        const d = new Date(prevMonday);
        d.setDate(prevMonday.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const count = appointments.filter((a) => a.appointment_date === dStr).length;
        return {
          day,
          date: dStr,
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          appointments: count
        };
      });
    }

    if (timeframe === 'This Month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = now.toLocaleString('en-US', { month: 'short' });

      const periods = [
        { day: 'Week 1', start: 1, end: 7 },
        { day: 'Week 2', start: 8, end: 14 },
        { day: 'Week 3', start: 15, end: 21 },
        { day: 'Week 4', start: 22, end: daysInMonth }
      ];

      return periods.map((p) => {
        const count = appointments.filter((a) => {
          if (!a.appointment_date || !a.appointment_date.startsWith(monthPrefix)) return false;
          const dayPart = parseInt(a.appointment_date.split('-')[2], 10);
          return dayPart >= p.start && dayPart <= p.end;
        }).length;
        return {
          day: p.day,
          date: `${monthPrefix}-${p.start}`,
          fullDate: `${monthName} ${p.start} – ${p.end}`,
          appointments: count
        };
      });
    }

    if (timeframe === 'Last 30 Days') {
      const intervals = [];
      for (let i = 5; i >= 0; i--) {
        const endDaysAgo = i * 5;
        const startDaysAgo = endDaysAgo + 4;
        const sDate = new Date(now);
        sDate.setDate(now.getDate() - startDaysAgo);
        const eDate = new Date(now);
        eDate.setDate(now.getDate() - endDaysAgo);

        const sStr = sDate.toISOString().split('T')[0];
        const eStr = eDate.toISOString().split('T')[0];

        const count = appointments.filter((a) => a.appointment_date && a.appointment_date >= sStr && a.appointment_date <= eStr).length;
        intervals.push({
          day: `${sDate.getDate()}/${sDate.getMonth() + 1}`,
          date: sStr,
          fullDate: `${sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          appointments: count
        });
      }
      return intervals;
    }

    if (timeframe === 'All Time') {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const count = appointments.filter((a) => a.appointment_date && a.appointment_date.startsWith(mStr)).length;
        months.push({
          day: d.toLocaleString('en-US', { month: 'short' }),
          date: mStr,
          fullDate: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          appointments: count
        });
      }
      return months;
    }

    return defaultWeekly;
  };

  const getTimeframeSubtitle = (tf) => {
    switch (tf) {
      case 'This Week':
        return 'Weekly patient traffic breakdown (Mon – Sun)';
      case 'Last Week':
        return 'Previous week patient traffic breakdown (Mon – Sun)';
      case 'This Month':
        return 'Current month patient traffic by weekly intervals';
      case 'Last 30 Days':
        return 'Past 30 days patient traffic overview (5-day intervals)';
      case 'All Time':
        return 'Historical patient traffic volume by month';
      default:
        return 'Patient appointment traffic overview';
    }
  };

  // Compute SVG chart coordinates for dynamic spline curve
  const chartHeight = 125;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingY = 22;

  const activeChartData = computeChartData(
    chartTimeframe,
    data?.allAppointments || data?.upcomingAppointments || [],
    weeklyChart || []
  );

  const totalApptsInPeriod = activeChartData.reduce((sum, d) => sum + d.appointments, 0);
  const peakAppts = Math.max(...activeChartData.map((d) => d.appointments), 0);
  const maxCount = Math.max(peakAppts, 5);

  const points = activeChartData.map((d, index) => {
    const x = paddingX + (index / (activeChartData.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = (chartHeight - paddingY) - (d.appointments / maxCount) * (chartHeight - paddingY * 2);
    return {
      x,
      y,
      day: d.day,
      date: d.date,
      fullDate: d.fullDate,
      count: d.appointments
    };
  });

  // Construct smooth SVG path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Gradient area path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  return (
    <div className="space-y-7">
      
      {/* Actionable Notification Banners */}
      {((stats.unreadMessages && stats.unreadMessages > 0) || (stats.pendingTestimonials && stats.pendingTestimonials > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.unreadMessages > 0 && (
            <div
              onClick={() => navigate('/admin/messages')}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:bg-rose-100/70 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">
                    {stats.unreadMessages} New Website Inquir{stats.unreadMessages > 1 ? 'ies' : 'y'}
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Visitors sent messages via the contact form. Click to review and reply.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
          )}

          {stats.pendingTestimonials > 0 && (
            <div
              onClick={() => navigate('/admin/testimonials')}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:bg-amber-100/70 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {stats.pendingTestimonials} Patient Review{stats.pendingTestimonials > 1 ? 's' : ''} Awaiting Approval
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Patients submitted reviews from homepage. Click to approve and publish.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
          )}
        </div>
      )}
      
      {/* 5 Key Clinic & Portal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Appointments
            </span>
            <div className="text-2xl font-black text-[#092C59]">
              {stats.totalAppointments}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% from last week</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Patients
            </span>
            <div className="text-2xl font-black text-[#092C59]">
              {stats.totalPatients}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8% from last week</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Doctors
            </span>
            <div className="text-2xl font-black text-[#092C59]">
              {stats.totalDoctors}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>4 Active In-Clinic</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0756A6] flex items-center justify-center border border-sky-100">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        {/* Patient Reviews */}
        <div
          onClick={() => navigate('/admin/testimonials')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Patient Reviews
            </span>
            <div className="text-2xl font-black text-[#092C59]">
              {stats.totalTestimonials !== undefined ? stats.totalTestimonials : (recentTestimonials ? recentTestimonials.length : 0)}
            </div>
            {stats.pendingTestimonials > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{stats.pendingTestimonials} Pending Approval</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>All Live on Web</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Revenue
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {formatPKR(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+16% from last week</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Upcoming Appointments (left) & Right Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (8 cols): Upcoming Appointments & Chart */}
        <div className="lg:col-span-8 space-y-7">
          
          {/* Upcoming Appointments Table matching reference image */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#092C59]">
                  Upcoming Appointments
                </h3>
                <span className="text-xs text-slate-400">
                  Real-time patient bookings scheduled in database
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/appointments')}
                className="text-xs font-bold text-[#0756A6] hover:text-[#092C59] flex items-center gap-1 transition cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Patient Name</th>
                    <th className="py-3 px-5">Doctor</th>
                    <th className="py-3 px-5">Date & Time</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {upcomingAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5 font-bold text-[#092C59]">
                        {appt.patient_name}
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {appt.doctor_name}
                      </td>
                      <td className="py-3 px-5 text-slate-500">
                        {appt.appointment_date}, {appt.appointment_time}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            appt.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : appt.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : appt.status === 'Completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setSelectedAppointment(appt)}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white font-bold text-[11px] transition cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Website Contact Inquiries & Direct Messages */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0756A6] flex items-center justify-center border border-blue-100">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#092C59] flex items-center gap-2">
                    <span>Website Inquiries & Messages</span>
                    {stats.unreadMessages > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold">
                        {stats.unreadMessages} Unread
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Direct messages sent from the public website contact form
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/messages')}
                className="text-xs font-bold text-[#0756A6] hover:text-[#092C59] flex items-center gap-1 transition cursor-pointer"
              >
                <span>View All Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(!recentMessages || recentMessages.length === 0) ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No inquiries received yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-5">Sender</th>
                      <th className="py-3 px-5">Subject</th>
                      <th className="py-3 px-5">Message</th>
                      <th className="py-3 px-5">Received At</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentMessages.map((msg) => (
                      <tr key={msg.id} className={`transition ${!msg.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70 font-medium' : 'hover:bg-slate-50/70'}`}>
                        <td className="py-3 px-5">
                          <div className="font-bold text-[#092C59]">{msg.name}</div>
                          <div className="text-[11px] text-slate-400">{msg.email}</div>
                        </td>
                        <td className="py-3 px-5 text-slate-700">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[#0756A6] font-semibold text-[11px]">
                            {msg.subject || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-600 max-w-xs truncate">
                          {msg.message}
                        </td>
                        <td className="py-3 px-5 text-slate-400 text-[11px] whitespace-nowrap">
                          {msg.created_at}
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !msg.is_read
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {!msg.is_read ? 'Unread' : 'Read'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (!msg.is_read) {
                                handleMarkMessageRead(msg.id);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-[#0756A6] text-[#0756A6] hover:text-white font-bold text-[11px] transition cursor-pointer"
                          >
                            Read
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Appointments Overview Dynamic Interactive Spline Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#092C59]">
                    Appointments Overview
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0756A6] border border-blue-200">
                    {totalApptsInPeriod} {totalApptsInPeriod === 1 ? 'Appt' : 'Appts'}
                  </span>
                  {peakAppts > 0 && (
                    <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Peak: {peakAppts}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {getTimeframeSubtitle(chartTimeframe)}
                </span>
              </div>

              {/* Interactive Timeframe Dropdown */}
              <div className="relative self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsTimeframeOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
                >
                  <span>{chartTimeframe}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isTimeframeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTimeframeOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsTimeframeOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Timeframe
                      </div>
                      {[
                        { key: 'This Week', label: 'This Week (Mon – Sun)' },
                        { key: 'Last Week', label: 'Last Week' },
                        { key: 'This Month', label: 'This Month' },
                        { key: 'Last 30 Days', label: 'Last 30 Days' },
                        { key: 'All Time', label: 'All Time (Monthly)' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setChartTimeframe(opt.key);
                            setIsTimeframeOpen(false);
                            setHoveredPoint(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            chartTimeframe === opt.key
                              ? 'bg-blue-50 text-[#0756A6] font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {chartTimeframe === opt.key && <Check className="w-3.5 h-3.5 text-[#0756A6]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SVG Interactive Spline Curve with Tooltips */}
            <div className="w-full relative overflow-visible">
              {hoveredPoint && (
                <div
                  className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 bg-[#092C59] text-white rounded-lg shadow-lg text-[11px] font-bold whitespace-nowrap transition-all duration-150"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                    marginTop: '-10px'
                  }}
                >
                  <div className="text-[10px] text-blue-200 font-medium">{hoveredPoint.fullDate}</div>
                  <div className="text-xs font-black">{hoveredPoint.count} Appointment{hoveredPoint.count === 1 ? '' : 's'}</div>
                  <div className="w-2 h-2 bg-[#092C59] transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
                </div>
              )}

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0756A6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0756A6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {/* Spline Stroke Line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0756A6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points */}
                {points.map((pt, i) => {
                  const isHovered = hoveredPoint && hoveredPoint.day === pt.day && hoveredPoint.date === pt.date;
                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setHoveredPoint(pt)}
                    >
                      {/* Invisible larger hover hit area */}
                      <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                      {/* Active glow on hover */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="8"
                          className="fill-blue-400/30 animate-ping"
                        />
                      )}

                      {/* Point circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        className={`fill-white stroke-[#0756A6] transition-all duration-150 ${
                          isHovered ? 'stroke-[3]' : 'stroke-2'
                        }`}
                      />

                      {/* Day / Date label */}
                      <text
                        x={pt.x}
                        y={chartHeight - 2}
                        textAnchor="middle"
                        className={`text-[10px] font-medium transition-colors ${
                          isHovered ? 'fill-[#0756A6] font-bold' : 'fill-slate-400'
                        }`}
                      >
                        {pt.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Quick Actions & Recent Patients */}
        <div className="lg:col-span-4 space-y-7">
          
          {/* Quick Actions Card matching reference image */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            
            <button
              onClick={() => navigate('/admin/appointments?action=new')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#092C59] hover:bg-[#0756A6] text-white text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4 text-blue-200" />
              <span>Add Appointment</span>
            </button>

            <button
              onClick={() => navigate('/admin/patients?action=new')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0756A6] hover:bg-[#092C59] text-white text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-blue-200" />
              <span>Add Patient</span>
            </button>

            <button
              onClick={() => navigate('/admin/doctors?action=new')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#092C59] hover:bg-[#0756A6] text-white text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-xs"
            >
              <Stethoscope className="w-4 h-4 text-blue-200" />
              <span>Add Doctor</span>
            </button>

            <button
              onClick={() => navigate('/admin/services')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0756A6] hover:bg-[#092C59] text-white text-xs font-bold transition flex items-center gap-2.5 cursor-pointer shadow-xs"
            >
              <Grid className="w-4 h-4 text-blue-200" />
              <span>Manage Services</span>
            </button>

            <button
              onClick={() => navigate('/admin/messages')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-[#0756A6] text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-200" />
                <span>Website Inquiries</span>
              </div>
              {stats.unreadMessages > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                  {stats.unreadMessages} New
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/consultations')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0756A6] hover:bg-[#092C59] text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-blue-200" />
                <span>Consultations</span>
              </div>
              {stats.pendingConsultations > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold">
                  {stats.pendingConsultations} Pending
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/testimonials')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-100 fill-amber-100" />
                <span>Patient Reviews</span>
              </div>
              {stats.pendingTestimonials > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-amber-700 text-[10px] font-extrabold animate-pulse">
                  {stats.pendingTestimonials} Pending
                </span>
              )}
            </button>
          </div>

          {/* Recent Patients Card matching reference image */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider">
                Recent Patients
              </h3>
              <button
                onClick={() => navigate('/admin/patients')}
                className="text-[11px] font-bold text-[#0756A6] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3.5">
              {recentPatients.map((patient, idx) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/admin/patients`)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?auto=format&fit=crop&w=100&q=80`}
                    alt={patient.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#092C59] truncate">
                      {patient.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {patient.appointment_time ? `${patient.appointment_time} • ${patient.doctor_name || 'Dr. Ayesha'}` : patient.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Patient Reviews Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider">
                  Patient Reviews
                </h3>
              </div>
              <button
                onClick={() => navigate('/admin/testimonials')}
                className="text-[11px] font-bold text-[#0756A6] hover:underline cursor-pointer"
              >
                View All ({stats.totalTestimonials !== undefined ? stats.totalTestimonials : (recentTestimonials ? recentTestimonials.length : 0)}) →
              </button>
            </div>

            {(!recentTestimonials || recentTestimonials.length === 0) ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No patient reviews submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTestimonials.slice(0, 4).map((review) => (
                  <div
                    key={review.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#092C59] truncate">
                        {review.patient_name || review.name || 'Patient'}
                      </span>
                      <div className="flex items-center text-amber-400 text-[11px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < (review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.treatment && (
                      <span className="inline-block text-[10px] font-semibold text-[#0756A6] bg-blue-50 px-2 py-0.5 rounded-md">
                        {review.treatment}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                      "{review.review_text || review.comment || review.content}"
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        review.is_approved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {review.is_approved ? '✓ Live on Web' : '⏳ Awaiting Approval'}
                      </span>
                      {!review.is_approved ? (
                        <button
                          onClick={() => handleToggleApproveReview(review.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
                        >
                          ✓ Approve Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleApproveReview(review.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Appointment Detail & Status Updater Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-[#0756A6] uppercase tracking-wider">
                  Appointment Details
                </span>
                <h3 className="text-xl font-black text-[#092C59]">
                  {selectedAppointment.appointment_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-[#092C59]">{selectedAppointment.patient_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Assigned Doctor:</span>
                <span className="font-bold text-[#092C59]">{selectedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-[#092C59]">{selectedAppointment.service_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Scheduled Date & Time:</span>
                <span className="font-bold text-[#0756A6]">
                  {selectedAppointment.appointment_date} at {selectedAppointment.appointment_time}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Billing Fee:</span>
                <span className="font-bold text-emerald-700">PKR {Number(selectedAppointment.fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            {/* Quick Status Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-1">Update Status:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'Confirmed')}
                  className="py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'Completed')}
                  className="py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                >
                  Complete
                </button>
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'Cancelled')}
                  className="py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  navigate('/admin/appointments');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition"
              >
                Go to Appointments Manager
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Contact Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-blue-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0756A6] flex items-center justify-center border border-blue-100">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#092C59]">
                  {selectedMessage.subject || 'Website Inquiry'}
                </h3>
                <span className="text-xs text-slate-400">Received on {selectedMessage.created_at}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Sender:</span>
                <span className="font-bold text-[#092C59]">{selectedMessage.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <a href={`mailto:${selectedMessage.email}`} className="font-bold text-[#0756A6] hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <a href={`tel:${selectedMessage.phone}`} className="font-bold text-[#0756A6] hover:underline">
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content:
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {selectedMessage.message}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  navigate('/admin/messages');
                }}
                className="text-xs font-bold text-[#0756A6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Messages Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Reply to inquiry: ${selectedMessage.subject || 'Dental Care'}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#092C59] hover:bg-[#0756A6] text-white transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

