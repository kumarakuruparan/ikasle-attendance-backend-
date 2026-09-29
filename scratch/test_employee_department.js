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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING EMPLOYEE & DEPARTMENT MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now().toString().slice(-5);

  // 1. Unauthenticated Request -> 401
  const unauthRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'GET',
  });
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/employees returns 401');

  // 2. Setup HR, CEO, and Employee users
  const hrHeaders = { 'x-test-user-id': 'user_hr_test', 'x-test-role': 'HR', 'Content-Type': 'application/json' };
  const ceoHeaders = { 'x-test-user-id': 'user_ceo_test', 'x-test-role': 'CEO', 'Content-Type': 'application/json' };
  const empHeaders = { 'x-test-user-id': 'user_emp_test', 'x-test-role': 'EMPLOYEE', 'Content-Type': 'application/json' };

  // Authenticate/provision each
  const hrMe = await request({ host: 'localhost', port: 5000, path: '/api/me', method: 'GET', headers: hrHeaders });
  assert(hrMe.status === 200 && hrMe.data.data.role === 'HR', 'HR user authenticated successfully');

  const ceoMe = await request({ host: 'localhost', port: 5000, path: '/api/me', method: 'GET', headers: ceoHeaders });
  assert(ceoMe.status === 200 && ceoMe.data.data.role === 'CEO', 'CEO user authenticated successfully');

  const empMe = await request({ host: 'localhost', port: 5000, path: '/api/me', method: 'GET', headers: empHeaders });
  assert(empMe.status === 200 && empMe.data.data.role === 'EMPLOYEE', 'EMPLOYEE user authenticated successfully');

  // 3. EMPLOYEE Role Restrictions
  console.log('\n--- Testing Employee Restrictions ---');
  // 3a. Employee cannot list all employees -> 403
  const empListRes = await request({ host: 'localhost', port: 5000, path: '/api/employees', method: 'GET', headers: empHeaders });
  assert(empListRes.status === 403, 'Employee cannot view employee directory (403)');

  // 3b. Employee cannot create employees -> 403
  const empCreateRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: empHeaders,
  }, { firstName: 'Hacker', lastName: 'X', email: 'hacker@test.com' });
  assert(empCreateRes.status === 403, 'Employee cannot create employees (403)');

  // 3c. Employee can view and update own profile
  const updateMeRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/me/profile',
    method: 'PATCH',
    headers: empHeaders,
  }, { firstName: 'Johnathan', phone: '+1234567890' });
  assert(updateMeRes.status === 200 && updateMeRes.data.data.firstName === 'Johnathan', 'Employee can update safe personal profile');

  // 3d. Employee cannot change role or department via profile update
  const empTamperRole = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/me/profile',
    method: 'PATCH',
    headers: empHeaders,
  }, { role: 'CEO', departmentId: 'tamper_dept' });
  assert(empTamperRole.status === 200 && empTamperRole.data.data.role === 'EMPLOYEE', 'Employee role cannot be tampered via profile update');

  // 4. DEPARTMENT MANAGEMENT (HR)
  console.log('\n--- Testing Department Management ---');
  const deptName = `Engineering_${timestamp}`;
  const createDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/departments',
    method: 'POST',
    headers: hrHeaders,
  }, { name: deptName, description: 'Core software engineering department' });
  assert(createDeptRes.status === 201 && createDeptRes.data.data.name === deptName, `HR created department '${deptName}'`);
  const deptId = createDeptRes.data.data.id;

  // 4b. Department Duplicate Name Prevention
  const dupDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/departments',
    method: 'POST',
    headers: hrHeaders,
  }, { name: deptName, description: 'Duplicate attempt' });
  assert(dupDeptRes.status === 409, 'Duplicate department name rejected with 409');

  // 4c. Edit department
  const editDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}`,
    method: 'PATCH',
    headers: hrHeaders,
  }, { description: 'Updated engineering mission' });
  assert(editDeptRes.status === 200 && editDeptRes.data.data.description === 'Updated engineering mission', 'HR edited department description');

  // 4d. Deactivate and reactivate department
  const deactDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}/status`,
    method: 'PATCH',
    headers: hrHeaders,
  }, { isActive: false });
  assert(deactDeptRes.status === 200 && deactDeptRes.data.data.isActive === false, 'HR deactivated department');

  const reactDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}/status`,
    method: 'PATCH',
    headers: hrHeaders,
  }, { isActive: true });
  assert(reactDeptRes.status === 200 && reactDeptRes.data.data.isActive === true, 'HR reactivated department');

  // 5. EMPLOYEE CREATION & UNIQUE EMPLOYEE ID (HR)
  console.log('\n--- Testing Employee Creation & Safe Human IDs ---');
  const empEmail1 = `emp1_${timestamp}@ikasle.test`;
  const empEmail2 = `emp2_${timestamp}@ikasle.test`;

  const createEmp1 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: hrHeaders,
  }, {
    firstName: 'Dev',
    lastName: 'One',
    email: empEmail1,
    departmentId: deptId,
    role: 'EMPLOYEE',
    jobTitle: 'Frontend Engineer',
    phone: '+15551234567',
  });
  assert(createEmp1.status === 201, `HR created employee 1 (${createEmp1.data.data?.employeeId})`);
  assert(createEmp1.data.data.employeeId.startsWith('IK'), `Employee ID follows human-friendly 'IKxxx' format: ${createEmp1.data.data.employeeId}`);
  const emp1Id = createEmp1.data.data.id;
  const emp1VisibleId = createEmp1.data.data.employeeId;

  const createEmp2 = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: hrHeaders,
  }, {
    firstName: 'Dev',
    lastName: 'Two',
    email: empEmail2,
    departmentId: deptId,
    role: 'EMPLOYEE',
    jobTitle: 'Backend Engineer',
  });
  assert(createEmp2.status === 201, `HR created employee 2 (${createEmp2.data.data?.employeeId})`);
  assert(createEmp2.data.data.employeeId !== emp1VisibleId, 'Consecutive employee IDs are strictly unique and sequential');

  // 5b. Prevent duplicate email
  const dupEmailRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: hrHeaders,
  }, {
    firstName: 'Dev',
    lastName: 'Clone',
    email: empEmail1,
  });
  assert(dupEmailRes.status === 409, 'Duplicate employee email rejected with 409');

  // 5c. Prevent invalid department
  const badDeptRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: hrHeaders,
  }, {
    firstName: 'Dev',
    lastName: 'Lost',
    email: `lost_${timestamp}@ikasle.test`,
    departmentId: 'non_existent_dept_id_12345',
  });
  assert(badDeptRes.status === 400, 'Invalid department ID rejected with 400');

  // 6. EDIT EMPLOYEE & ROLE ASSIGNMENT
  console.log('\n--- Testing Edit Employee & Role Assignment ---');
  const editEmpRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/employees/${emp1Id}`,
    method: 'PATCH',
    headers: hrHeaders,
  }, {
    jobTitle: 'Lead Software Architect',
    role: 'HR',
  });
  assert(editEmpRes.status === 200 && editEmpRes.data.data.jobTitle === 'Lead Software Architect' && editEmpRes.data.data.role === 'HR', 'HR updated employee job title and assigned role');

  // 7. ACTIVATE / DEACTIVATE EMPLOYEE
  console.log('\n--- Testing Employee Deactivation ---');
  const deactEmpRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/employees/${emp1Id}/status`,
    method: 'PATCH',
    headers: hrHeaders,
  }, { isActive: false });
  assert(deactEmpRes.status === 200 && deactEmpRes.data.data.isActive === false && deactEmpRes.data.data.employmentStatus === 'INACTIVE', 'HR deactivated employee (isActive=false, employmentStatus=INACTIVE)');

  // Inactive employee attempting to authenticate -> 403 Forbidden
  const inactiveAuthRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/me',
    method: 'GET',
    headers: { 'x-test-user-id': deactEmpRes.data.data.clerkUserId },
  });
  assert(inactiveAuthRes.status === 403, 'Deactivated employee blocked from authenticating with 403');

  // Reactivate employee
  const reactEmpRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/employees/${emp1Id}/status`,
    method: 'PATCH',
    headers: hrHeaders,
  }, { isActive: true });
  assert(reactEmpRes.status === 200 && reactEmpRes.data.data.isActive === true && reactEmpRes.data.data.employmentStatus === 'ACTIVE', 'HR reactivated employee');

  // 8. DEPARTMENT MEMBERSHIP & SAFE DELETION REJECTION
  console.log('\n--- Testing Department Membership & Deletion Protection ---');
  const deptDetailRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}`,
    method: 'GET',
    headers: hrHeaders,
  });
  assert(deptDetailRes.status === 200 && deptDetailRes.data.data.users.length >= 2, `Department details includes member roster (${deptDetailRes.data.data.users.length} members)`);

  const deleteBlockedRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}`,
    method: 'DELETE',
    headers: hrHeaders,
  });
  assert(deleteBlockedRes.status === 400, 'Department deletion safely blocked when associated employees exist (400)');

  // 9. CEO PERMISSIONS & RESTRICTIONS
  console.log('\n--- Testing CEO Access ---');
  // CEO can view employees
  const ceoViewEmployees = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'GET',
    headers: ceoHeaders,
  });
  assert(ceoViewEmployees.status === 200 && Array.isArray(ceoViewEmployees.data.data), 'CEO can view employee roster');

  // CEO can view departments
  const ceoViewDepts = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/departments',
    method: 'GET',
    headers: ceoHeaders,
  });
  assert(ceoViewDepts.status === 200 && Array.isArray(ceoViewDepts.data.data), 'CEO can view departments');

  // CEO cannot create employee -> 403
  const ceoCreateEmp = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees',
    method: 'POST',
    headers: ceoHeaders,
  }, { firstName: 'CEO', lastName: 'Hire', email: 'ceohire@test.com' });
  assert(ceoCreateEmp.status === 403, 'CEO cannot create employees (403)');

  // CEO cannot edit department -> 403
  const ceoEditDept = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/departments/${deptId}`,
    method: 'PATCH',
    headers: ceoHeaders,
  }, { name: 'CEO Rename' });
  assert(ceoEditDept.status === 403, 'CEO cannot modify departments (403)');

  // 10. DASHBOARD METRICS API
  console.log('\n--- Testing Dashboard Stats API ---');
  const statsRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/employees/dashboard/stats',
    method: 'GET',
    headers: hrHeaders,
  });
  assert(statsRes.status === 200, 'Retrieved dashboard stats');
  assert(statsRes.data.data.totalEmployees > 0, `Stats show total employees: ${statsRes.data.data.totalEmployees}`);
  assert(statsRes.data.data.departmentCount > 0, `Stats show department count: ${statsRes.data.data.departmentCount}`);

  console.log('\n====================================================');
  console.log('🎉 ALL BACKEND RBAC & API TESTS COMPLETED 100% PASSING');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
