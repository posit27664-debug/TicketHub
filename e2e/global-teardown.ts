import path from "path";
import fs from "fs";

async function globalTeardown() {
  const pidFile = path.resolve(__dirname, ".server-pid");

  if (fs.existsSync(pidFile)) {
    const pids = JSON.parse(fs.readFileSync(pidFile, "utf-8"));

    for (const [name, pid] of Object.entries(pids)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`--- ${name} stopped ---`);
      } catch {
        console.warn(`Could not stop ${name} (already exited?)`);
      }
    }

    fs.unlinkSync(pidFile);
  }
}

export default globalTeardown;

export default globalTeardown;
