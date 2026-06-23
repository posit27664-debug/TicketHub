import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(ROOT, "server", ".env.test");
const PID_FILE = path.join(ROOT, "e2e", ".server-pid");

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1).replace(/^"(.*)"$/, "$1");
  }
  return vars;
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function globalSetup() {
  const envVars = parseEnvFile(ENV_FILE);

  console.log("\n--- Global Setup: Test Database ---");
  execSync("bash scripts/setup-test-db.sh", { cwd: ROOT, stdio: "inherit" });

  console.log("\n--- Global Setup: Starting API Server (port 3001) ---");
  const server = spawn("bun", ["src/index.ts"], {
    cwd: path.join(ROOT, "server"),
    env: { ...process.env, ...envVars },
    stdio: "pipe",
  });

  server.stdout?.on("data", (d) => process.stdout.write(`[server] ${d}`));
  server.stderr?.on("data", (d) => process.stderr.write(`[server] ${d}`));

  const port = envVars.PORT || "3001";
  await waitForServer(`http://localhost:${port}/health`);

  console.log("\n--- Global Setup: Starting Client (port 5173) ---");
  const client = spawn("bun", ["run", "dev"], {
    cwd: path.join(ROOT, "client"),
    stdio: "pipe",
  });

  client.stdout?.on("data", (d) => process.stdout.write(`[client] ${d}`));
  client.stderr?.on("data", (d) => process.stderr.write(`[client] ${d}`));

  await waitForServer("http://localhost:5173");

  fs.writeFileSync(PID_FILE, JSON.stringify({ server: server.pid, client: client.pid }));
  console.log("--- Global Setup: Complete ---\n");
}

export default globalSetup;
