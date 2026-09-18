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

## S4 closure record (2026-09-18)

S4 is **closed with documented limits**, not completed. The owner decided to close
it without creating another token. No Cloudflare resource was created, changed or
deployed. No production credential was used. Fixture mode stays in the starter.

Proven:

| Claim | Evidence |
| --- | --- |
| A real application runs on the dev config | Owner run PASS at `c0816f0`: install, plugin install, schema validation (real length inside Varlock), Worker types, real auth, owned CRUD, isolation, session revocation |
| A revoked service token is rejected | Owner run PASS: HTTP 200 then HTTP 401 with the same in-memory token |
| Failures do not reuse prior values on a new load | `node scripts/doppler-outage-check.mjs`: 9 cases × success → failure → recovery (27 loads) |
| Distinct failure reasons are preserved | Same run: network, Ky timeout, invalid JSON, invalid shape, 401, 403, 404, 429, 503, each with per-key errors |
| Invalid configuration is rejected before redaction | `node --test scripts/doppler-app-pilot.test.mjs`: short secret, missing secret, remote origin |
| Failure output reveals nothing useful | Child stdout/stderr discarded; fixed PASS/FAIL lines only; tokenless install; sanitized child environment |
| The internal token stays out of Worker types | App pilot asserts it after `cf-types` |

Not proven, and not claimed:

- **Real expiry.** Tested revocation only; expiry needs a short-lived token.
- **Live wrong-scope access.** 403/404 are synthetic; no token was scoped wrongly.
- **OS isolation.** Same Unix user, same machine. Temporary HOME and OrbStack are
  not security boundaries here.
- **Revocation effect on a running app.** Plugin 2.0.1 memoizes a successful bulk
  response per instance; `@cache=disabled` does not erase loaded values.
- **Quotas and cost.** Doppler plan limits, API call counts and overage are unmeasured.
- **Rotation and cleanup.** BETTER_AUTH_SECRET rotation, token rotation and
  secure erasure of temporary state are untested; deletion is not erasure.
- **Provider status/outage reality.** All transport results are synthetic.
- **Other environments.** Only `fenod-starter-pilot/dev` was involved. No staging,
  production, or Infisical migration.

Reopening any line above needs its own authorization and, for expiry or
wrong-scope, a new disposable token. The earlier 7/7 resolver report stays
partial: no known undeclared canary was present, and a nonzero exit alone does
not distinguish a missing key from an infrastructure failure.

Cloudflare S5 and starter promotion S6 remain unauthorized. Do not remove fixture
mode from the maintained starter.
