import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { DAYS_OF_WEEK, parseOffDays, generateTimeSlots } from '../utils/time';

export default function SettingsManager({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected off days array, e.g. ['Sunday'] or ['Friday', 'Sunday']
  const [selectedOffDays, setSelectedOffDays] = useState(['Sunday']);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/settings');
      const loaded = res.settings || {};
      setSettings(loaded);
      try {
        localStorage.setItem('dental_clinic_settings', JSON.stringify(loaded));
      } catch (e) {}

      // Parse off days
      const offList = parseOffDays(loaded.weekly_holiday || 'Sunday');
      setSelectedOffDays(offList);
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  const handleChange = (e) => {
    setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e) => {
    const newAddress = e.target.value;
    setSettings((prev) => {
      const mapUrl = prev.latitude && prev.longitude
        ? `https://maps.google.com/maps?q=${prev.latitude},${prev.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(newAddress.trim())}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return {
        ...prev,
        address: newAddress,
        google_maps_url: mapUrl
      };
    });
  };

  const handleCoordinateChange = (field, val) => {
    setSettings((prev) => {
      const nextLat = field === 'latitude' ? val : prev.latitude;
      const nextLng = field === 'longitude' ? val : prev.longitude;
      const hasCoords = nextLat && nextLng && !isNaN(Number(nextLat)) && !isNaN(Number(nextLng));
      const mapUrl = hasCoords
        ? `https://maps.google.com/maps?q=${String(nextLat).trim()},${String(nextLng).trim()}&t=&z=16&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(prev.address || '')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return {
        ...prev,
        [field]: val,
        google_maps_url: mapUrl
      };
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

        setSettings((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          google_maps_url: mapUrl
        }));

        setDetectingGps(false);
        setGpsMessage(`✓ GPS Detected: Latitude ${lat}, Longitude ${lng}`);
        setTimeout(() => setGpsMessage(''), 8000);
      },
      (error) => {
        setDetectingGps(false);
        alert(`Could not detect GPS location: ${error.message}. You can manually type your Latitude and Longitude.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Toggle day off/on
  const toggleDayOff = (dayName) => {
    let next;
    if (selectedOffDays.map((d) => d.toLowerCase()).includes(dayName.toLowerCase())) {
      // Remove it from off days -> becomes working day
      next = selectedOffDays.filter((d) => d.toLowerCase() !== dayName.toLowerCase());
    } else {
      // Add it to off days -> becomes closed
      next = [...selectedOffDays, dayName];
    }

    if (next.length === 0) {
      next = ['None'];
    } else {
      next = next.filter((d) => d.toLowerCase() !== 'none');
    }

    setSelectedOffDays(next);

    const offDaysStr = next.join(',');
    const workingDaysList = DAYS_OF_WEEK.filter(
      (d) => !next.map((n) => n.toLowerCase()).includes(d.toLowerCase())
    );

    setSettings((prev) => ({
      ...prev,
      weekly_holiday: offDaysStr,
      operating_days: workingDaysList.join(','),
      working_hours_sunday: next.map((d) => d.toLowerCase()).includes('sunday') ? 'Closed' : (prev.operating_start_time || '11:00 AM') + ' – ' + (prev.operating_end_time || '12:00 AM')
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      // Ensure weekly_holiday and operating_days are synced
      const offDaysStr = selectedOffDays.join(',') || 'Sunday';
      const workingDaysList = DAYS_OF_WEEK.filter(
        (d) => !selectedOffDays.map((n) => n.toLowerCase()).includes(d.toLowerCase())
      );

      // Ensure Google Maps URL automatically matches coordinates or address
      const addr = (settings.address || '').trim();
      const lat = (settings.latitude ? String(settings.latitude) : '').trim();
      const lng = (settings.longitude ? String(settings.longitude) : '').trim();

      let mapUrl;
      if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      } else {
        mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }

      const payload = {
        ...settings,
        latitude: lat,
        longitude: lng,
        google_maps_url: mapUrl,
        weekly_holiday: offDaysStr,
        operating_days: workingDaysList.join(',')
      };

      const res = await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setSettings(res.settings);
      try {
        localStorage.setItem('dental_clinic_settings', JSON.stringify(res.settings));
      } catch (e) {}
      setSaveSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated(res.settings);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Save failed');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0756A6] mb-2" />
        <span className="text-xs">Loading clinic settings...</span>
      </div>
    );
  }

  const startTime = settings.operating_start_time || '11:00 AM';
  const endTime = settings.operating_end_time || '12:00 AM';
  const slotDur = settings.slot_duration || 30;
  const sampleSlots = generateTimeSlots(startTime, endTime, slotDur);

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#092C59] tracking-tight">
            Clinic Settings & Working Hours
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your clinic address, select off days freely, and set your own opening/closing timings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">
            Clinic location and operating schedule updated successfully! All changes are live on the homepage immediately.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Physical Location & Map (Immediate sync to homepage) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0756A6]" />
                <span>Physical Clinic Address & Google Maps</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Directly displayed on the homepage hero hours card, contact section, and footer.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Auto-Synced
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Physical Address */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Physical Clinic Address *
              </label>
              <input
                type="text"
                required
                name="address"
                placeholder="e.g. dental care ,street 15 ,saifabad no 1,punjab, Pakistan"
                value={settings.address || ''}
                onChange={handleAddressChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0756A6] focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your street address, clinic name, area, and city. Displayed on public website headers, contact section, and footer.
              </p>
            </div>

            {/* Exact Clinic GPS Coordinates (Latitude & Longitude) */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-[#092C59] block">
                    Exact Clinic Location Coordinates (Latitude & Longitude)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Google Maps automatically locks onto these exact coordinates for your clinic location.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0756A6] hover:bg-[#092C59] transition shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {detectingGps ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-200" />
                      <span>Detecting GPS Location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-blue-200" />
                      <span>Detect Current Location (GPS)</span>
                    </>
                  )}
                </button>
              </div>

              {gpsMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gpsMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    placeholder="e.g. 31.4330"
                    value={settings.latitude || ''}
                    onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0756A6] transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    placeholder="e.g. 73.0650"
                    value={settings.longitude || ''}
                    onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0756A6] transition"
                  />
                </div>
              </div>
            </div>

            {/* Live Google Maps Location Preview Card */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#092C59] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0756A6]" />
                  <span>Live Google Maps Preview for this Location:</span>
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  {settings.latitude && settings.longitude ? '✓ Centered on Exact Coordinates' : '✓ Centered on Address'}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-64 w-full bg-slate-100">
                <iframe
                  key={`${settings.latitude}-${settings.longitude}-${settings.address}`}
                  title="Admin Google Map Preview"
                  src={
                    settings.latitude && settings.longitude
                      ? `https://maps.google.com/maps?q=${settings.latitude},${settings.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(settings.address || 'dental care ,street 15 ,saifabad no 1,punjab, Pakistan')}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Current Address Summary */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#0756A6] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#092C59] block">Public Website Clinic Address:</span>
                <span className="text-slate-700 font-medium block">
                  {settings.address || 'No address specified'}
                </span>
                {(settings.latitude && settings.longitude) && (
                  <span className="text-[11px] text-[#0756A6] font-mono mt-0.5 block">
                    📍 Exact Map Coordinates: {settings.latitude}, {settings.longitude}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dynamic Off-Day Selection (Sunday is NOT fixed!) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0756A6]" />
              <span>Select Clinic Off Days (Not Fixed to Sunday!)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any day to toggle it between a <strong>Working Day</strong> and a <strong>Closed Off Day</strong>. You can close on Friday, Sunday, or any day you choose!
            </p>
          </div>

          {/* 7 Days of the week interactive pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {DAYS_OF_WEEK.map((day) => {
              const isOff = selectedOffDays
                .map((d) => d.toLowerCase())
                .includes(day.toLowerCase());
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDayOff(day)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isOff
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  }`}
                >
                  <span className="text-xs font-black">{day}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOff ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isOff ? (
                      <>
                        <X className="w-3 h-3" />
                        <span>CLOSED</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>OPEN</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Configured Weekly Off Day(s):</span>
              <span className="font-bold text-rose-700">
                {selectedOffDays.join(', ') || 'None (Open All 7 Days)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active Working Days:</span>
              <span className="font-bold text-emerald-700">
                {DAYS_OF_WEEK.filter(
                  (d) => !selectedOffDays.map((n) => n.toLowerCase()).includes(d.toLowerCase())
                ).join(', ') || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Opening & Closing Times & Slot Generation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0756A6]" />
              <span>Opening & Closing Times & Slot Generation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change opening time, closing time, and appointment duration whenever you want.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Daily Opening Time *
              </label>
              <select
                name="operating_start_time"
                value={settings.operating_start_time || '11:00 AM'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer"
              >
                {[
                  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
                  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                  '12:00 PM', '01:00 PM', '02:00 PM'
                ].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Daily Closing Time *
              </label>
              <select
                name="operating_end_time"
                value={settings.operating_end_time || '12:00 AM'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer"
              >
                {[
                  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
                  '09:00 PM', '10:00 PM', '11:00 PM', '11:30 PM',
                  '12:00 AM', '01:00 AM'
                ].map((t) => (
                  <option key={t} value={t}>
                    {t === '12:00 AM' ? '12:00 AM (Midnight)' : t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slot Duration (minutes) *
              </label>
              <select
                name="slot_duration"
                value={settings.slot_duration || '30'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer"
              >
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          {/* Slot preview */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
            <span className="font-bold text-[#092C59] block mb-1">
              Generated Booking Time Slots ({sampleSlots.length} slots):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {sampleSlots.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-medium text-[11px] border border-blue-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Display Text Customization for Homepage */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#092C59] uppercase tracking-wider">
              Homepage Display Labels
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize how the opening days and hours are written on the homepage header and hero cards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Working Days Hours Label
              </label>
              <input
                type="text"
                name="working_hours_weekday"
                placeholder="e.g. 11:00 AM – 12:00 AM"
                value={settings.working_hours_weekday || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Weekend / Saturday Hours Label
              </label>
              <input
                type="text"
                name="working_hours_saturday"
                placeholder="e.g. 11:00 AM – 12:00 AM"
                value={settings.working_hours_saturday || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Weekly Off Days Label (Shown in Red on Hero Card)
              </label>
              <input
                type="text"
                name="working_hours_sunday"
                placeholder="e.g. Closed: Sunday or Closed: Friday"
                value={settings.working_hours_sunday || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinic Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#092C59] hover:bg-[#0756A6] shadow-md transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Clinic Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
