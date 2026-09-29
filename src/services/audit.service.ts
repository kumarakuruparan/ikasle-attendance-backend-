/**
 * Audit Service Stub / Event Dispatcher
 * Prepares the application for full audit logging across modules
 */

export interface AuditLogPayload {
  action:
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_UPDATED'
    | 'ROLE_CHANGED'
    | 'DEPARTMENT_CHANGED'
    | 'EMPLOYEE_ACTIVATED'
    | 'EMPLOYEE_DEACTIVATED'
    | 'DEPARTMENT_CREATED'
    | 'DEPARTMENT_UPDATED'
    | 'DEPARTMENT_ACTIVATED'
    | 'DEPARTMENT_DEACTIVATED'
    | 'ATTENDANCE_CHECK_IN'
    | 'ATTENDANCE_CHECK_OUT'
    | 'BREAK_STARTED'
    | 'BREAK_ENDED'
    | 'FAILED_LOCATION_VALIDATION';
  entity: 'User' | 'Department' | 'Attendance' | 'Break';
  entityId: string;
  actorId?: string;
  actorRole?: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export async function logAuditEvent(payload: AuditLogPayload): Promise<void> {
  const event = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // Structured log for audit trail tracing
  console.log(
    `[AUDIT EVENT] [${event.action}] entity=${event.entity}:${event.entityId} actor=${event.actorId || 'system'} (${event.actorRole || 'N/A'})`,
    {
      metadata: event.metadata,
      changes:
        event.previousState || event.newState
          ? { from: event.previousState, to: event.newState }
          : undefined,
      timestamp: event.timestamp,
    }
  );

  // Extensible for future database persistence (e.g. prisma.auditLog.create)
}
