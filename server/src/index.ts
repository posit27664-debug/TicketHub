// ─── Sentry (must be first) ───────────────────────────────────────────────────
import { initSentry } from "./lib/sentry";
initSentry();

import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { usersRouter } from "./routes/users";
import { ticketsRouter } from "./routes/tickets";
import { aiRouter } from "./routes/ai";
import { emailRouter } from "./routes/email";
import { startImapPolling } from "./lib/imap";
import { startJobQueue } from "./jobs";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import * as Sentry from "@sentry/node";

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

if (process.env.NODE_ENV === "production") {
  app.use("/api/", apiLimiter);
}

// ─── Auth Handler ─────────────────────────────────────────────────────────────
app.all("/api/auth/*", toNodeHandler(auth));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/email", emailRouter);

// ─── Static Client (production only) ─────────────────────────────────────────
// Serves the Vite build output. The catch-all ensures React Router works on
// direct page loads / hard refreshes (e.g. /tickets/123).
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(process.cwd(), "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── Error Handler ────────────────────────────────────────────────────────────
// Sentry must be registered before our custom handler so it can capture errors
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);

  startJobQueue().catch((err) =>
    console.error("Job queue failed to start (non-fatal):", err)
  );

  startImapPolling();
});

export { app };
