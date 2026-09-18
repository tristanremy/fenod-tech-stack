// Owner-run token lifecycle check. No secret retrieval, mutation, cache or dependencies.
import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function tokenStatus(token, request = fetch) {
  try {
    const response = await request("https://api.doppler.com/v3/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    // The body can contain token previews/account metadata. Never parse or print it.
    await response.body?.cancel();
    if (response.status === 200) return "active";
    if (response.status === 401) return "unauthorized";
    return "inconclusive"; // Includes forbidden, wrong endpoint, rate limit and server errors.
  } catch {
    return "inconclusive"; // Never echo exceptions: they may include credentials.
  }
}

export function verdict(before, after) {
  return before === "active" && after === "unauthorized";
}

async function main() {
  const token = process.env.DOPPLER_TOKEN;
  if (!token?.startsWith("dp.st.") || !process.stdin.isTTY) {
    process.stderr.write("STOP: service token and interactive terminal required.\n");
    process.exitCode = 1;
    return;
  }
  const before = await tokenStatus(token);
  if (before !== "active") {
    process.stderr.write("STOP: positive control failed or inconclusive. Do not revoke anything.\n");
    process.exitCode = 1;
    return;
  }
  process.stdout.write("PASS token accepted by Doppler (HTTP 200).\n");
  process.stdout.write("In Doppler: fenod-starter-pilot > dev > Access.\nRevoke ONLY the dedicated pilot token you supplied. This is irreversible.\n");
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const confirmation = await terminal.question("After revoking it, type REVOKED then Enter (anything else cancels): ", {
      signal: AbortSignal.timeout(600_000),
    });
    if (confirmation !== "REVOKED") {
      process.stdout.write("STOP cancelled; no post-revocation claim.\n");
      process.exitCode = 1;
      return;
    }
    // Same in-memory token, no re-entry and no mutable environment lookup.
    const after = await tokenStatus(token);
    if (verdict(before, after)) {
      process.stdout.write("PASS same token rejected by Doppler after manual revocation (HTTP 401).\nNo cache used. Varlock fallback behavior is not tested by this check.\n");
    } else {
      process.stdout.write(after === "active"
        ? "FAIL token still accepted by Doppler.\n"
        : "INCONCLUSIVE: response was not HTTP 401 (network, scope or provider issue possible).\n");
      process.exitCode = 1;
    }
  } finally {
    terminal.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write("STOP interrupted or timed out; no revocation claim.\n");
    process.exitCode = 1;
  });
}
