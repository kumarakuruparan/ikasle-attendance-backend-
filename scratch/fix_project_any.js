const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../frontend/app/(dashboard)/hr/projects/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('department: newDept as any,', 'department: newDept as Project["department"],');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed any in hr/projects/page.tsx');
