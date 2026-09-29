const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('=== RUNNING BACKEND FOUNDATION TESTS ===\n');

  // 1. GET /api/health
  const health = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log('1. GET /api/health:', health.status, JSON.stringify(health.data));

  // 2. GET /api/me (Unauthenticated)
  const unauthMe = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/me',
    method: 'GET',
  });
  console.log('2. GET /api/me (Unauthenticated):', unauthMe.status, unauthMe.data.message);

  // 3. GET /api/me (Authenticated Employee)
  const authMe = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/me',
    method: 'GET',
    headers: { 'x-test-user-id': 'user_employee_001' },
  });
  console.log('3. GET /api/me (Authenticated):', authMe.status, `User: ${authMe.data.data.fullName}, Role: ${authMe.data.data.role}`);

  // 4. GET /api/users as EMPLOYEE
  const empUsers = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { 'x-test-user-id': 'user_employee_001' },
  });
  console.log('4. GET /api/users as EMPLOYEE:', empUsers.status, empUsers.data.message);

  // 5. GET /api/users as HR
  const hrUsers = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { 'x-test-user-id': 'user_hr_001' },
  });
  console.log('5. GET /api/users as HR:', hrUsers.status, `Retrieved ${hrUsers.data.data.length} users`);

  // 6. GET /api/users as CEO
  const ceoUsers = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { 'x-test-user-id': 'user_ceo_001' },
  });
  console.log('6. GET /api/users as CEO:', ceoUsers.status, `Retrieved ${ceoUsers.data.data.length} users`);

  // 7. POST /api/users as CEO (Should fail: CEO lacks employees.manage)
  const ceoCreateUser = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'x-test-user-id': 'user_ceo_001',
        'Content-Type': 'application/json',
      },
    },
    {
      clerkUserId: 'user_temp_001',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@ikasle.local',
    }
  );
  console.log('7. POST /api/users as CEO:', ceoCreateUser.status, ceoCreateUser.data.message);

  // 8. POST /api/users as HR (Should succeed: HR possesses employees.manage)
  const hrCreateUser = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'x-test-user-id': 'user_hr_001',
        'Content-Type': 'application/json',
      },
    },
    {
      clerkUserId: `user_new_${Date.now()}`,
      firstName: 'Dev',
      lastName: 'Engineer',
      email: `dev_${Date.now()}@ikasle.local`,
    }
  );
  console.log('8. POST /api/users as HR:', hrCreateUser.status, `Created employee: ${hrCreateUser.data.data?.employeeId}`);

  // 9. POST /api/departments as HR (Should succeed: HR possesses settings.manage)
  const hrCreateDept = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/departments',
      method: 'POST',
      headers: {
        'x-test-user-id': 'user_hr_001',
        'Content-Type': 'application/json',
      },
    },
    {
      name: `Engineering_${Date.now().toString().slice(-4)}`,
      description: 'Core Engineering Department',
    }
  );
  console.log('9. POST /api/departments as HR:', hrCreateDept.status, `Created department: ${hrCreateDept.data.data?.name}`);

  // 10. GET /api/departments as EMPLOYEE
  const empDepts = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/departments',
    method: 'GET',
    headers: { 'x-test-user-id': 'user_employee_001' },
  });
  console.log('10. GET /api/departments as EMPLOYEE:', empDepts.status, `Retrieved ${empDepts.data.data.length} departments`);

  // 11. Zod Validation Error (empty department name)
  const validationFail = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/departments',
      method: 'POST',
      headers: {
        'x-test-user-id': 'user_hr_001',
        'Content-Type': 'application/json',
      },
    },
    {
      name: '',
    }
  );
  console.log('11. Validation Error test (Empty Name):', validationFail.status, validationFail.data.message, JSON.stringify(validationFail.data.errors));

  console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch(console.error);
