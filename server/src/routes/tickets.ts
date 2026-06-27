import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { sendReply } from "../lib/sendgrid";
import type { TicketStatus, TicketCategory, Prisma } from "../generated/prisma/client";

export const ticketsRouter = Router();

// All ticket routes require auth
ticketsRouter.use(requireAuth);

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  category: z
    .enum(["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"])
    .optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["NEW", "PROCESSING", "OPEN", "RESOLVED", "CLOSED"]).optional(),
  category: z
    .enum(["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"])
    .optional(),
  assignedAgentId: z.string().nullable().optional(),
  aiSummary: z.string().optional(),
  aiSuggestedReply: z.string().optional(),
});

const listQuerySchema = z.object({
  status: z.enum(["NEW", "PROCESSING", "OPEN", "RESOLVED", "CLOSED"]).optional(),
  category: z
    .enum(["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"])
    .optional(),
  assignedAgentId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "status", "subject", "fromEmail", "category"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// GET /api/tickets
ticketsRouter.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      return next(createError(query.error.errors[0].message, 400));
    }

    const { status, category, assignedAgentId, search, sortBy, sortOrder, page, limit } =
      query.data;

    const where: Prisma.TicketWhereInput = {};
    if (status) {
      where.status = status as TicketStatus;
    }
    if (category) where.category = category as TicketCategory;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedAgent: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/stats — Dashboard stats
ticketsRouter.get("/stats", async (_req, res, next) => {
  try {
    const [newTickets, open, resolved, closed, processing, byCategory] = await Promise.all([
      prisma.ticket.count({ where: { status: "NEW" } }),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { status: "PROCESSING" } }),
      prisma.ticket.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    res.json({
      stats: {
        open,
        resolved,
        closed,
        total: newTickets + open + resolved + closed + processing,
        byCategory: byCategory.map((g) => ({
          category: g.category,
          count: g._count._all,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/metrics — 30-day chart data
ticketsRouter.get("/metrics", async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailyStats, totalCreated, totalResolved] = await Promise.all([
      prisma.$queryRaw<{ date: string; created: bigint; resolved: bigint }[]>`
        WITH dates AS (
          SELECT generate_series(
            ${thirtyDaysAgo}::date,
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        )
        SELECT
          d.date::text,
          COALESCE(c.cnt, 0) AS created,
          COALESCE(r.cnt, 0) AS resolved
        FROM dates d
        LEFT JOIN (
          SELECT "createdAt"::date AS date, COUNT(*)::bigint AS cnt
          FROM tickets
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY "createdAt"::date
        ) c ON d.date = c.date
        LEFT JOIN (
          SELECT "updatedAt"::date AS date, COUNT(*)::bigint AS cnt
          FROM tickets
          WHERE "status" = 'RESOLVED' AND "updatedAt" >= ${thirtyDaysAgo}
          GROUP BY "updatedAt"::date
        ) r ON d.date = r.date
        ORDER BY d.date
      `,
      prisma.ticket.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.ticket.count({ where: { status: "RESOLVED", updatedAt: { gte: thirtyDaysAgo } } }),
    ]);

    const byDay = dailyStats.map((d) => ({
      date: d.date,
      created: Number(d.created),
      resolved: Number(d.resolved),
    }));

    res.json({ metrics: { total30d: totalCreated, resolved30d: totalResolved, byDay } });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/:id
ticketsRouter.get("/:id", async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { sentAt: "asc" } },
      },
    });
    if (!ticket) return next(createError("Ticket not found", 404));
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets
ticketsRouter.post("/", async (req, res, next) => {
  try {
    const result = createTicketSchema.safeParse(req.body);
    if (!result.success) {
      return next(createError(result.error.errors[0].message, 400));
    }

    const ticket = await prisma.ticket.create({
      data: {
        ...result.data,
        createdById: req.user!.id,
      },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tickets/:id
ticketsRouter.patch("/:id", async (req, res, next) => {
  try {
    const result = updateTicketSchema.safeParse(req.body);
    if (!result.success) {
      return next(createError(result.error.errors[0].message, 400));
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: result.data,
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tickets/:id
ticketsRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets/:id/messages — Add a message/reply
ticketsRouter.post("/:id/messages", async (req, res, next) => {
  try {
    const bodySchema = z.object({
      body: z.string().min(1),
      fromName: z.string().min(1),
      fromEmail: z.string().email(),
      isAgent: z.boolean().default(true),
    });

    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return next(createError(result.error.errors[0].message, 400));
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return next(createError("Ticket not found", 404));

    const message = await prisma.message.create({
      data: { ticketId: req.params.id, ...result.data },
    });

    // If agent replied, update status to RESOLVED
    if (result.data.isAgent && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
      await prisma.ticket.update({
        where: { id: req.params.id },
        data: { status: "RESOLVED" },
      });
    }

    // Send outbound email reply via SendGrid if ticket came from email
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: { fromEmail: true, emailThread: true, subject: true },
    });

    if (result.data.isAgent && updatedTicket?.fromEmail) {
      sendReply({
        to: updatedTicket.fromEmail,
        subject: updatedTicket.subject,
        body: result.data.body,
        emailThread: updatedTicket.emailThread,
      }).catch((err) => console.error("[SendGrid] Failed to send reply:", err));
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});
