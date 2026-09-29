const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. hooks/useGeolocation.ts
const geoHookPath = path.join(frontendDir, 'hooks/useGeolocation.ts');
const geoHookContent = `"use client";

import { useState, useCallback, useEffect } from "react";
import { GPSCoordinates } from "@/services/attendance.service";

export type GeolocationStatus =
  | "idle"
  | "prompt"
  | "getting"
  | "available"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export interface GeolocationState {
  coords: GPSCoordinates | null;
  status: GeolocationStatus;
  errorMessage: string | null;
  isSupported: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
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

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setState((prev) => ({
              ...prev,
              status: "denied",
              errorMessage:
                "Location permission has been denied. Please allow location access in your browser settings.",
            }));
          } else if (permissionStatus.state === "prompt") {
            setState((prev) => ({ ...prev, status: "prompt" }));
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === "denied") {
              setState((prev) => ({
                ...prev,
                status: "denied",
                errorMessage: "Location permission has been denied.",
              }));
            }
          };
        })
        .catch(() => {
          // Permissions API query not supported on all browsers, fallback to default
        });
    }
  }, []);

  const requestPosition = useCallback((): Promise<GPSCoordinates> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        const msg = "Geolocation is not supported by this browser.";
        setState((prev) => ({ ...prev, status: "unsupported", errorMessage: msg }));
        return reject(new Error(msg));
      }

      setIsLoading(true);
      setState((prev) => ({ ...prev, status: "getting", errorMessage: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GPSCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setState({
            coords,
            status: "available",
            errorMessage: null,
            isSupported: true,
          });
          setIsLoading(false);
          resolve(coords);
        },
        (error) => {
          let errorStatus: GeolocationStatus = "unavailable";
          let message = "Unable to determine your GPS location.";

          if (error.code === error.PERMISSION_DENIED) {
            errorStatus = "denied";
            message =
              "Location permission was denied. Please enable location access in your browser permissions and try again.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorStatus = "unavailable";
            message =
              "GPS position unavailable. Please ensure your device location services are enabled.";
          } else if (error.code === error.TIMEOUT) {
            errorStatus = "timeout";
            message =
              "Location request timed out. Please check your signal and try again.";
          }

          setState({
            coords: null,
            status: errorStatus,
            errorMessage: message,
            isSupported: true,
          });
          setIsLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    ...state,
    isLoading,
    requestPosition,
  };
}
`;
fs.writeFileSync(geoHookPath, geoHookContent, 'utf8');
console.log('1. Created hooks/useGeolocation.ts');

// 2. components/attendance/GPSStatus.tsx
const gpsStatusPath = path.join(frontendDir, 'components/attendance/GPSStatus.tsx');
const gpsStatusContent = `"use client";

import React from "react";
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Crosshair,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GeolocationStatus } from "@/hooks/useGeolocation";
import { GPSCoordinates, OfficeSettings } from "@/services/attendance.service";

interface GPSStatusProps {
  status: GeolocationStatus;
  coords: GPSCoordinates | null;
  officeSettings?: OfficeSettings;
  isLoading?: boolean;
  onRefreshLocation?: () => void;
  serverAccuracyError?: string | null;
  serverDistanceError?: string | null;
}

export function GPSStatus({
  status,
  coords,
  officeSettings,
  isLoading,
  onRefreshLocation,
  serverAccuracyError,
  serverDistanceError,
}: GPSStatusProps) {
  const maxAllowedAccuracy = officeSettings?.maxAccuracyThresholdMeters || 150;
  const isAccuracyLow =
    coords && coords.accuracy > maxAllowedAccuracy;

  if (status === "unsupported") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
        <span>Browser does not support GPS Geolocation.</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="font-semibold">Location Permission Required:</strong>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              Please grant browser location access to verify office presence.
            </p>
          </div>
        </div>
        {onRefreshLocation && (
          <button
            type="button"
            onClick={onRefreshLocation}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            <RotateCw className="h-3 w-3" />
            Enable & Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <MapPin className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              Office Geofence Status
            </span>
            {status === "getting" || isLoading ? (
              <Badge variant="outline" className="animate-pulse">
                Getting GPS Signal...
              </Badge>
            ) : coords ? (
              isAccuracyLow ? (
                <Badge variant="warning">Location Accuracy Low</Badge>
              ) : serverDistanceError ? (
                <Badge variant="destructive">Outside Office Boundary</Badge>
              ) : (
                <Badge variant="success">Location Verified</Badge>
              )
            ) : (
              <Badge variant="neutral">Ready to Verify</Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {coords
              ? \`Signal accuracy: ±\${Math.round(coords.accuracy)}m (Allowed limit: \${maxAllowedAccuracy}m)\`
              : "GPS position will be checked upon clock-in and clock-out."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefreshLocation && (
          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={isLoading || status === "getting"}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-50"
          >
            <RotateCw className={\`h-3 w-3 \${isLoading || status === "getting" ? "animate-spin" : ""}\`} />
            Refresh GPS
          </button>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync(gpsStatusPath, gpsStatusContent, 'utf8');
console.log('2. Created components/attendance/GPSStatus.tsx');

// 3. components/attendance/BreakTimer.tsx
const breakTimerPath = path.join(frontendDir, 'components/attendance/BreakTimer.tsx');
const breakTimerContent = `"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Clock } from "lucide-react";

interface BreakTimerProps {
  startedAt: string;
}

export function BreakTimer({ startedAt }: BreakTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = new Date(startedAt).getTime();
    const update = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = \`\${String(minutes).padStart(2, "0")}:\${String(seconds).padStart(2, "0")}\`;

  return (
    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono font-bold text-sm bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
      <Coffee className="h-4 w-4 animate-bounce" />
      <span>{formatted}</span>
    </div>
  );
}
`;
fs.writeFileSync(breakTimerPath, breakTimerContent, 'utf8');
console.log('3. Created components/attendance/BreakTimer.tsx');

// 4. components/attendance/BreakCard.tsx
const breakCardPath = path.join(frontendDir, 'components/attendance/BreakCard.tsx');
const breakCardContent = `"use client";

import React, { useState } from "react";
import { Coffee, Pause, Play, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BreakTimer } from "./BreakTimer";
import {
  AttendanceRecord,
  BreakRecord,
  BreakType,
} from "@/services/attendance.service";

interface BreakCardProps {
  attendance: AttendanceRecord | null;
  activeBreak: BreakRecord | null;
  onStartBreak: (type: BreakType) => Promise<unknown>;
  onEndBreak: () => Promise<unknown>;
  isStarting?: boolean;
  isEnding?: boolean;
}

export default function BreakCard({
  attendance,
  activeBreak,
  onStartBreak,
  onEndBreak,
  isStarting = false,
  isEnding = false,
}: BreakCardProps) {
  const [selectedType, setSelectedType] = useState<BreakType>("LUNCH");

  const isCheckedIn = Boolean(attendance && !attendance.checkOutAt);
  const isCheckedOut = Boolean(attendance?.checkOutAt);
  const isOnBreak = Boolean(activeBreak);

  const completedBreaks = attendance?.breaks.filter((b) => b.endedAt !== null) || [];
  const totalBreakMinutes = attendance?.totalBreakMinutes || 0;

  const breakTypes: Array<{ type: BreakType; label: string; policyMinutes: number }> = [
    { type: "MORNING", label: "Morning Tea", policyMinutes: 15 },
    { type: "LUNCH", label: "Lunch", policyMinutes: 60 },
    { type: "EVENING", label: "Evening Tea", policyMinutes: 15 },
    { type: "OTHER", label: "Quick Break", policyMinutes: 15 },
  ];

  const handleStart = async (type: BreakType) => {
    setSelectedType(type);
    await onStartBreak(type);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm">Break & Pause Management</CardTitle>
              <CardDescription className="text-xs">
                Company policy allows Morning (15m), Lunch (60m), and Evening (15m) pauses.
              </CardDescription>
            </div>
          </div>

          {isOnBreak ? (
            <Badge variant="warning">On Active Break</Badge>
          ) : isCheckedIn ? (
            <Badge variant="success">Currently Working</Badge>
          ) : (
            <Badge variant="neutral">Shift Inactive</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Break Banner */}
        {isOnBreak && activeBreak && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  {activeBreak.type} Break in Progress
                </span>
              </div>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                Started at {new Date(activeBreak.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <BreakTimer startedAt={activeBreak.startedAt} />
              <Button
                variant="primary"
                size="sm"
                onClick={onEndBreak}
                isLoading={isEnding}
                disabled={isEnding}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                End Break & Resume
              </Button>
            </div>
          </div>
        )}

        {/* Start Break Actions (Only enabled if checked in and not already on break) */}
        {!isOnBreak && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {breakTypes.map(({ type, label, policyMinutes }) => (
                <button
                  key={type}
                  type="button"
                  disabled={!isCheckedIn || isCheckedOut || isStarting}
                  onClick={() => handleStart(type)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-blue-950/40 dark:hover:border-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed group text-center"
                >
                  <Pause className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Policy: {policyMinutes} min
                  </span>
                </button>
              ))}
            </div>

            {!isCheckedIn && !isCheckedOut && (
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Check in first to enable break tracking.
              </p>
            )}
            {isCheckedOut && (
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Shift completed. Breaks disabled after checkout.
              </p>
            )}
          </div>
        )}

        {/* Break Summary / History Log for Today */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/30">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Today&apos;s Total Break Time:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalBreakMinutes} min
            </span>
          </div>

          {completedBreaks.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center pt-2">
              No completed breaks recorded yet today.
            </p>
          ) : (
            <div className="space-y-1.5 pt-2">
              {completedBreaks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <strong>{b.type}</strong>
                    <span>
                      ({new Date(b.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {b.endedAt ? new Date(b.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "..."})
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {b.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
`;
fs.writeFileSync(breakCardPath, breakCardContent, 'utf8');
console.log('4. Created components/attendance/BreakCard.tsx');

// 5. components/attendance/AttendanceCard.tsx
const attendanceCardPath = path.join(frontendDir, 'components/attendance/AttendanceCard.tsx');
const attendanceCardContent = `"use client";

import React, { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GPSStatus } from "./GPSStatus";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  AttendanceRecord,
  BreakRecord,
  OfficeSettings,
} from "@/services/attendance.service";

interface AttendanceCardProps {
  attendance: AttendanceRecord | null;
  activeBreak: BreakRecord | null;
  officeSettings: OfficeSettings;
  onCheckIn: (coords: { latitude: number; longitude: number; accuracy: number }) => Promise<unknown>;
  onCheckOut: (coords: { latitude: number; longitude: number; accuracy: number }) => Promise<unknown>;
  isCheckingIn?: boolean;
  isCheckingOut?: boolean;
}

export default function AttendanceCard({
  attendance,
  activeBreak,
  officeSettings,
  onCheckIn,
  onCheckOut,
  isCheckingIn = false,
  isCheckingOut = false,
}: AttendanceCardProps) {
  const { coords, status: geoStatus, requestPosition, isLoading: isGettingLocation, errorMessage: geoError } =
    useGeolocation();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const isCheckedIn = Boolean(attendance);
  const isCheckedOut = Boolean(attendance?.checkOutAt);
  const isOnBreak = Boolean(activeBreak);

  // Real-time ticking wall clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time timer calculation from server checkInAt timestamp
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
  }, [attendance]);

  const formatWorkingTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return \`\${String(hours).padStart(2, "0")}:\${String(minutes).padStart(2, "0")}:\${String(seconds).padStart(2, "0")}\`;
  };

  const handleCheckInClick = async () => {
    try {
      setApiError(null);
      const position = await requestPosition();
      await onCheckIn(position);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to record check-in.");
    }
  };

  const handleCheckOutClick = async () => {
    try {
      setApiError(null);
      const position = await requestPosition();
      await onCheckOut(position);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to record check-out.");
    }
  };

  return (
    <Card className="relative border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Daily Attendance Verification
              </CardTitle>
              {isCheckedOut ? (
                <Badge variant="success">Completed</Badge>
              ) : isCheckedIn ? (
                <Badge variant="info">Active Shift</Badge>
              ) : (
                <Badge variant="neutral">Not Checked In</Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              Official Shift Hours: {officeSettings?.officeStartTime || "09:30"} –{" "}
              {officeSettings?.officeEndTime || "19:00"} • Geofenced Office Area
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTime || "..."}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Error message alert */}
        {(apiError || geoError) && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Attendance Notice: </strong>
              <span>{apiError || geoError}</span>
            </div>
          </div>
        )}

        {/* GPS Geofence Status Component */}
        <GPSStatus
          status={geoStatus}
          coords={coords}
          officeSettings={officeSettings}
          isLoading={isGettingLocation}
          onRefreshLocation={() => requestPosition().catch(() => {})}
        />

        {/* Main Attendance Display Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-gradient-to-tr from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-900/60 dark:via-blue-950/20 dark:to-slate-900/60 p-5 border border-slate-200/80 dark:border-slate-800">
          {/* Check-In Record */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Clock-In Time
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {attendance?.checkInAt
                ? new Date(attendance.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </div>
            <p className="text-[11px] text-slate-500">
              {attendance?.checkInAt ? "Verified on Premises" : "Awaiting check-in"}
            </p>
          </div>

          {/* Live Working Duration */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Effective Working Time
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {isCheckedIn ? formatWorkingTime(workingSeconds) : "00:00:00"}
            </div>
            <p className="text-[11px] text-slate-500">
              {isOnBreak
                ? "Paused (Break active)"
                : isCheckedOut
                ? "Shift closed"
                : isCheckedIn
                ? "Live ticking timer"
                : "Starts upon check-in"}
            </p>
          </div>

          {/* Check-Out Record */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Clock-Out Time
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {attendance?.checkOutAt
                ? new Date(attendance.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </div>
            <p className="text-[11px] text-slate-500">
              {attendance?.checkOutAt
                ? \`Total: \${Math.round((attendance.totalWorkingMinutes || 0) / 60 * 10) / 10} productive hrs\`
                : "Shift still active"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Check In Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[180px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
            disabled={isCheckedIn || isCheckingIn || isGettingLocation}
            isLoading={isCheckingIn || (isGettingLocation && !isCheckedIn)}
            onClick={handleCheckInClick}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isCheckedIn ? "Already Clocked In" : "Check In with GPS"}
          </Button>

          {/* Check Out Button */}
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="w-full sm:w-auto min-w-[180px] shadow-md shadow-red-500/20"
            disabled={!isCheckedIn || isCheckedOut || isOnBreak || isCheckingOut || isGettingLocation}
            isLoading={isCheckingOut || (isGettingLocation && isCheckedIn && !isCheckedOut)}
            onClick={handleCheckOutClick}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isCheckedOut
              ? "Shift Completed"
              : isOnBreak
              ? "End Break Before Checkout"
              : "Check Out & Close Shift"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
`;
fs.writeFileSync(attendanceCardPath, attendanceCardContent, 'utf8');
console.log('5. Created components/attendance/AttendanceCard.tsx');

// 6. components/attendance/WorkingHoursCard.tsx
const workingHoursPath = path.join(frontendDir, 'components/attendance/WorkingHoursCard.tsx');
const workingHoursContent = `"use client";

import React from "react";
import { Clock, Briefcase, Coffee, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AttendanceRecord } from "@/services/attendance.service";

interface WorkingHoursCardProps {
  attendance: AttendanceRecord | null;
}

export function WorkingHoursCard({ attendance }: WorkingHoursCardProps) {
  const checkInTime = attendance?.checkInAt
    ? new Date(attendance.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const checkOutTime = attendance?.checkOutAt
    ? new Date(attendance.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const totalBreakMinutes = attendance?.totalBreakMinutes || 0;
  const workingMinutes = attendance?.totalWorkingMinutes || 0;
  const workingHours = (workingMinutes / 60).toFixed(1);

  // Standard workday = 8h (480 min)
  const standardWorkdayMinutes = 480;
  const progressPercent = Math.min(100, Math.round((workingMinutes / standardWorkdayMinutes) * 100));

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-500" />
          Today&apos;s Productive Hours Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Check In</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono mt-1 block">
              {checkInTime}
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Check Out</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono mt-1 block">
              {checkOutTime}
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Breaks</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">
              {totalBreakMinutes} min
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Net Productive</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">
              {workingHours} hrs
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500">Progress against 8-hour shift target</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: \`\${progressPercent}%\` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
`;
fs.writeFileSync(workingHoursPath, workingHoursContent, 'utf8');
console.log('6. Created components/attendance/WorkingHoursCard.tsx');

// 7. components/attendance/AttendanceHistory.tsx
const historyPath = path.join(frontendDir, 'components/attendance/AttendanceHistory.tsx');
const historyContent = `"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAttendanceHistory } from "@/hooks/useAttendance";

export default function AttendanceHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAttendanceHistory({ page, limit: 10 });

  const records = data?.records || [];
  const pagination = data?.pagination;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            My Attendance History
          </CardTitle>
          <span className="text-xs text-slate-400">
            Total records: {pagination?.total ?? 0}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading attendance records...
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-xs text-rose-500">
            {error instanceof Error ? error.message : "Failed to load attendance history."}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && records.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">
            No attendance records logged yet. Your checked-in shifts will appear here.
          </div>
        )}

        {!isLoading && !isError && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Clock In</th>
                  <th className="pb-3 font-semibold">Clock Out</th>
                  <th className="pb-3 font-semibold">Break Duration</th>
                  <th className="pb-3 font-semibold">Working Hours</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {new Date(rec.date).toLocaleDateString([], {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {new Date(rec.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {rec.checkOutAt
                        ? new Date(rec.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Active"}
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {rec.totalBreakMinutes} min
                    </td>
                    <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {(rec.totalWorkingMinutes / 60).toFixed(1)} hrs
                    </td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={
                          rec.status === "COMPLETED"
                            ? "success"
                            : rec.status === "PRESENT"
                            ? "info"
                            : "destructive"
                        }
                      >
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
`;
fs.writeFileSync(historyPath, historyContent, 'utf8');
console.log('7. Created components/attendance/AttendanceHistory.tsx');
