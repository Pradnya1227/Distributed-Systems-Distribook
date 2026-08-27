import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type UserRole = 'STUDENT' | 'FACULTY' | 'HALL_COORDINATOR' | 'LAB_ASSISTANT' | 'ADMIN';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    role: UserRole;
  };
}

const roleMap: Record<string, UserRole> = {
  'student': 'STUDENT',
  'faculty': 'FACULTY',
  'coordinator': 'HALL_COORDINATOR',
  'labassistant': 'LAB_ASSISTANT',
  'admin': 'ADMIN'
};

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const emailHeader = req.headers['x-user-email'] as string;
  if (!emailHeader) {
    return res.status(401).json({ error: 'Unauthorized. Missing X-User-Email header.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailHeader.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Unknown user identity.' });
    }

    const backendRole = roleMap[user.role.toLowerCase()];
    if (!backendRole) {
      return res.status(403).json({ error: 'Forbidden. Invalid role configuration.' });
    }

    req.user = {
      email: user.email,
      name: user.name,
      role: backendRole
    };
    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error in Authentication Middleware: ' + error.message });
  }
}

export function requireRoles(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}
