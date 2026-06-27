import { PgBoss } from "pg-boss";
import { prisma } from "../db/client";
import { sendReply } from "../lib/sendgrid";

const VALID_CATEGORIES = ["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"];

const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on("error", (err: unknown) => console.error("[pg-boss]", err));

export async function startJobQueue() {
  await boss.start();
  console.log("  Jobs: pg-boss connected");

  await boss.createQueue("classify-ticket");
  await boss.createQueue("auto-resolve");

  await boss.work("classify-ticket", async (jobs) => {
    const { id, subject, body } = jobs[0].data as {
      id: string;
      subject: string;
      body: string;
    };

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

Subject: ${subject}
Body: ${body}`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const category = data.response.trim();

    if (VALID_CATEGORIES.includes(category)) {
      await prisma.ticket.update({
        where: { id },
        data: { category: category as "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST" },
      });
    }
  });

  await boss.work("auto-resolve", async (jobs) => {
    const { id, subject, body } = jobs[0].data as {
      id: string;
      subject: string;
      body: string;
    };

    await prisma.ticket.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    const entries = await prisma.knowledgeBase.findMany({
      select: { title: true, content: true },
    });
    const knowledgeBase = entries.map((e) => `## ${e.title}\n${e.content}`).join("\n\n");

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        prompt: `You are a support agent. Use the knowledge base below to answer the customer's question.

Knowledge Base:
${knowledgeBase}

Customer question:
Subject: ${subject}
Body: ${body}

If the knowledge base contains enough information to fully answer this question, respond with ONLY the answer (as a helpful, professional reply). Do NOT include any preamble, subject line, or salutation.

If the knowledge base does NOT have enough information to answer, respond with exactly: NO_ANSWER_AVAILABLE`,
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    const data = await ollamaRes.json();
    const answer = data.response.trim();

    if (answer === "NO_ANSWER_AVAILABLE") {
      await prisma.ticket.update({
        where: { id },
        data: { status: "OPEN" },
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { fromEmail: true, emailThread: true, subject: true },
    });

    const now = new Date();
    await prisma.message.create({
      data: {
        ticketId: id,
        body: answer,
        fromName: "AI Support Bot",
        fromEmail: "ai-support@tickethub.com",
        isAgent: true,
        sentAt: now,
      },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: "RESOLVED" },
    });

    // Send AI reply via email if ticket came from email
    if (ticket?.fromEmail) {
      sendReply({
        to: ticket.fromEmail,
        subject: ticket.subject,
        body: answer,
        emailThread: ticket.emailThread,
      }).catch((err) => console.error("[SendGrid] Failed to send AI reply:", err));
    }
  });
}

export async function enqueueClassifyTicket(id: string, subject: string, body: string) {
  await boss.send("classify-ticket", { id, subject, body });
}

export async function enqueueAutoResolve(id: string, subject: string, body: string) {
  await boss.send("auto-resolve", { id, subject, body });
}

export { boss };
