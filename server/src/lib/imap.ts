import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../db/client";

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let client: ImapFlow | null = null;

function getConfig() {
  const host = process.env.IMAP_HOST;
  const port = Number(process.env.IMAP_PORT) || 993;
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;
  const interval = Number(process.env.IMAP_POLL_INTERVAL) || 60_000;

  if (!host || !user || !pass) {
    return null;
  }
  return { host, port, user, pass, interval };
}

async function poll(): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  try {
    client = new ImapFlow({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 993,
      auth: { user: cfg.user, pass: cfg.pass },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ unseen: true });
      if (uids.length === 0) return;

      for (const uid of uids) {
        try {
          const msg = await client.fetch(uid, { source: true });
          if (!msg?.source) continue;

          const parsed = await simpleParser(msg.source);

          const from = parsed.from?.value?.[0];
          const fromName = from?.name || from?.address || "Unknown";
          const fromEmail = from?.address || fromName;

          const subject = parsed.subject || "(No subject)";
          const text = parsed.text || parsed.html || "(no body)";
          const inReplyTo = parsed.inReplyTo || undefined;

          // threading via In-Reply-To
          let emailThread: string | undefined;
          if (inReplyTo) {
            const tid = inReplyTo.replace(/^</, "").replace(/>$/, "");
            emailThread = tid;

            const existingTicket = await prisma.ticket.findFirst({
              where: { emailThread },
            });

            if (existingTicket) {
              await prisma.message.create({
                data: {
                  ticketId: existingTicket.id,
                  body: text,
                  fromName,
                  fromEmail,
                  isAgent: false,
                },
              });

              if (existingTicket.status !== "OPEN") {
                await prisma.ticket.update({
                  where: { id: existingTicket.id },
                  data: { status: "OPEN" },
                });
              }

              await client.messageFlagsAdd(uid, ["\\Seen"]);
              continue;
            }
          }

          await prisma.ticket.create({
            data: {
              subject,
              body: text,
              fromName,
              fromEmail,
              emailThread,
              status: "OPEN",
              category: "GENERAL_QUESTION",
            },
          });

          await client.messageFlagsAdd(uid, ["\\Seen"]);
        } catch {
          // Skip individual message on error, mark seen to avoid re-processing
          try {
            await client.messageFlagsAdd(uid, ["\\Seen"]);
          } catch {
            // ignore
          }
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
    client = null;
  } catch (err) {
    console.error("[IMAP] Poll error:", err);
    if (client) {
      try {
        await client.logout();
      } catch {
        // ignore
      }
      client = null;
    }
  }
}

async function tick(): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  await poll();

  pollTimer = setTimeout(tick, cfg.interval);
}

export function startImapPolling(): void {
  const cfg = getConfig();
  if (!cfg) {
    console.log("[IMAP] Not configured (IMAP_HOST/IMAP_USER/IMAP_PASS) — skipping");
    return;
  }

  console.log(`[IMAP] Starting polling every ${cfg.interval / 1000}s → ${cfg.user}@${cfg.host}`);
  pollTimer = setTimeout(tick, 5_000); // first poll after 5s
}

export function stopImapPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (client) {
    client.logout().catch(() => {});
    client = null;
  }
  console.log("[IMAP] Stopped");
}
