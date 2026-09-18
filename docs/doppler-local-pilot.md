# Local Doppler development pilot

Experimental S4 procedure, not adoption of Doppler as the repository default.
No GitHub Actions, Docker, deployment or remote D1 is needed for this procedure.

## Authority and limits

The owner supplies a read-only service token for `fenod-starter-pilot/dev` only.
Keep it in a password manager; never paste it into chat or create a token file.
Stop coding agents before the live run. Another terminal, a temporary HOME, or
an OrbStack container controlled by the same user is **not** a security boundary
against that user. Use a separate machine/OS identity if that boundary is required.

The runner uses a disposable committed export, temporary HOME and an allowlisted
child environment. Installation and browser preparation receive no token. Only
configuration/type resolution and the local browser integration test receive it.
These commands execute trusted code capable of reading the token. Do not run
unreviewed revisions with credentials. No production credentials are involved.

## Agent-safe verification

```bash
node --test scripts/doppler-app-pilot.test.mjs scripts/doppler-pilot.test.mjs
node scripts/doppler-app-pilot.mjs --fixture
```

Fixture mode does not read an ambient Doppler token and loads no Doppler plugin.
It tests the app flow, not successful live Doppler resolution. The real Varlock
schema regression test needs installed `examples/smoke` dependencies; otherwise
it is explicitly skipped. It verifies short/missing secrets and remote origins
are rejected before agent-mode output is redacted.

## Owner-run live verification (macOS/Linux)

Prerequisites: Node 24, pinned pnpm, Git, tar, Chromium system dependencies on
Linux, and port 3000 free. The temporary copy installs the pinned Doppler plugin
2.0.1 separately; its transitive dependency resolution is not frozen by the
starter lockfile. Review this limitation before widening the pilot.

Doppler must contain `APP_ENV=dev`, `BETTER_AUTH_URL=http://localhost:3000`, and
a random `BETTER_AUTH_SECRET` of at least 32 characters. The owner reported using
64 characters. **The earlier reported length of 7 was the redaction mask, not
the secret.** Never measure secret length from `varlock load --agent` output.

Execute each step separately in zsh, after stopping coding agents:

1. From the repository directory, run only this line:

   ```zsh
   read -rs 'DOPPLER_TOKEN?Token: '; printf '\n'
   ```

2. Paste the service token into the hidden prompt, then press Enter.
3. Run the app pilot:

   ```zsh
   (export DOPPLER_TOKEN; node scripts/doppler-app-pilot.mjs)
   ```

4. Clear the variable, whether the run passes or fails:

   ```zsh
   unset DOPPLER_TOKEN
   ```

The script validates the actual secret length inside Varlock, generates Worker
types, and runs the existing Playwright test against fresh local D1: signup,
owned CRUD, invalid input, second-user isolation, logout and revoked session.
Playwright owns server startup and refuses to reuse an existing server.

Only fixed step names, mode and source revision are printed. Child stdout/stderr
are discarded rather than heuristically scrubbed. Report the PASS/FAIL lines,
not raw logs, cookies or screenshots. Temporary app/state/artifacts are removed
on normal completion/failure; child process groups are killed on timeout or
handled interruption. Power loss/SIGKILL can leave temporary state; removal is
not secure erasure. Plugin cache is disabled; this does not certify revocation,
provider outage, encrypted CLI fallback behavior, or host isolation.

## Owner-run token revocation check

Only revoke the disposable pilot service token; do not revoke shared credentials.
Revocation is irreversible. This script performs **no mutation**: the owner
chooses the exact token in the dashboard and revokes it manually.

After stopping coding agents, enter the token using the separate hidden prompt
above, then run:

```zsh
(export DOPPLER_TOKEN; node scripts/doppler-revocation.mjs)
```

The script first requires HTTP 200 from Doppler's read-only
[`GET /v3/me`](https://docs.doppler.com/reference/auth-me). It does not retrieve
application secrets or parse the response body. Only after that positive control
does it ask you to revoke the supplied pilot token in the dashboard. Type
`REVOKED` in the script's prompt after the manual action. It reuses the same
in-memory token and accepts only HTTP 401 as the post-revocation result. HTTP
403, redirects, rate limits, server errors and network failures are inconclusive,
not success. Each request times out after 15 seconds; the prompt after 10 minutes.

Finally, whether it passes or fails:

```zsh
unset DOPPLER_TOKEN
```

No client cache, token file, new dependency or CI run is involved. This tests
Doppler token rejection, **not** Varlock/plugin cache fallback or the validity
of already retrieved application secrets. Revoking a service token does not
rotate BETTER_AUTH_SECRET or erase previously retrieved values. Those remain
separate checks. Do not replace the token mid-test or count an initially rejected
token as successful revocation evidence.

## Synthetic outage and recovery integration check

```bash
node scripts/doppler-outage-check.mjs
```

Installs Varlock 1.19.0 and Doppler plugin 2.0.1 in a temporary directory with
an allowlisted environment and empty HOME. Package installation needs registry
access; the actual checks do not use the network. The test preload replaces
fetch, checks the expected API URL and synthetic authorization, and rejects
real socket connections. No ambient credential is read or forwarded.

For each case, the real CLI loads successfully, fails for the expected reason,
then recovers, retaining the same schema/directory/HOME between child processes:
network rejection, the real Ky 10-second timeout, malformed JSON, invalid JSON
shape, HTTP 401, HTTP 403, HTTP 404, HTTP 429 and HTTP 503. Every negative result
must reach the fake transport, have per-key errors, return no previous values,
and exit nonzero. A killed/timed-out test process is not counted as a passing
failure case. Transient statuses (429/503) must be retried, and the timeout must
come from the client's real timer rather than a fabricated error.

This checks **fresh loader processes with `cacheTtl=false` and `@cache=disabled`**,
not cache-enabled behavior or refresh inside an already running Worker. Plugin
2.0.1 still memoizes its successful bulk request within an instance, irrespective
of persistent cache settings. Disabling persistent caching does not erase loaded
values or make application credentials refresh automatically. Do not claim that
revoking a Doppler token terminates an already running application's sessions.

## Evidence boundary

The owner reported 7/7 for the earlier resolver harness. This is partial evidence:
key absence without a known undeclared canary does not prove filtering, and a
nonzero exit alone does not distinguish missing-key errors from infrastructure
failure. No S4 completion claim follows from that report.

The owner reported a live app pilot PASS at `c0816f05c772be7c3dfedc8f4c515035aa63e67d`:
schema validation, Worker types, real auth, owned CRUD, isolation and session
revocation. Session revocation is not Doppler service-token revocation.
The owner also reported a successful token lifecycle check: HTTP 200 before
manual revocation, HTTP 401 afterwards with the same in-memory service token.
Synthetic outage/recovery covers new loader processes only. Real expiry,
wrong-config scope, cleanup/rotation, isolation and quota/cost evidence remain
separate S4 checks. Cloudflare S5 still needs
separate authorization. Do not remove fixture mode from the maintained starter.
