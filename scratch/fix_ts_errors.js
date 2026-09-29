const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Fix hr/dashboard/page.tsx
const hrDashPath = path.join(frontendDir, 'app/(dashboard)/hr/dashboard/page.tsx');
let hrDash = fs.readFileSync(hrDashPath, 'utf8');
hrDash = hrDash.replace(
  'const recentEmployees = empData?.data || [];',
  'const recentEmployees = empData?.employees || [];'
);
fs.writeFileSync(hrDashPath, hrDash, 'utf8');
console.log('Fixed hr/dashboard/page.tsx');

// 2. Fix hr/departments/page.tsx
const deptPath = path.join(frontendDir, 'app/(dashboard)/hr/departments/page.tsx');
let deptContent = fs.readFileSync(deptPath, 'utf8');
deptContent = deptContent.replace(
  'const departments = deptsData?.data || [];',
  'const departments = deptsData || [];'
);
deptContent = deptContent.replace(
  'maxWidth="max-w-2xl"',
  'maxWidth="lg"'
);
fs.writeFileSync(deptPath, deptContent, 'utf8');
console.log('Fixed hr/departments/page.tsx');

// 3. Fix hr/employees/[id]/page.tsx
const empIdPath = path.join(frontendDir, 'app/(dashboard)/hr/employees/[id]/page.tsx');
let empIdContent = fs.readFileSync(empIdPath, 'utf8');
empIdContent = empIdContent.replace(
  'const departments = deptData?.data || [];',
  'const departments = deptData || [];'
);
fs.writeFileSync(empIdPath, empIdContent, 'utf8');
console.log('Fixed hr/employees/[id]/page.tsx');

// 4. Clean unused imports in employee/dashboard/page.tsx
const empDashPath = path.join(frontendDir, 'app/(dashboard)/employee/dashboard/page.tsx');
let empDash = fs.readFileSync(empDashPath, 'utf8');
empDash = empDash.replace('import React, { useEffect, useState } from "react";', 'import React from "react";');
empDash = empDash.replace('MOCK_USERS,\n  ', '');
fs.writeFileSync(empDashPath, empDash, 'utf8');
console.log('Cleaned employee/dashboard/page.tsx');
