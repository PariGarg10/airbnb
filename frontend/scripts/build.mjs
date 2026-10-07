import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devPorts = [3000, 3001];

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const finish = (used) => {
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(400);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function devServerOwnsNextDir() {
  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) return false;
  for (const port of devPorts) {
    if (await portInUse(port)) return true;
  }
  return false;
}

const env = { ...process.env, npm_lifecycle_event: "build" };
const distDir = (await devServerOwnsNextDir()) ? ".next-build" : ".next";
if (distDir !== ".next") {
  env.NEXT_DIST_DIR = distDir;
  console.log(
    "Dev server is using .next, so this build writes to .next-build and will not wait on that lock.",
  );
}

const traceFile = path.join(root, distDir, "trace");
if (fs.existsSync(traceFile)) {
  try {
    fs.rmSync(traceFile, { force: true });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "";
    if (code === "EPERM" || code === "EBUSY") {
      console.error(
        `Another build still has ${distDir}\\trace open. Stop that npm run build, then run it again.`,
      );
      process.exit(1);
    }
    throw err;
  }
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
