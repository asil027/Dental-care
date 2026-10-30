const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

async function testNewFeatures() {
  console.log('--- Testing New Dental Care Features ---');
  const BASE = 'http://localhost:5000/api';

  // 1. Admin login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login must succeed');
  const { token } = await loginRes.json();
  console.log('✓ Admin Login passed');

  // 2. Submit new message from website contact form
  const newMsgRes = await fetch(`${BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Test Patient',
      email: 'testpatient@example.com',
      phone: '+92 321 9998877',
      subject: 'Teeth Alignment Query',
      message: 'Hello, what are your aligner charges?'
    })
  });
  assert.strictEqual(newMsgRes.status, 201, 'Message submission must succeed');
  const newMsgData = await newMsgRes.json();
  const createdMsgId = newMsgData.messageRecord.id;
  console.log(`✓ Public Contact Message submitted (ID: ${createdMsgId})`);

  // 3. Admin fetches messages
  const adminMsgsRes = await fetch(`${BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(adminMsgsRes.status, 200);
  const { messages } = await adminMsgsRes.json();
  assert.ok(messages.length >= 3, 'Must have at least 3 messages (including shanza)');
  const foundMsg = messages.find((m) => m.id === createdMsgId);
  assert.ok(foundMsg, 'Created message must appear in admin list');
  assert.strictEqual(foundMsg.is_read, 0, 'New message must be unread');
  console.log(`✓ Admin Messages fetched successfully (${messages.length} total messages)`);

  // 4. Admin marks message as read
  const markReadRes = await fetch(`${BASE}/messages/${createdMsgId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(markReadRes.status, 200);
  console.log('✓ Message marked as read');

  // 5. Check stats overview includes unreadMessages and recentMessages
  const statsRes = await fetch(`${BASE}/stats/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  assert.ok(statsData.stats.totalMessages !== undefined, 'Stats must include totalMessages');
  assert.ok(statsData.recentMessages && statsData.recentMessages.length > 0, 'Stats must include recentMessages array');
  console.log(`✓ Stats overview includes ${statsData.stats.totalMessages} total messages, ${statsData.stats.unreadMessages} unread`);

  // 6. Public Client writes a review
  const testReviewName = 'Bilal Tariq Review ' + Date.now();
  const submitReviewRes = await fetch(`${BASE}/testimonials/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_name: testReviewName,
      rating: 5,
      treatment: 'Dental Implants',
      review_text: 'Top notch clinic experience, very gentle care.'
    })
  });
  assert.strictEqual(submitReviewRes.status, 201, 'Review submission must return 201');
  const reviewResult = await submitReviewRes.json();
  const createdReviewId = reviewResult.testimonial.id;
  assert.strictEqual(reviewResult.testimonial.is_approved, 0, 'Review must be unapproved / pending');
  console.log(`✓ Public Review submitted with is_approved=0 (ID: ${createdReviewId})`);

  // 7. Verify public testimonials does NOT show unapproved review
  const publicReviewsRes = await fetch(`${BASE}/testimonials`);
  const publicReviews = (await publicReviewsRes.json()).testimonials;
  const isPubliclyVisibleBefore = publicReviews.some((r) => r.id === createdReviewId);
  assert.strictEqual(isPubliclyVisibleBefore, false, 'Unapproved review must NOT be visible on public site');
  console.log('✓ Public testimonials correctly excludes pending review');

  // 8. Admin reviews and approves it
  const toggleApproveRes = await fetch(`${BASE}/testimonials/${createdReviewId}/toggle-approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(toggleApproveRes.status, 200);
  const toggleData = await toggleApproveRes.json();
  assert.strictEqual(toggleData.is_approved, 1, 'Review must now be approved');
  console.log('✓ Admin successfully approved review');

  // 9. Now verify public testimonials DOES show the approved review!
  const publicReviewsAfterRes = await fetch(`${BASE}/testimonials`);
  const publicReviewsAfter = (await publicReviewsAfterRes.json()).testimonials;
  const isPubliclyVisibleAfter = publicReviewsAfter.some((r) => r.id === createdReviewId);
  assert.strictEqual(isPubliclyVisibleAfter, true, 'Approved review MUST now be visible on public homepage!');
  console.log(`✓ Approved review is now live on the public website!`);

  // 10. Verify FAQ banner removal in built dist
  const distJsFiles = fs.readdirSync(path.join(__dirname, '..', 'dist', 'assets')).filter(f => f.endsWith('.js'));
  let foundFaqBannerInBuild = false;
  for (const jsFile of distJsFiles) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'dist', 'assets', jsFile), 'utf8');
    if (code.includes('Have a specific question not answered here?')) {
      foundFaqBannerInBuild = true;
    }
  }
  assert.strictEqual(foundFaqBannerInBuild, false, 'FAQ banner must be completely removed from production build');
  console.log('✓ Verified: "Have a specific question not answered here?" is completely removed from website bundle');

  console.log('\n======================================================');
  console.log('ALL NEW FEATURES TESTED AND VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
}

testNewFeatures().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

