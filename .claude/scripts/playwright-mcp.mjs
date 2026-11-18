// npm launchers are .cmd shims on Windows, which Claude's stdio runner can fail to start.
// All arguments below are fixed. The command accepts only MCP's stdin/stdout.
import { spawn } from "node:child_process";

const packageSpec = "@playwright/mcp@0.0.85";
const browserArgs = ["--headless", "--isolated", "--allowed-origins", "http://localhost:*;http://127.0.0.1:*"];
const npmArgs = ["--yes", packageSpec, ...browserArgs];
const windows = process.platform === "win32";
const child = windows
  ? spawn("cmd.exe", ["/d", "/c", "npx.cmd", ...npmArgs], { stdio: "inherit" })
  : spawn("npx", npmArgs, { stdio: "inherit" });

child.once("error", () => {
  console.error("Could not start the pinned Playwright MCP package.");
  process.exitCode = 1;
});
child.once("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
