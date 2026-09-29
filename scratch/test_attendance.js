const http = require('http');
require('dotenv').config();
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING IKASLE ATTENDANCE & GPS BACKEND TESTS');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Office setup:
  // Bangalore HQ: 12.9716, 77.5946
  // Radius: 300m
  // Point INSIDE: 12.9718, 77.5948 (~30 meters away)
  // Point OUTSIDE: 13.0827, 80.2707 (Chennai, ~290 km away)
  const insideCoords = { latitude: 12.9718, longitude: 77.5948, accuracy: 15 };
  const outsideCoords = { latitude: 13.0827, longitude: 80.2707, accuracy: 20 };
  const lowAccuracyCoords = { latitude: 12.9718, longitude: 77.5948, accuracy: 350 };

  // Setup test user
  const testUserId = `test_emp_${Date.now()}`;
  const emp = await prisma.user.create({
    data: {
      clerkUserId: testUserId,
      employeeId: `ATT-${Date.now().toString().slice(-4)}`,
      firstName: 'Attendance',
      lastName: 'Tester',
      email: `${testUserId}@ikasle.test`,
      role: Role.EMPLOYEE,
      isActive: true,
      employmentStatus: 'ACTIVE',
    },
  });

  const hrUser = await prisma.user.findFirst({ where: { role: Role.HR, isActive: true } });
  const hrClerkId = hrUser?.clerkUserId || 'user_hr_001';

  try {
    // Test 1: Unauthenticated request should return 401
    const t1 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/today',
      method: 'GET',
    });
    assert(t1.status === 401, 'Test 1: Unauthenticated access rejected with 401');

    // Test 2: Low accuracy check-in rejected
    const t2 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-in',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      lowAccuracyCoords
    );
    assert(t2.status === 400 && t2.body.message.includes('accuracy is too low'), 'Test 2: Low GPS accuracy rejected');

    // Test 3: Outside office radius check-in rejected
    const t3 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-in',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      outsideCoords
    );
    assert(t3.status === 400 && t3.body.message.includes('outside the permitted office attendance area'), 'Test 3: Outside office radius check-in rejected');

    // Test 4: Check-in before start has no today attendance
    const t4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/today',
      method: 'GET',
      headers: { 'x-test-user-id': testUserId },
    });
    assert(t4.status === 200 && t4.body.data.attendance === null, 'Test 4: Before check-in, today attendance is null');

    // Test 5: Successful Check-in inside office radius
    const t5 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-in',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      insideCoords
    );
    assert(t5.status === 201 && t5.body.data.status === 'PRESENT', 'Test 5: Inside radius check-in succeeded with status PRESENT');

    // Test 6: Duplicate check-in rejected with 409
    const t6 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-in',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      insideCoords
    );
    assert(t6.status === 409, 'Test 6: Duplicate check-in on the same day rejected with 409 Conflict');

    // Test 7: Start Break
    const t7 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/break/start',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      { type: 'LUNCH' }
    );
    assert(t7.status === 201 && t7.body.data.type === 'LUNCH', 'Test 7: Start break succeeded');

    // Test 8: Starting another break while one is running rejected with 409
    const t8 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/break/start',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      { type: 'MORNING' }
    );
    assert(t8.status === 409, 'Test 8: Second concurrent break rejected with 409');

    // Test 9: Checkout while on break rejected
    const t9 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-out',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      insideCoords
    );
    assert(t9.status === 400 && t9.body.message.includes('active break'), 'Test 9: Checkout while break is active rejected');

    // Test 10: End Break
    const t10 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/break/end',
      method: 'POST',
      headers: { 'x-test-user-id': testUserId },
    });
    assert(t10.status === 200 && t10.body.data.break.endedAt !== null, 'Test 10: End break succeeded and duration calculated');

    // Test 11: Successful Checkout inside radius
    const t11 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-out',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      insideCoords
    );
    assert(t11.status === 200 && t11.body.data.status === 'COMPLETED', 'Test 11: Checkout succeeded with status COMPLETED');

    // Test 12: Checkout again after checkout rejected
    const t12 = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-out',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-user-id': testUserId },
      },
      insideCoords
    );
    assert(t12.status === 400 && t12.body.message.includes('already checked out'), 'Test 12: Checkout again after checkout rejected');

    // Test 13: Query personal history
    const t13 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/history',
      method: 'GET',
      headers: { 'x-test-user-id': testUserId },
    });
    assert(t13.status === 200 && t13.body.data.length >= 1, 'Test 13: Personal history retrieved');

    // Test 14: Employee role cannot access HR /api/attendance/all (RBAC check)
    const t14 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/all',
      method: 'GET',
      headers: { 'x-test-user-id': testUserId },
    });
    assert(t14.status === 403, 'Test 14: Regular Employee cannot access /api/attendance/all (403 Forbidden)');

    // Test 15: HR can access /api/attendance/all
    const t15 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/all',
      method: 'GET',
      headers: { 'x-test-user-id': hrClerkId },
    });
    assert(t15.status === 200 && Array.isArray(t15.body.data), 'Test 15: HR successfully queries /api/attendance/all');

    // Test 16: HR/CEO can access /api/attendance/stats
    const t16 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/stats',
      method: 'GET',
      headers: { 'x-test-user-id': hrClerkId },
    });
    assert(t16.status === 200 && t16.body.data.totalEmployees > 0, 'Test 16: Executive statistics endpoint succeeds');

  } finally {
    // Cleanup test user and attendances
    await prisma.break.deleteMany({ where: { attendance: { userId: emp.id } } });
    await prisma.attendance.deleteMany({ where: { userId: emp.id } });
    await prisma.user.delete({ where: { id: emp.id } });
    await prisma.$disconnect();
  }

  console.log('====================================================');
  console.log(`ATTENDANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
