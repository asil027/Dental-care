// Asia/Karachi (Pakistan Standard Time, UTC+5) helpers

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export function getTodayDateKarachi() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now);
}

export function getDayName(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAYS_OF_WEEK[d.getDay()] || '';
}

export function parseOffDays(offDaysStr) {
  if (!offDaysStr) return ['Sunday'];
  if (Array.isArray(offDaysStr)) return offDaysStr;
  return offDaysStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isDateOff(dateString, offDaysConfig) {
  if (!dateString) return false;
  const offDays = parseOffDays(offDaysConfig).map((d) => d.toLowerCase());
  if (offDays.includes('none')) return false;
  const dayName = getDayName(dateString).toLowerCase();
  return offDays.includes(dayName);
}

export function isSunday(dateString) {
  return isDateOff(dateString, 'Sunday');
}

export function getNextAvailableWorkingDate(offDaysConfig, startDateStr) {
  let dateStr = startDateStr || getTodayDateKarachi();
  for (let i = 0; i < 14; i++) {
    if (!isDateOff(dateStr, offDaysConfig)) {
      return dateStr;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    // Use UTC date addition to avoid timezone drift
    const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
    const year = nextDate.getUTCFullYear();
    const month = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getUTCDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  return dateStr;
}

export function getHeroScheduleLines(settings) {
  const offDays = parseOffDays(settings?.weekly_holiday).map((d) => d.toLowerCase());
  const hours = `${settings?.operating_start_time || '11:00 AM'} – ${settings?.operating_end_time || '12:00 AM'}`;

  if (offDays.includes('none')) {
    return [
      { label: 'Monday – Sunday:', time: hours, isOff: false },
      { label: 'Working Status:', time: 'Open 7 Days a Week', isOff: false },
      { label: 'Closed / Off Day(s):', time: 'None (Open Daily)', isOff: true }
    ];
  }

  if (offDays.includes('friday') && offDays.includes('sunday')) {
    return [
      { label: 'Monday – Thursday:', time: hours, isOff: false },
      { label: 'Saturday:', time: hours, isOff: false },
      { label: 'Closed / Off Day(s):', time: 'FRIDAY, SUNDAY', isOff: true }
    ];
  }

  if (offDays.includes('friday')) {
    return [
      { label: 'Monday – Thursday:', time: hours, isOff: false },
      { label: 'Saturday – Sunday:', time: hours, isOff: false },
      { label: 'Closed / Off Day(s):', time: 'FRIDAY', isOff: true }
    ];
  }

  if (offDays.includes('sunday')) {
    return [
      { label: 'Monday – Friday:', time: hours, isOff: false },
      { label: 'Saturday:', time: hours, isOff: false },
      { label: 'Closed / Off Day(s):', time: 'SUNDAY', isOff: true }
    ];
  }

  const offDayName = parseOffDays(settings?.weekly_holiday).join(', ');
  return [
    { label: 'Operating Days:', time: `Open except ${offDayName}`, isOff: false },
    { label: 'Operating Hours:', time: hours, isOff: false },
    { label: 'Closed / Off Day(s):', time: offDayName.toUpperCase(), isOff: true }
  ];
}

export function formatPKR(amount) {
  if (amount === undefined || amount === null) return 'PKR 0';
  return 'PKR ' + Number(amount).toLocaleString('en-US');
}

export function parseTimeToMinutes(t) {
  if (!t) return null;
  const m = t.trim().match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

export function formatMinutesToTime(mins) {
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const mer = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return (h12 < 10 ? '0' + h12 : h12) + ':' + (m < 10 ? '0' + m : m) + ' ' + mer;
}

export function generateTimeSlots(startStr = '11:00 AM', endStr = '12:00 AM', duration = 30) {
  let start = parseTimeToMinutes(startStr) ?? 11 * 60;
  let end = parseTimeToMinutes(endStr) ?? 24 * 60;
  if (end === 0) end = 24 * 60;
  if (end <= start) end += 24 * 60; // overnight until midnight or past

  const slots = [];
  const dur = parseInt(duration, 10) || 30;
  for (let t = start; t < end; t += dur) {
    slots.push(formatMinutesToTime(t));
  }
  return slots;
}

export const CLINIC_TIME_SLOTS = generateTimeSlots('11:00 AM', '12:00 AM', 30);
