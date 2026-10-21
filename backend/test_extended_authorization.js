// test_extended_authorization.js
// End-to-end authentication, authorization, and validation test suite.

const RESOURCE_URL = 'http://localhost:3001';
const TIMETABLE_URL = 'http://localhost:3002';
const BOOKING_URL = 'http://localhost:3003';
const NOTIFICATION_URL = 'http://localhost:3004';

async function runTests() {
  console.log('==================================================');
  console.log('STARTING DISTRIBOOK E2E AUTHORIZATION & FLOW TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assertEqual(actual, expected, message) {
    if (actual === expected) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message} | Expected: ${expected}, Got: ${actual}`);
      failed++;
    }
  }

  // TEST 1: Missing X-User-Email header
  try {
    const res = await fetch(`${RESOURCE_URL}/resources`);
    assertEqual(res.status, 401, 'Request without email header should return 401');
    const data = await res.json();
    assertEqual(data.error, 'Unauthorized. Missing X-User-Email header.', 'Error message should match for missing header');
  } catch (err) {
    console.error('Test 1 failed with error:', err);
    failed++;
  }

  // TEST 2: Unknown email identity
  try {
    const res = await fetch(`${RESOURCE_URL}/resources`, {
      headers: { 'X-User-Email': 'hackers@demo.com' }
    });
    assertEqual(res.status, 401, 'Request with invalid email identity should return 401');
    const data = await res.json();
    assertEqual(data.error, 'Unauthorized. Unknown user identity.', 'Error message should match for unknown user');
  } catch (err) {
    console.error('Test 2 failed with error:', err);
    failed++;
  }

  // TEST 3: Admin role permissions (creating resource)
  try {
    const testResourceId = 'TEST-ROOM-' + Date.now();
    const res = await fetch(`${RESOURCE_URL}/resources`, {
      method: 'POST',
      headers: {
        'X-User-Email': 'admin@demo.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: testResourceId,
        name: 'Admin Test Room',
        type: 'Classroom',
        building: 'Main Building',
        floor: 2,
        department: 'Common',
        capacity: 40,
        facilities: ['Projector'],
        status: 'active',
        requiresApproval: false
      })
    });
    assertEqual(res.status, 201, 'Admin should be authorized to create resources');
  } catch (err) {
    console.error('Test 3 failed with error:', err);
    failed++;
  }

  // TEST 4: Student role restriction (cannot create resource)
  try {
    const res = await fetch(`${RESOURCE_URL}/resources`, {
      method: 'POST',
      headers: {
        'X-User-Email': 'student@demo.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'FORBIDDEN-ROOM',
        name: 'Hacker Room',
        type: 'Classroom'
      })
    });
    assertEqual(res.status, 403, 'Student should be forbidden from creating resources');
  } catch (err) {
    console.error('Test 4 failed with error:', err);
    failed++;
  }

  // TEST 5: Student booking overlap validation
  try {
    // 5.1: Create a valid booking
    const date = '2026-09-' + String(Math.floor(Math.random() * 20) + 10);
    const res1 = await fetch(`${BOOKING_URL}/bookings`, {
      method: 'POST',
      headers: {
        'X-User-Email': 'student@demo.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resourceId: 'COMP-LAB-203',
        date,
<<<<<<< HEAD
        startTime: '16:00',
        endTime: '18:00',
=======
        startTime: '10:00',
        endTime: '12:00',
>>>>>>> origin/main
        purpose: 'E2E Testing Slot 1'
      })
    });
    assertEqual(res1.status, 201, 'Student should be able to book active resources');
    const booking = await res1.json();

    // 5.2: Attempt booking during same time (should fail due to conflict)
    const res2 = await fetch(`${BOOKING_URL}/bookings`, {
      method: 'POST',
      headers: {
        'X-User-Email': 'student2@demo.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resourceId: 'COMP-LAB-203',
        date,
<<<<<<< HEAD
        startTime: '17:00',
        endTime: '19:00',
=======
        startTime: '11:00',
        endTime: '13:00',
>>>>>>> origin/main
        purpose: 'E2E Conflicting Slot'
      })
    });
    assertEqual(res2.status, 409, 'Overlapping booking request should return 409 conflict');
    const conflictData = await res2.json();
    console.log('Conflict error received:', conflictData.error);
  } catch (err) {
    console.error('Test 5 failed with error:', err);
    failed++;
  }

  // TEST 6: Timetable class overlap restriction
  try {
    // Timetable has pre-seeded COMP-LAB-203 on MONDAY 10:00-11:00 (Data Structures)
    // 2026-08-31 is a MONDAY
    const res = await fetch(`${BOOKING_URL}/bookings`, {
      method: 'POST',
      headers: {
        'X-User-Email': 'student@demo.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resourceId: 'COMP-LAB-203',
        date: '2026-08-31',
        startTime: '10:30',
        endTime: '11:30',
        purpose: 'Try booking during lecture time'
      })
    });
    assertEqual(res.status, 409, 'Booking during pre-seeded timetable lectures should be rejected with 409 conflict');
    const data = await res.json();
    console.log('Timetable conflict error received:', data.error);
  } catch (err) {
    console.error('Test 6 failed with error:', err);
    failed++;
  }

  // TEST 7: Notifications delivery check
  try {
    const res = await fetch(`${NOTIFICATION_URL}/notifications/user/student@demo.com`, {
      headers: { 'X-User-Email': 'student@demo.com' }
    });
    assertEqual(res.status, 200, 'Student should be able to fetch their notifications');
    const notifs = await res.json();
    console.log(`Received ${notifs.length} notifications for student@demo.com`);
    assertEqual(notifs.length > 0, true, 'At least one notification should have been saved');
  } catch (err) {
    console.error('Test 7 failed with error:', err);
    failed++;
  }

  console.log('\n==================================================');
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runTests();
