import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";

export const aiRouter = Router();

aiRouter.use(requireAuth);

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
    const schema = z.object({ ticketId: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) return next(createError(result.error.errors[0].message, 400));

    const ticket = await prisma.ticket.findUnique({
      where: { id: result.data.ticketId },
    });
    if (!ticket) return next(createError("Ticket not found", 404));

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `Classify the following support ticket into exactly one of these categories:
- GENERAL_QUESTION
- TECHNICAL_QUESTION
- REFUND_REQUEST

Respond with ONLY the category name, nothing else.

Subject: ${ticket.subject}
Body: ${ticket.body}`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const categoryText = data.response.trim();
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

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `Summarize this support ticket in 2-3 sentences. Be concise and focus on the core issue and current status.

Subject: ${ticket.subject}
Body: ${ticket.body}
${conversationHistory ? `\nConversation:\n${conversationHistory}` : ""}`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const summary = data.response.trim();

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

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `You are a helpful customer support agent. Use the knowledge base below to craft accurate, empathetic, and professional replies. Always be warm and solution-focused.

Knowledge Base:
${knowledgeBase}

Write a helpful reply to this support ticket. Address the customer's concern directly.

Subject: ${ticket.subject}
Body: ${ticket.body}
${conversationHistory ? `\nPrevious conversation:\n${conversationHistory}` : ""}

Write only the reply body, no subject line or salutation needed.`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const suggestedReply = data.response.trim();

    const updated = await prisma.ticket.update({
      where: { id: result.data.ticketId },
      data: { aiSuggestedReply: suggestedReply },
    });

    res.json({ ticket: updated, suggestedReply });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/ai/polish-reply ──────────────────────────────────────────────
aiRouter.post("/polish-reply", async (req, res, next) => {
  try {
    const schema = z.object({ body: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return next(createError(result.error.errors[0].message, 400));

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `You are a writing assistant that polishes agent replies. Improve clarity, professionalism, and tone. Fix grammar and spelling. Keep the same intent and information. Return only the polished text, no explanations.

${result.data.body}`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const polished = data.response.trim();

    res.json({ polished });
  } catch (error) {
    next(error);
  }
});
