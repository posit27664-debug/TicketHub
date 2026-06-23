import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";

export const emailRouter = Router();

/**
 * POST /api/email/inbound
 *
 * Webhook endpoint for inbound emails from SendGrid/Mailgun.
 * This is NOT protected by auth — it uses a webhook secret instead.
 *
 * SendGrid Inbound Parse format:
 * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
emailRouter.post("/inbound", async (req, res, next) => {
  try {
    // Verify webhook secret
    const secret = req.headers["x-webhook-secret"];
    if (
      process.env.INBOUND_EMAIL_WEBHOOK_SECRET &&
      secret !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET
    ) {
      return next(createError("Unauthorized webhook", 401));
    }

    const bodySchema = z.object({
      from: z.string(),
      subject: z.string().optional(),
      text: z.string().optional(),
      html: z.string().optional(),
      headers: z.string().optional(), // For threading
    });

    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      return next(createError("Invalid webhook payload", 400));
    }

    const { from, subject, text, html, headers } = result.data;

    // Parse sender from "Name <email@example.com>" format
    const emailMatch = from.match(/^(?:(.+?)\s+)?<?([^\s<>]+@[^\s<>]+)>?$/);
    const fromName = emailMatch?.[1]?.trim() || from;
    const fromEmail = emailMatch?.[2]?.trim() || from;

    // Extract thread ID from In-Reply-To header for email threading
    let emailThread: string | undefined;
    if (headers) {
      const inReplyTo = headers.match(/In-Reply-To:\s*<([^>]+)>/i);
      if (inReplyTo) emailThread = inReplyTo[1];
    }

    // Check if this is a reply to an existing thread
    if (emailThread) {
      const existingTicket = await prisma.ticket.findFirst({
        where: { emailThread },
      });

      if (existingTicket) {
        // Add as a message to the existing ticket
        await prisma.message.create({
          data: {
            ticketId: existingTicket.id,
            body: text || html || "(no body)",
            fromName,
            fromEmail,
            isAgent: false,
          },
        });

        // Reopen if closed/resolved
        if (existingTicket.status !== "OPEN") {
          await prisma.ticket.update({
            where: { id: existingTicket.id },
            data: { status: "OPEN" },
          });
        }

        return res.json({ message: "Reply added to existing ticket", ticketId: existingTicket.id });
      }
    }

    // Create new ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject: subject || "(No subject)",
        body: text || html || "(no body)",
        fromName,
        fromEmail,
        emailThread,
        status: "OPEN",
        category: "GENERAL_QUESTION", // Will be auto-classified
      },
    });

    res.status(201).json({ message: "Ticket created", ticketId: ticket.id });
  } catch (error) {
    next(error);
  }
});
