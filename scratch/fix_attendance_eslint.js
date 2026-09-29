const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Fix AttendanceCard.tsx
const cardPath = path.join(frontendDir, 'components/attendance/AttendanceCard.tsx');
let card = fs.readFileSync(cardPath, 'utf8');

// Replace setWorkingSeconds state & effect with derived calculation
card = card.replace(
  '  const [workingSeconds, setWorkingSeconds] = useState(0);\n',
  ''
);

const oldEffect = `  // Real-time timer calculation from server checkInAt timestamp
  useEffect(() => {
    if (!attendance?.checkInAt) {
      setWorkingSeconds(0);
      return;
    }

    const startTime = new Date(attendance.checkInAt).getTime();
    const totalBreakSeconds = (attendance.totalBreakMinutes || 0) * 60;

    if (attendance.checkOutAt) {
      // Completed shift: freeze at calculated total
      setWorkingSeconds((attendance.totalWorkingMinutes || 0) * 60);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsedGross = Math.max(0, Math.floor((now - startTime) / 1000));
      const netWorking = Math.max(0, elapsedGross - totalBreakSeconds);
      setWorkingSeconds(netWorking);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attendance]);`;

const newDerived = `  // Authoritative working time derived from server timestamps + ticking clock
  let workingSeconds = 0;
  if (attendance?.checkInAt) {
    if (attendance.checkOutAt) {
      workingSeconds = (attendance.totalWorkingMinutes || 0) * 60;
    } else {
      const startMs = new Date(attendance.checkInAt).getTime();
      const totalBreakSec = (attendance.totalBreakMinutes || 0) * 60;
      workingSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000) - totalBreakSec);
    }
  }`;

card = card.replace(oldEffect, newDerived);
fs.writeFileSync(cardPath, card, 'utf8');
console.log('1. Fixed AttendanceCard.tsx');

// 2. Fix useGeolocation.ts
const geoPath = path.join(frontendDir, 'hooks/useGeolocation.ts');
let geo = fs.readFileSync(geoPath, 'utf8');

const oldGeoState = `  const [state, setState] = useState<GeolocationState>({
    coords: null,
    status: "idle",
    errorMessage: null,
    isSupported: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check initial permission status if available
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: "unsupported",
        isSupported: false,
        errorMessage: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {`;

const newGeoState = `  const [state, setState] = useState<GeolocationState>(() => {
    const isSupported = typeof window !== "undefined" && Boolean(navigator.geolocation);
    return {
      coords: null,
      status: isSupported ? "idle" : "unsupported",
      errorMessage: isSupported ? null : "Geolocation is not supported by your browser.",
      isSupported,
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check initial permission status if available
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {`;

geo = geo.replace(oldGeoState, newGeoState);
fs.writeFileSync(geoPath, geo, 'utf8');
console.log('2. Fixed useGeolocation.ts');
