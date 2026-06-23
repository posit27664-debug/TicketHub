import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { usersRouter } from "./routes/users";
import { ticketsRouter } from "./routes/tickets";
import { aiRouter } from "./routes/ai";
import { emailRouter } from "./routes/email";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

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

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});

export { app };
