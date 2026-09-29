const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. services/attendance.service.ts
const servicePath = path.join(frontendDir, 'services/attendance.service.ts');
const serviceContent = `import { apiClient } from './api';

export type AttendanceStatus = 'PRESENT' | 'COMPLETED' | 'INCOMPLETE' | 'ABSENT';
export type BreakType = 'MORNING' | 'LUNCH' | 'EVENING' | 'OTHER';

export interface BreakRecord {
  id: string;
  attendanceId: string;
  type: BreakType;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAccuracy: number;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracy: number | null;
  totalBreakMinutes: number;
  totalWorkingMinutes: number;
  status: AttendanceStatus;
  distanceFromOfficeMeters?: number;
  breaks: BreakRecord[];
  user?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
    role: string;
    departmentName: string;
    department?: { id: string; name: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSettings {
  officeStartTime: string;
  officeEndTime: string;
  officeRadiusMeters: number;
  maxAccuracyThresholdMeters: number;
  officeCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TodayAttendanceResponse {
  attendance: AttendanceRecord | null;
  activeBreak: BreakRecord | null;
  officeSettings: OfficeSettings;
}

export interface AttendanceStats {
  date: string;
  totalEmployees: number;
  presentCount: number;
  completedCount: number;
  activeCount: number;
  absentCount: number;
  avgWorkingMinutes: number;
  avgWorkingHours: string;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AllAttendanceFilters {
  date?: string;
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const attendanceService = {
  async checkIn(location: GPSCoordinates): Promise<AttendanceRecord> {
    const res = await apiClient<AttendanceRecord>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(location),
    });
    if (!res.data) throw new Error(res.message || 'Failed to check in');
    return res.data;
  },

  async checkOut(location: GPSCoordinates): Promise<AttendanceRecord> {
    const res = await apiClient<AttendanceRecord>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(location),
    });
    if (!res.data) throw new Error(res.message || 'Failed to check out');
    return res.data;
  },

  async startBreak(type: BreakType = 'OTHER'): Promise<BreakRecord> {
    const res = await apiClient<BreakRecord>('/attendance/break/start', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    if (!res.data) throw new Error(res.message || 'Failed to start break');
    return res.data;
  },

  async endBreak(): Promise<{ break: BreakRecord; attendance: AttendanceRecord }> {
    const res = await apiClient<{ break: BreakRecord; attendance: AttendanceRecord }>(
      '/attendance/break/end',
      {
        method: 'POST',
      }
    );
    if (!res.data) throw new Error(res.message || 'Failed to end break');
    return res.data;
  },

  async getTodayAttendance(): Promise<TodayAttendanceResponse> {
    const res = await apiClient<TodayAttendanceResponse>('/attendance/today');
    if (!res.data) throw new Error('Failed to retrieve today attendance');
    return res.data;
  },

  async getAttendanceHistory(filters: AttendanceHistoryFilters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const query = params.toString() ? \`?\${params.toString()}\` : '';
    const res = await apiClient<AttendanceRecord[]>(\`/attendance/history\${query}\`);
    return {
      records: res.data || [],
      pagination: res.meta || { total: res.data?.length || 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getAllAttendance(filters: AllAttendanceFilters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.departmentId && filters.departmentId !== 'all') {
      params.append('departmentId', filters.departmentId);
    }
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const query = params.toString() ? \`?\${params.toString()}\` : '';
    const res = await apiClient<AttendanceRecord[]>(\`/attendance/all\${query}\`);
    return {
      records: res.data || [],
      pagination: res.meta || { total: res.data?.length || 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getAttendanceStats(date?: string): Promise<AttendanceStats> {
    const query = date ? \`?date=\${date}\` : '';
    const res = await apiClient<AttendanceStats>(\`/attendance/stats\${query}\`);
    if (!res.data) throw new Error('Failed to retrieve attendance statistics');
    return res.data;
  },

  async getCompanySettings(): Promise<OfficeSettings> {
    const res = await apiClient<OfficeSettings>('/attendance/settings');
    if (!res.data) throw new Error('Failed to retrieve office attendance settings');
    return res.data;
  },
};
`;
fs.writeFileSync(servicePath, serviceContent, 'utf8');
console.log('1. Created services/attendance.service.ts');

// 2. hooks/useAttendance.ts
const hookPath = path.join(frontendDir, 'hooks/useAttendance.ts');
const hookContent = `"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attendanceService,
  GPSCoordinates,
  BreakType,
  AttendanceHistoryFilters,
  AllAttendanceFilters,
} from "@/services/attendance.service";

export const ATTENDANCE_QUERY_KEYS = {
  all: ["attendance"] as const,
  today: () => [...ATTENDANCE_QUERY_KEYS.all, "today"] as const,
  history: (filters: AttendanceHistoryFilters) =>
    [...ATTENDANCE_QUERY_KEYS.all, "history", filters] as const,
  list: (filters: AllAttendanceFilters) =>
    [...ATTENDANCE_QUERY_KEYS.all, "all", filters] as const,
  stats: (date?: string) =>
    [...ATTENDANCE_QUERY_KEYS.all, "stats", date || "today"] as const,
  settings: () => [...ATTENDANCE_QUERY_KEYS.all, "settings"] as const,
};

export function useTodayAttendance() {
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.today(),
    queryFn: () => attendanceService.getTodayAttendance(),
    refetchInterval: (query) => {
      // Auto-poll every 30s while checked in and not checked out
      const record = query.state.data?.attendance;
      if (record && !record.checkOutAt) return 30000;
      return false;
    },
  });
}

export function useAttendanceHistory(filters: AttendanceHistoryFilters = {}) {
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.history(filters),
    queryFn: () => attendanceService.getAttendanceHistory(filters),
  });
}

export function useAllAttendance(filters: AllAttendanceFilters = {}) {
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.list(filters),
    queryFn: () => attendanceService.getAllAttendance(filters),
  });
}

export function useAttendanceStats(date?: string) {
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.stats(date),
    queryFn: () => attendanceService.getAttendanceStats(date),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coords: GPSCoordinates) => attendanceService.checkIn(coords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coords: GPSCoordinates) => attendanceService.checkOut(coords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type?: BreakType) => attendanceService.startBreak(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.today() });
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceService.endBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.today() });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.all });
    },
  });
}
`;
fs.writeFileSync(hookPath, hookContent, 'utf8');
console.log('2. Created hooks/useAttendance.ts');
