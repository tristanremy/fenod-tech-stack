import { useState } from "react";

import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

type Mode = "signIn" | "signUp";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result =
      mode === "signUp"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    // Full reload keeps one source of truth: the server owns the session.
    if (result.error) {
      setError(result.error.message ?? "Authentication failed.");
      setPending(false);
      return;
    }
    window.location.assign("/");
  };

  return (
    <section className="island-shell mx-auto max-w-md rounded-[2rem] px-6 py-8 sm:px-10">
      <p className="island-kicker mb-2">Better Auth</p>
      <h1 className="display-title mb-2 text-3xl font-bold text-[var(--sea-ink)]">
        {mode === "signUp" ? "Create an account" : "Sign in"}
      </h1>
      <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
        {mode === "signUp"
          ? "Email and password. The session cookie is the only credential the server trusts."
          : "Sign in to reach your own items. Anonymous visitors see no rows."}
      </p>

      <form onSubmit={submit} className="grid gap-4">
        {mode === "signUp" && (
          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Please wait…" : mode === "signUp" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signUp" ? "signIn" : "signUp");
          setError(null);
        }}
        className="mt-4 w-full text-center text-sm text-[var(--sea-ink-soft)] underline-offset-4 hover:underline"
      >
        {mode === "signUp" ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </section>
  );
}
