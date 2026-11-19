import { spawn } from "node:child_process";
import { createServer as netServer } from "node:net";
import { createServer as httpServer } from "node:http";
import {
  readFile,
  appendFile,
  mkdir,
  open,
  unlink,
  rename,
  stat,
  readdir,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";
import { sanitizeLog } from "./finance-log.mjs";
const require = createRequire(import.meta.url);
const { parse } = require("dotenv");
const root = fileURLToPath(new URL("../", import.meta.url));
const runtime = `${root}.local/helios-dev`,
  pidFile = `${runtime}/api.pid.json`,
  logFile = `${runtime}/api.log`;
const command = process.argv[2] || "run";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function metadata() {
  try {
    return JSON.parse(await readFile(pidFile, "utf8"));
  } catch {
    return null;
  }
}
async function control(path) {
  const m = await metadata();
  if (!m?.controlPort || !m?.controlToken) return null;
  try {
    const response = await fetch(`http://127.0.0.1:${m.controlPort}/${path}`, {
      method: path === "status" ? "GET" : "POST",
      headers: { Authorization: `Bearer ${m.controlToken}` },
      signal: AbortSignal.timeout(2000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}
async function portAvailable() {
  return new Promise((resolve) => {
    const server = netServer();
    server.once("error", () => resolve(false));
    server.listen(3003, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}
async function ready() {
  try {
    return (
      await fetch("http://127.0.0.1:3003/finance/capabilities", {
        signal: AbortSignal.timeout(1000),
      })
    ).ok;
  } catch {
    return false;
  }
}
await mkdir(runtime, { recursive: true, mode: 0o700 });
if (command === "logs") {
  try {
    console.log(
      (await readFile(logFile, "utf8")).split("\n").slice(-80).join("\n"),
    );
  } catch {
    console.log("No managed API log yet.");
  }
} else if (command === "status") {
  console.log(
    JSON.stringify({
      managed: !!(await control("status")),
      ready: await ready(),
      log: logFile,
      ...((await control("status")) || {}),
    }),
  );
} else if (command === "stop") {
  console.log(
    (await control("stop"))
      ? "Managed API shutdown requested."
      : "Managed API control channel is not running; no unrelated process was stopped.",
  );
} else if (command === "restart") {
  console.log(
    (await control("restart"))
      ? "Managed API restart requested."
      : "Managed API control channel is not running.",
  );
} else if (command === "start") {
  if (await control("status")) {
    console.log("Managed API is already running.");
    process.exit(0);
  }
  if (!(await portAvailable()))
    throw new Error(
      "Port 3003 is occupied; no duplicate API was started. Stop only the verified existing Helios server first.",
    );
  const child = spawn(
    process.execPath,
    [fileURLToPath(import.meta.url), "run"],
    { cwd: root, env: process.env, detached: true, stdio: "ignore" },
  );
  child.unref();
  for (let i = 0; i < 100; i++) {
    await delay(150);
    if (await control("status")) {
      console.log(`Managed polling watcher started. Logs: ${logFile}`);
      process.exit(0);
    }
  }
  throw new Error("Managed API did not start. Check the local API log.");
} else if (command === "run") {
  if (await control("status"))
    throw new Error("Managed API is already running.");
  if (!(await portAvailable()))
    throw new Error("Port 3003 is occupied; no duplicate API started.");
  // A stale PID file carries no authority to signal a process. Reclaim only when no control server or API listener exists.
  await unlink(pidFile).catch(() => undefined);
  const lock = await open(pidFile, "wx", 0o600);
  let serial = Promise.resolve();
  const log = (line) => {
    serial = serial.then(async () => {
      try {
        if ((await stat(logFile)).size > 5 * 1024 * 1024)
          await rename(logFile, `${logFile}.1`);
      } catch {}
      await appendFile(logFile, `${new Date().toISOString()} ${line}\n`, {
        mode: 0o600,
      });
    });
  };
  let child = null,
    stopping = false,
    cycling = false,
    restarts = 0,
    pending = false;
  const secrets = new Set();
  async function loadSecrets() {
    for (const name of [".env", ".env.finance.local"]) {
      try {
        const values = parse(await readFile(`${root}packages/api/${name}`));
        for (const [k, v] of Object.entries(values))
          if (
            /SECRET|TOKEN|PASSWORD|KEY|CLIENT_ID|DATABASE_URL/.test(k) &&
            v.length >= 6
          )
            secrets.add(v);
      } catch {}
    }
  }
  async function launch() {
    await loadSecrets();
    child = spawn(
      process.execPath,
      [`${root}scripts/finance-command.mjs`, "start"],
      {
        cwd: root,
        env: { ...process.env, NO_COLOR: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    log(`[manager] API process launched; restart count ${restarts}.`);
    for (const stream of [child.stdout, child.stderr])
      createInterface({ input: stream }).on("line", (line) => {
        const safe = sanitizeLog(line, [...secrets]);
        if (safe) log(safe);
      });
    child.on("error", () => log("[manager] API process failed to spawn."));
    child.on("exit", (code) => {
      log(
        `[manager] API process exited (${code ?? "signal"}); waiting for a watched change or restart command.`,
      );
    });
  }
  async function stopChild() {
    const running = child;
    if (!running || running.exitCode !== null || running.signalCode !== null)
      return;
    await new Promise((resolve) => {
      running.once("close", resolve);
      running.kill("SIGTERM");
    });
  }
  async function restart() {
    if (stopping) return;
    if (cycling) {
      pending = true;
      return;
    }
    cycling = true;
    try {
      log(
        "[manager] Restarting API after source/environment change or explicit request.",
      );
      await stopChild();
      if (!stopping) {
        restarts++;
        await launch();
      }
    } finally {
      cycling = false;
      if (pending) {
        pending = false;
        void restart();
      }
    }
  }
  async function signature() {
    const entries = [];
    async function visit(path) {
      try {
        const s = await stat(path);
        if (s.isDirectory()) {
          for (const name of (await readdir(path)).sort())
            await visit(`${path}/${name}`);
        } else if (/\.(ts|js|json)$/.test(path) || path.includes("/.env"))
          entries.push(`${path}:${s.size}:${s.mtimeMs}`);
      } catch {
        entries.push(`${path}:missing`);
      }
    }
    for (const path of [
      "packages/api/src",
      "packages/api/.env",
      "packages/api/.env.finance.local",
      "packages/api/tsconfig.json",
      "scripts/finance-command.mjs",
    ])
      await visit(`${root}${path}`);
    return entries.join("|");
  }
  const token = randomBytes(32).toString("hex");
  const server = httpServer((req, res) => {
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401);
      res.end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/status" && req.method === "GET") {
      res.end(
        JSON.stringify({
          watchMode: "polling",
          restarts,
          apiChildRunning:
            !!child && child.exitCode === null && child.signalCode === null,
        }),
      );
    } else if (req.url === "/restart" && req.method === "POST") {
      res.end(JSON.stringify({ accepted: true }));
      void restart();
    } else if (req.url === "/stop" && req.method === "POST") {
      res.end(JSON.stringify({ accepted: true }));
      void stop();
    } else {
      res.writeHead(404);
      res.end("{}");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await lock.writeFile(
    JSON.stringify({
      pid: process.pid,
      kind: "helios-finance-dev",
      controlPort: server.address().port,
      controlToken: token,
    }),
  );
  await lock.close();
  let previous = await signature(),
    checking = false;
  const timer = setInterval(async () => {
    if (checking || stopping) return;
    checking = true;
    try {
      const next = await signature();
      if (next !== previous) {
        previous = next;
        await restart();
      }
    } finally {
      checking = false;
    }
  }, 750);
  async function stop() {
    if (stopping) return;
    stopping = true;
    clearInterval(timer);
    log("[manager] API polling watcher stopping.");
    await stopChild();
    server.close();
    await serial;
    const current = await metadata();
    if (current?.pid === process.pid)
      await unlink(pidFile).catch(() => undefined);
  }
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
  log(
    "[manager] Polling source and server environment files; logs are excluded from watched paths.",
  );
  await launch();
} else throw new Error("Use start, run, stop, restart, status or logs");
