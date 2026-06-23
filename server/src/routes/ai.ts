import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";

export const aiRouter = Router();

aiRouter.use(requireAuth);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getKnowledgeBase(): Promise<string> {
  const entries = await prisma.knowledgeBase.findMany({
    select: { title: true, content: true },
  });
  return entries.map((e) => `## ${e.title}\n${e.content}`).join("\n\n");
}

// ─── POST /api/ai/classify ────────────────────────────────────────────────────
aiRouter.post("/classify", async (req, res, next) => {
  try {
    const schema = z.object({
      ticketId: z.string(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return next(createError(result.error.errors[0].message, 400));

    const ticket = await prisma.ticket.findUnique({
      where: { id: result.data.ticketId },
    });
    if (!ticket) return next(createError("Ticket not found", 404));

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Classify the following support ticket into exactly one of these categories:
- GENERAL_QUESTION
- TECHNICAL_QUESTION
- REFUND_REQUEST

Respond with ONLY the category name, nothing else.

Subject: ${ticket.subject}
Body: ${ticket.body}`,
        },
      ],
    });

    const categoryText = (
      (message.content[0] as { type: string; text: string }).text ?? ""
    ).trim();
    const validCategories = ["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"];
    const category = validCategories.includes(categoryText)
      ? categoryText
      : "GENERAL_QUESTION";

    const updated = await prisma.ticket.update({
      where: { id: result.data.ticketId },
      data: { category: category as "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST" },
    });

    res.json({ ticket: updated, category });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/ai/summarize ───────────────────────────────────────────────────
aiRouter.post("/summarize", async (req, res, next) => {
  try {
    const schema = z.object({ ticketId: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) return next(createError(result.error.errors[0].message, 400));

    const ticket = await prisma.ticket.findUnique({
      where: { id: result.data.ticketId },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });
    if (!ticket) return next(createError("Ticket not found", 404));

    const conversationHistory = ticket.messages
      .map((m) => `[${m.isAgent ? "Agent" : "Customer"}] ${m.fromName}: ${m.body}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Summarize this support ticket in 2-3 sentences. Be concise and focus on the core issue and current status.

Subject: ${ticket.subject}
Body: ${ticket.body}
${conversationHistory ? `\nConversation:\n${conversationHistory}` : ""}`,
        },
      ],
    });

    const summary = (message.content[0] as { type: string; text: string }).text.trim();

    const updated = await prisma.ticket.update({
      where: { id: result.data.ticketId },
      data: { aiSummary: summary },
    });

    res.json({ ticket: updated, summary });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/ai/suggest-reply ───────────────────────────────────────────────
aiRouter.post("/suggest-reply", async (req, res, next) => {
  try {
    const schema = z.object({ ticketId: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) return next(createError(result.error.errors[0].message, 400));

    const ticket = await prisma.ticket.findUnique({
      where: { id: result.data.ticketId },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });
    if (!ticket) return next(createError("Ticket not found", 404));

    const knowledgeBase = await getKnowledgeBase();
    const conversationHistory = ticket.messages
      .map((m) => `[${m.isAgent ? "Agent" : "Customer"}] ${m.fromName}: ${m.body}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      system: `You are a helpful customer support agent. Use the knowledge base below to craft accurate, empathetic, and professional replies. Always be warm and solution-focused.

Knowledge Base:
${knowledgeBase}`,
      messages: [
        {
          role: "user",
          content: `Write a helpful reply to this support ticket. Address the customer's concern directly.

Subject: ${ticket.subject}
Body: ${ticket.body}
${conversationHistory ? `\nPrevious conversation:\n${conversationHistory}` : ""}

Write only the reply body, no subject line or salutation needed.`,
        },
      ],
    });

    const suggestedReply = (
      message.content[0] as { type: string; text: string }
    ).text.trim();

    const updated = await prisma.ticket.update({
      where: { id: result.data.ticketId },
      data: { aiSuggestedReply: suggestedReply },
    });

    res.json({ ticket: updated, suggestedReply });
  } catch (error) {
    next(error);
  }
});
