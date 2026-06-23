import type { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";
import type { Role } from "@prisma/client";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
      session?: any;
    }
  }
}

/**
 * Require authentication. Attaches session user to req.user.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return next(createError("Unauthorized", 401));
    }

    req.user = session.user as any;
    req.session = session.session;
    next();
  } catch (err) {
    next(createError("Unauthorized", 401));
  }
}

/**
 * Require admin role. Must come after requireAuth.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(createError("Unauthorized", 401));
  }
  if (req.user.role !== "ADMIN") {
    return next(createError("Forbidden: admin access required", 403));
  }
  next();
}
