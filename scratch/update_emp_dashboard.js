const fs = require('fs');
const path = require('path');

const empDashPath = path.resolve(__dirname, '../../frontend/app/(dashboard)/employee/dashboard/page.tsx');
let content = fs.readFileSync(empDashPath, 'utf8');

// Add hook imports
content = content.replace(
  'import { useSelfProfile } from "@/hooks/useSelfProfile";',
  `import { useSelfProfile } from "@/hooks/useSelfProfile";
import {
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
} from "@/hooks/useAttendance";`
);

// Add hooks in component body
content = content.replace(
  'export default function EmployeeDashboard() {\n  const { data: profile } = useSelfProfile();',
  `export default function EmployeeDashboard() {
  const { data: profile } = useSelfProfile();
  const { data: attendanceData } = useTodayAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  const attendance = attendanceData?.attendance || null;
  const activeBreak = attendanceData?.activeBreak || null;
  const officeSettings = attendanceData?.officeSettings || {
    officeStartTime: "09:30",
    officeEndTime: "19:00",
    officeRadiusMeters: 300,
    maxAccuracyThresholdMeters: 150,
  };`
);

// Update AttendanceCard and BreakCard props
content = content.replace(
  '<AttendanceCard />',
  `<AttendanceCard
            attendance={attendance}
            activeBreak={activeBreak}
            officeSettings={officeSettings}
            onCheckIn={(coords) => checkInMutation.mutateAsync(coords)}
            onCheckOut={(coords) => checkOutMutation.mutateAsync(coords)}
            isCheckingIn={checkInMutation.isPending}
            isCheckingOut={checkOutMutation.isPending}
          />`
);

content = content.replace(
  '<BreakCard />',
  `<BreakCard
            attendance={attendance}
            activeBreak={activeBreak}
            onStartBreak={(type) => startBreakMutation.mutateAsync(type)}
            onEndBreak={() => endBreakMutation.mutateAsync()}
            isStarting={startBreakMutation.isPending}
            isEnding={endBreakMutation.isPending}
          />`
);

fs.writeFileSync(empDashPath, content, 'utf8');
console.log('Successfully updated employee/dashboard/page.tsx with live attendance and break props');
