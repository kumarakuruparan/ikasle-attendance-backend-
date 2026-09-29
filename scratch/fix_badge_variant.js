const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../../frontend/components/attendance/AttendanceCard.tsx'),
  path.resolve(__dirname, '../../frontend/components/attendance/BreakCard.tsx'),
  path.resolve(__dirname, '../../frontend/components/attendance/GPSStatus.tsx')
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/variant="neutral"/g, 'variant="default"');
  fs.writeFileSync(f, c, 'utf8');
});

console.log('Fixed Badge neutral variant');
