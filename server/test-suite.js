const assert = require('node:assert');

async function runTests() {
  console.log('--- Starting Dental Care Clinic Automated Test Suite ---');

  // Start Express server in-process
  process.env.PORT = '5056';
  require('./index');

  // Wait 1 sec for server to listen
  await new Promise((r) => setTimeout(r, 1000));
  const BASE = 'http://localhost:5056/api';

  // Test 1: Health check
  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok', 'Health check must be ok');
  console.log('✓ Health check passed');

  const docsList = await (await fetch(`${BASE}/doctors`)).json();
  const servsList = await (await fetch(`${BASE}/services`)).json();
  const testDocId = docsList.doctors[0].id;
  const testServId = servsList.services[0].id;

  // Test 2: Admin Login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login must succeed');
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✓ Admin Login passed');

  // Test 3: Update Clinic Location to user address
  const customAddress = 'dental care ,street 15 ,saifabad no 1,punjab, Pakistan';
  const updateSettingsRes = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      address: customAddress,
      weekly_holiday: 'Friday', // Custom off day selected by admin!
      operating_start_time: '11:00 AM',
      operating_end_time: '12:00 AM'
    })
  });
  assert.strictEqual(updateSettingsRes.status, 200, 'Settings update must succeed');
  const updatedSettingsData = await updateSettingsRes.json();
  assert.strictEqual(updatedSettingsData.settings.address, customAddress, 'Address must update');
  assert.strictEqual(updatedSettingsData.settings.weekly_holiday, 'Friday', 'Weekly off day must update to Friday');
  console.log('✓ Dynamic Location & Custom Off-Day Settings update passed');

  // Test 4: Verify Public Settings API returns updated address immediately
  const pubSettingsRes = await fetch(`${BASE}/settings`);
  const pubSettings = await pubSettingsRes.json();
  assert.strictEqual(pubSettings.settings.address, customAddress, 'Public API must reflect updated address');
  assert.strictEqual(pubSettings.settings.weekly_holiday, 'Friday', 'Public API must reflect custom off-day');
  console.log('✓ Public Homepage Settings reflect updated address & off days');

  // Test 5: Verify Friday (2026-11-06) is now closed since admin chose Friday as off-day!
  const fridayAvailRes = await fetch(`${BASE}/appointments/check-availability?doctor_id=${testDocId}&date=2026-11-06`);
  const fridayAvail = await fridayAvailRes.json();
  assert.strictEqual(fridayAvail.isClosed, true, 'Friday must now be closed');
  assert.ok(fridayAvail.message.includes('Friday'), 'Message must indicate Friday is off day');
  console.log('✓ Custom Friday Off-Day enforcement passed');

  // Test 6: Verify Sunday (2026-11-01) is now OPEN because Sunday is no longer an off day!
  const sundayAvailRes = await fetch(`${BASE}/appointments/check-availability?doctor_id=${testDocId}&date=2026-11-01`);
  const sundayAvail = await sundayAvailRes.json();
  assert.strictEqual(sundayAvail.isClosed, false, 'Sunday must now be open since Friday is the off-day');
  assert.ok(sundayAvail.availableSlots.length > 0, 'Sunday must have available slots');
  console.log('✓ Dynamic Sunday Open (Sunday is NOT fixed off) passed');

  // Test 7: Booking on Friday must be rejected
  const fridayBookingRes = await fetch(`${BASE}/appointments/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_name: 'Friday Patient',
      patient_email: 'friday@example.com',
      patient_phone: '+92 300 1112233',
      doctor_id: testDocId,
      service_id: testServId,
      appointment_date: '2026-11-06', // Friday (Off day)
      appointment_time: '11:30 AM',
      notes: 'Testing Friday off day'
    })
  });
  assert.strictEqual(fridayBookingRes.status, 400, 'Friday booking must be rejected');
  const fridayErr = await fridayBookingRes.json();
  assert.ok(fridayErr.error.includes('closed on Fridays'), 'Error must mention clinic closed on Fridays');
  console.log('✓ Dynamic Off-Day Booking Rejection passed');

  // Test 8: Booking on Sunday (2026-11-01) must succeed now that Sunday is an open working day!
  const db = require('./db');
  db.prepare("DELETE FROM appointments WHERE patient_email = 'sunday@example.com'").run();

  const sundayBookingRes = await fetch(`${BASE}/appointments/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_name: 'Sunday Patient',
      patient_email: 'sunday@example.com',
      patient_phone: '+92 300 4445566',
      doctor_id: testDocId,
      service_id: testServId,
      appointment_date: '2026-11-01', // Sunday (now working day)
      appointment_time: '11:30 AM',
      notes: 'Testing Sunday booking'
    })
  });
  assert.strictEqual(sundayBookingRes.status, 201, 'Sunday booking must succeed');
  const sundayBooked = await sundayBookingRes.json();
  assert.ok(sundayBooked.appointment.appointment_code.startsWith('DC-2026-'), 'Appointment code generated');
  console.log(`✓ Sunday Booking succeeded when Sunday is active working day (Code: ${sundayBooked.appointment.appointment_code})`);

  // Test 9: Changing operating hours to 09:00 AM - 05:00 PM
  await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      operating_start_time: '09:00 AM',
      operating_end_time: '05:00 PM',
      slot_duration: '60'
    })
  });

  const slotsRes = await fetch(`${BASE}/appointments/check-availability?doctor_id=${testDocId}&date=2026-11-02`);
  const slotsData = await slotsRes.json();
  assert.ok(slotsData.allSlots.includes('09:00 AM'), 'Must include 09:00 AM slot');
  assert.ok(slotsData.allSlots.includes('04:00 PM'), 'Must include 04:00 PM slot');
  assert.ok(!slotsData.allSlots.includes('09:00 PM'), 'Must NOT include 09:00 PM slot');
  console.log(`✓ Dynamic Working Hours & Slot generation passed (${slotsData.allSlots.length} slots generated for 09:00 AM - 05:00 PM)`);

  console.log('========================================================');
  console.log('ALL DYNAMIC LOCATION & FLEXIBLE OFF-DAY TESTS PASSED!   ');
  console.log('========================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
