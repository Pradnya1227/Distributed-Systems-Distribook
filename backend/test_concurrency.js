// test_concurrency.js
// Tests database transaction and row locking concurrency behavior

const BOOKING_URL = 'http://localhost:3003';

async function runConcurrencyTest() {
  console.log('==================================================');
  console.log('STARTING CONCURRENCY RACE CONDITION TEST');
  console.log('==================================================\n');

  const resourceId = 'COMP-LAB-204';
<<<<<<< HEAD
  const date = '2026-11-' + String(Math.floor(Math.random() * 19) + 10);
=======
  const date = '2026-09-02';
>>>>>>> origin/main
  const startTime = '14:00';
  const endTime = '15:00';

  const body1 = {
    resourceId,
    date,
    startTime,
    endTime,
    purpose: 'Concurrent Test Student 1'
  };

  const body2 = {
    resourceId,
    date,
    startTime,
    endTime,
    purpose: 'Concurrent Test Student 2'
  };

  console.log(`Sending two concurrent booking requests for ${resourceId} on ${date} ${startTime}-${endTime}...`);

  const req1 = fetch(`${BOOKING_URL}/bookings`, {
    method: 'POST',
    headers: {
      'X-User-Email': 'student1@demo.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body1)
  });

  const req2 = fetch(`${BOOKING_URL}/bookings`, {
    method: 'POST',
    headers: {
      'X-User-Email': 'student2@demo.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body2)
  });

  try {
    const [res1, res2] = await Promise.all([req1, req2]);
    
    console.log(`Request 1 Status: ${res1.status}`);
    console.log(`Request 2 Status: ${res2.status}`);

    const s1 = res1.status;
    const s2 = res2.status;

    const oneSucceeded = (s1 === 201 && s2 === 409) || (s2 === 201 && s1 === 409);

    if (oneSucceeded) {
      console.log('\n[PASS] Concurrency control verified successfully! One booking was created, and the other was rejected with a conflict.');
      process.exitCode = 0;
    } else {
      console.error(`\n[FAIL] Concurrency test failed. One should have succeeded (201) and one failed (409). Got status codes: ${s1} and ${s2}`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runConcurrencyTest();
