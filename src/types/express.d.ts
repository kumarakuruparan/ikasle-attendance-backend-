import { UserWithDepartment } from './auth';

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserWithDepartment;
      auth?: {
        userId?: string | null;
        sessionId?: string | null;
        getToken?: () => Promise<string | null>;
        claims?: Record<string, unknown>;
      };
    }
  }
}

export {};
