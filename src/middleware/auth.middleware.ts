import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma';
import { clerk } from '../config/clerk';
import config from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role, EmploymentStatus } from '@prisma/client';
import { generateNextEmployeeId } from '../services/user.service';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let clerkUserId: string | null = null;

    // 1. In development / testing, allow simulated test credentials if provided
    if (!config.isProduction && req.headers['x-test-user-id']) {
      clerkUserId = req.headers['x-test-user-id'] as string;
    } else {
      // 2. Extract verified Clerk user ID from request auth
      const auth = getAuth(req);
      clerkUserId = auth?.userId || null;
    }

    if (!clerkUserId) {
      throw new UnauthorizedError('Authentication required: Missing or invalid authorization token');
    }

    // 3. Lookup user in application database by clerkUserId
    let user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { department: true },
    });

    // 4. Auto-provision or link pre-created employee record on first authenticated request
    if (!user) {
      let email = `${clerkUserId}@placeholder.ikasle.local`;
      let firstName = 'User';
      let lastName = clerkUserId.slice(-4);
      let role: Role = Role.EMPLOYEE;

      // In dev test mode, allow test role assignment for automated test verification
      if (!config.isProduction && req.headers['x-test-role']) {
        const testRole = (req.headers['x-test-role'] as string).toUpperCase();
        if (testRole === 'HR') role = Role.HR;
        else if (testRole === 'CEO') role = Role.CEO;
      }

      try {
        if (config.clerk.secretKey && !req.headers['x-test-user-id']) {
          const clerkUser = await clerk.users.getUser(clerkUserId);
          if (clerkUser) {
            email = clerkUser.emailAddresses[0]?.emailAddress || email;
            firstName = clerkUser.firstName || firstName;
            lastName = clerkUser.lastName || lastName;
          }
        }
      } catch (err) {
        // Fallback to defaults if Clerk API call fails
      }

      // Check if an employee with this email was pre-registered by HR
      const existingEmployee = await prisma.user.findUnique({
        where: { email },
        include: { department: true },
      });

      if (existingEmployee) {
        // Link Clerk User ID to existing application employee profile
        user = await prisma.user.update({
          where: { id: existingEmployee.id },
          data: { clerkUserId },
          include: { department: true },
        });
      } else {
        // Generate human-friendly Employee ID (e.g. IK001, IK002...)
        const employeeId = await generateNextEmployeeId();

        user = await prisma.user.create({
          data: {
            clerkUserId,
            employeeId,
            firstName,
            lastName,
            email,
            role,
            employmentStatus: EmploymentStatus.ACTIVE,
            isActive: true,
          },
          include: { department: true },
        });
      }
    }

    // 5. Verify user account is active
    if (!user.isActive || user.employmentStatus === EmploymentStatus.INACTIVE) {
      throw new ForbiddenError('Account is deactivated. Please contact your administrator.');
    }

    // 6. Attach trusted application user and role to request
    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default requireAuth;
