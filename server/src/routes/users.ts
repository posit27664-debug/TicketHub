import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const usersRouter = Router();

// All user routes require auth
usersRouter.use(requireAuth);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "AGENT"]).default("AGENT"),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
});

// GET /api/users — Admin only
usersRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { assignedTickets: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — Admin only
usersRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { assignedTickets: true } },
      },
    });
    if (!user) return next(createError("User not found", 404));
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users — Admin only
usersRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
      return next(createError(result.error.errors[0].message, 400));
    }

    const { email, name, password, role } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError("Email already in use", 409));

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id — Admin only
usersRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      return next(createError(result.error.errors[0].message, 400));
    }

    const { password, ...rest } = result.data;
    const data: Record<string, unknown> = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id — Admin only
usersRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user!.id) {
      return next(createError("Cannot delete your own account", 400));
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});
