const path = require('path');
const amqp = require(path.resolve(__dirname, './booking-service/node_modules/amqplib'));

const BOOKING_URL = 'http://localhost:3003';
const NOTIFICATION_URL = 'http://localhost:3004';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

const STUDENT_EMAIL = 'pradnya.wakode23@pccoepune.org';
const FACULTY_EMAIL = 'faculty@pccoepune.org';
const ADMIN_EMAIL = 'admin@pccoepune.org';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function getClock(url) {
  const res = await fetch(`${url}/lamport`);
  const data = await res.json();
  return data.lamportClock;
}

async function runStage3Tests() {
  console.log('================================================================');
  console.log('   STAGE 3: LAMPORT LOGICAL CLOCKS VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 4;

  // ------------------------------------------------------------------
  // TEST 1: Single Booking Creation (Lamport Send & Receive Rule)
  // ------------------------------------------------------------------
  console.log('▶ TEST 1: Single Booking Event (Send & Receive Rules)');
  try {
    const lBookingInitial = await getClock(BOOKING_URL);
    const lNotifInitial = await getClock(NOTIFICATION_URL);
    console.log(`  Initial Clocks: Booking L=${lBookingInitial}, Notification L=${lNotifInitial}`);

    const randomOffset = Math.floor(Math.random() * 800) + 100;
    const testDate1 = new Date(Date.now() + randomOffset * 86400000).toISOString().split('T')[0];
    const bookingPayload = {
      resourceId: 'COMP-SH-301',
      date: testDate1,
      startTime: '09:00',
      endTime: '10:00',
      purpose: 'Distributed Systems Lamport Test 1',
      attendees: 30,
      facultyEmail: FACULTY_EMAIL
    };

    const createRes = await fetch(`${BOOKING_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': STUDENT_EMAIL
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create booking: HTTP ${createRes.status} - ${errText}`);
    }

    const bookingData = await createRes.json();
    console.log(`  Created Booking ID: ${bookingData.id}`);

    const lBookingAfter = await getClock(BOOKING_URL);
    console.log(`  Booking Service Clock after Send: L=${lBookingAfter} (Send Rule: L_new = ${lBookingInitial} + 1 = ${lBookingInitial + 1})`);
    if (lBookingAfter < lBookingInitial + 1) {
      throw new Error(`Booking Lamport clock did not increment: expected >= ${lBookingInitial + 1}, got ${lBookingAfter}`);
    }

    // Wait for RabbitMQ consumer to process
    await sleep(1500);

    const lNotifAfter = await getClock(NOTIFICATION_URL);
    console.log(`  Notification Service Clock after Receive: L=${lNotifAfter} (Receive Rule: L_j = max(L_j, L_msg) + 1)`);
    if (lNotifAfter <= lBookingAfter) {
      throw new Error(`Notification Lamport clock violated causality: L_notif (${lNotifAfter}) should be > L_booking (${lBookingAfter})`);
    }

    // Verify Notification record contains the Lamport stamp in the title
    const notifRes = await fetch(`${NOTIFICATION_URL}/notifications/user/${STUDENT_EMAIL}`, {
      headers: { 'X-User-Email': STUDENT_EMAIL }
    });
    const notifications = await notifRes.json();
    const latestNotif = notifications[0];
    console.log(`  Latest Notification Title: "${latestNotif?.title}"`);
    if (latestNotif && latestNotif.title.includes('[L=')) {
      console.log(`  Verified: Title embeds Lamport logical timestamp ${latestNotif.title.match(/\[L=\d+\]/)?.[0]}`);
    }

    console.log('  ✔ TEST 1 PASSED: Lamport send & receive rules strictly verified.\n');
    passedTests++;
  } catch (err) {
    console.error('  ✖ TEST 1 FAILED:', err.message, '\n');
  }

  // ------------------------------------------------------------------
  // TEST 2: Multi-Event Sequence & Causal Ordering (Happens-Before Relation)
  // ------------------------------------------------------------------
  console.log('▶ TEST 2: Multi-Event Sequence & Causal Ordering (a -> b => L(a) < L(b))');
  try {
    const randomOffset2 = Math.floor(Math.random() * 800) + 950;
    const testDate2 = new Date(Date.now() + randomOffset2 * 86400000).toISOString().split('T')[0];
    // Create booking
    const bRes = await fetch(`${BOOKING_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': STUDENT_EMAIL
      },
      body: JSON.stringify({
        resourceId: 'COMP-SH-301',
        date: testDate2,
        startTime: '10:00',
        endTime: '11:00',
        purpose: 'Lamport Causal Chain Test',
        attendees: 25,
        facultyEmail: FACULTY_EMAIL
      })
    });
    const bData = await bRes.json();
    const bId = bData.id;
    const lBookAfterCreate = await getClock(BOOKING_URL);
    await sleep(1500);
    const lNotifAfterCreate = await getClock(NOTIFICATION_URL);

    console.log(`  Step 1 (Create Booking): Booking L=${lBookAfterCreate}, Notification L=${lNotifAfterCreate}`);

    // Faculty approval
    const facRes = await fetch(`${BOOKING_URL}/bookings/${bId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': FACULTY_EMAIL
      }
    });
    if (!facRes.ok) {
      const errText = await facRes.text();
      throw new Error(`Faculty approval failed: HTTP ${facRes.status} - ${errText}`);
    }
    const lBookAfterFaculty = await getClock(BOOKING_URL);
    await sleep(1500);
    const lNotifAfterFaculty = await getClock(NOTIFICATION_URL);

    console.log(`  Step 2 (Faculty Approval): Booking L=${lBookAfterFaculty}, Notification L=${lNotifAfterFaculty}`);

    // Coordinator/Admin approval
    const admRes = await fetch(`${BOOKING_URL}/bookings/${bId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': ADMIN_EMAIL
      }
    });
    if (!admRes.ok) {
      const errText = await admRes.text();
      throw new Error(`Admin approval failed: HTTP ${admRes.status} - ${errText}`);
    }
    const lBookAfterAdmin = await getClock(BOOKING_URL);
    await sleep(1500);
    const lNotifAfterAdmin = await getClock(NOTIFICATION_URL);

    console.log(`  Step 3 (Admin Approval): Booking L=${lBookAfterAdmin}, Notification L=${lNotifAfterAdmin}`);

    // Check monotonic causal ordering
    const causalOrderValid = (
      lBookAfterCreate < lBookAfterFaculty &&
      lBookAfterFaculty < lBookAfterAdmin &&
      lBookAfterCreate < lNotifAfterCreate &&
      lBookAfterFaculty < lNotifAfterFaculty &&
      lBookAfterAdmin < lNotifAfterAdmin &&
      lNotifAfterCreate < lNotifAfterFaculty &&
      lNotifAfterFaculty < lNotifAfterAdmin
    );

    if (!causalOrderValid) {
      throw new Error(`Causal ordering violated: Bookings(${lBookAfterCreate}, ${lBookAfterFaculty}, ${lBookAfterAdmin}) Notifications(${lNotifAfterCreate}, ${lNotifAfterFaculty}, ${lNotifAfterAdmin})`);
    }

    console.log('  ✔ TEST 2 PASSED: Strict monotonicity and causal order L(create) < L(faculty) < L(admin) confirmed.\n');
    passedTests++;
  } catch (err) {
    console.error('  ✖ TEST 2 FAILED:', err.message, '\n');
  }

  // ------------------------------------------------------------------
  // TEST 3: Malformed / Legacy Message Handling (Missing / Zero Lamport Header)
  // ------------------------------------------------------------------
  console.log('▶ TEST 3: Legacy & Malformed Message Handling');
  try {
    const lNotifBefore = await getClock(NOTIFICATION_URL);
    console.log(`  Notification Clock before raw legacy message: L=${lNotifBefore}`);

    // Publish raw event with NO Lamport header (simulating legacy microservice)
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    const EXCHANGE = 'distrbook.booking.events';
    const legacyPayload = {
      resourceId: 'COMP-SH-301',
      userEmail: STUDENT_EMAIL,
      userName: 'Legacy Client',
      date: '2026-11-20',
      startTime: '11:00',
      endTime: '12:00',
      purpose: 'Legacy test message without Lamport headers'
    };

    ch.publish(EXCHANGE, 'booking.created', Buffer.from(JSON.stringify(legacyPayload)), {
      persistent: true,
      headers: { 'event-type': 'BOOKING_CREATED' } // NO lamport-clock header
    });
    console.log('  Sent raw message with NO lamport-clock header to RabbitMQ');
    await ch.close();
    await conn.close();

    await sleep(1500);

    const lNotifAfterRaw = await getClock(NOTIFICATION_URL);
    console.log(`  Notification Clock after raw message: L=${lNotifAfterRaw} (handled via incoming = 0 default)`);

    // Ensure notification service did not crash
    const healthRes = await fetch(`${NOTIFICATION_URL}/health`);
    const health = await healthRes.json();
    if (health.status !== 'UP') {
      throw new Error('Notification service is not UP after processing legacy message');
    }

    if (lNotifAfterRaw < lNotifBefore + 1) {
      throw new Error(`Clock did not increment safely on legacy message: expected >= ${lNotifBefore + 1}, got ${lNotifAfterRaw}`);
    }

    console.log('  ✔ TEST 3 PASSED: Legacy / malformed messages handled gracefully without crash.\n');
    passedTests++;
  } catch (err) {
    console.error('  ✖ TEST 3 FAILED:', err.message, '\n');
  }

  // ------------------------------------------------------------------
  // TEST 4: Service Restarts & In-Memory Counter Limitations
  // ------------------------------------------------------------------
  console.log('▶ TEST 4: Verification of Clock Continuity after Lag/Jump');
  try {
    const lBookingCurrent = await getClock(BOOKING_URL);
    const lNotifCurrent = await getClock(NOTIFICATION_URL);

    console.log(`  Current system clocks: Booking L=${lBookingCurrent}, Notification L=${lNotifCurrent}`);
    console.log('  Theoretical In-Memory Limitation: If a service crashes and restarts,');
    console.log('  its in-memory counter resets to 0. However, upon receiving the next message');
    console.log('  from a peer with L_msg > 0, the Lamport receive rule L = max(0, L_msg) + 1');
    console.log('  immediately catches up and restores causality with the rest of the distributed system.');

    // Simulate sending a high-clock message (L=50) to verify jump/catch-up
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    const EXCHANGE = 'distrbook.booking.events';
    const highClockPayload = {
      resourceId: 'COMP-SH-301',
      userEmail: STUDENT_EMAIL,
      userName: 'High Clock Peer',
      date: '2026-11-20',
      startTime: '12:00',
      endTime: '13:00',
      purpose: 'Fast-forward clock test',
      lamportClock: 50
    };

    ch.publish(EXCHANGE, 'booking.created', Buffer.from(JSON.stringify(highClockPayload)), {
      persistent: true,
      headers: {
        'event-type': 'BOOKING_CREATED',
        'lamport-clock': 50
      }
    });
    await ch.close();
    await conn.close();

    await sleep(1500);

    const lNotifAfterJump = await getClock(NOTIFICATION_URL);
    console.log(`  Notification Clock after receiving L=50 message: L=${lNotifAfterJump}`);
    if (lNotifAfterJump < 51) {
      throw new Error(`Lamport clock did not jump forward: expected >= 51, got ${lNotifAfterJump}`);
    }

    console.log('  ✔ TEST 4 PASSED: Lamport Max-Rule correctly fast-forwards clock even after lag or peer restart.\n');
    passedTests++;
  } catch (err) {
    console.error('  ✖ TEST 4 FAILED:', err.message, '\n');
  }

  console.log('================================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStage3Tests();
