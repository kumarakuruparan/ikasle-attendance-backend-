const fs = require('fs');
const path = require('path');

// 1. Fix AttendanceCard.tsx
const cardPath = path.resolve(__dirname, '../../frontend/components/attendance/AttendanceCard.tsx');
let cardContent = fs.readFileSync(cardPath, 'utf8');

cardContent = cardContent.replace(
  /MapPin,\s*|ShieldCheck,\s*|CheckCircle2,\s*/g,
  ''
);

if (!cardContent.includes('const [now, setNow] = useState<number>(0);')) {
  cardContent = cardContent.replace(
    'const [currentTime, setCurrentTime] = useState<string>("");',
    'const [currentTime, setCurrentTime] = useState<string>("");\n  const [now, setNow] = useState<number>(0);'
  );
}

if (!cardContent.includes('setNow(d.getTime());')) {
  cardContent = cardContent.replace(
    'hour12: true,\n        })\n      );',
    'hour12: true,\n        })\n      );\n      setNow(d.getTime());'
  );
}

cardContent = cardContent.replace(
  /workingSeconds = Math\.max\(0, Math\.floor\(\(Date\.now\(\) - startMs\) \/ 1000\) - totalBreakSec\);/,
  'workingSeconds = now > 0 ? Math.max(0, Math.floor((now - startMs) / 1000) - totalBreakSec) : 0;'
);

fs.writeFileSync(cardPath, cardContent, 'utf8');
console.log('Fixed AttendanceCard.tsx');

// 2. Fix AttendanceHistory.tsx unused imports
const historyPath = path.resolve(__dirname, '../../frontend/components/attendance/AttendanceHistory.tsx');
let histContent = fs.readFileSync(historyPath, 'utf8');
histContent = histContent.replace(/Clock,\s*|MapPin,\s*|Search,\s*/g, '');
fs.writeFileSync(historyPath, histContent, 'utf8');
console.log('Fixed AttendanceHistory.tsx');

// 3. Fix BreakCard.tsx unused imports
const breakCardPath = path.resolve(__dirname, '../../frontend/components/attendance/BreakCard.tsx');
let breakContent = fs.readFileSync(breakCardPath, 'utf8');
breakContent = breakContent.replace(/,\s*Clock/g, '');
breakContent = breakContent.replace(/const \[selectedType, setSelectedType\] = useState[^;]+;/, '');
breakContent = breakContent.replace(/selectedType/g, '"LUNCH"');
fs.writeFileSync(breakCardPath, breakContent, 'utf8');
console.log('Fixed BreakCard.tsx');

// 4. Fix BreakTimer.tsx unused imports
const breakTimerPath = path.resolve(__dirname, '../../frontend/components/attendance/BreakTimer.tsx');
let breakTimerContent = fs.readFileSync(breakTimerPath, 'utf8');
breakTimerContent = breakTimerContent.replace(/Clock,\s*/g, '');
fs.writeFileSync(breakTimerPath, breakTimerContent, 'utf8');
console.log('Fixed BreakTimer.tsx');

// 5. Fix GPSStatus.tsx unused imports
const gpsPath = path.resolve(__dirname, '../../frontend/components/attendance/GPSStatus.tsx');
let gpsContent = fs.readFileSync(gpsPath, 'utf8');
gpsContent = gpsContent.replace(/ShieldCheck,\s*|Crosshair,\s*/g, '');
gpsContent = gpsContent.replace(/serverAccuracyError,\s*/g, '');
fs.writeFileSync(gpsPath, gpsContent, 'utf8');
console.log('Fixed GPSStatus.tsx');

// 6. Fix WorkingHoursCard.tsx unused imports
const workingPath = path.resolve(__dirname, '../../frontend/components/attendance/WorkingHoursCard.tsx');
let workContent = fs.readFileSync(workingPath, 'utf8');
workContent = workContent.replace(/Clock,\s*|Coffee,\s*|CheckCircle2,\s*|TrendingUp,\s*/g, '');
fs.writeFileSync(workingPath, workContent, 'utf8');
console.log('Fixed WorkingHoursCard.tsx');
