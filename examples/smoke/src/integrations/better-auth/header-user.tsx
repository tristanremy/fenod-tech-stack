import { Link } from "@tanstack/react-router";

import { authClient } from "#/lib/auth-client";

/** Session mirror for the header. Sign-out lives with the data it clears. */
export default function SessionIndicator() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-[var(--chip-bg)]" />;
  }

  if (session?.user) {
    return (
      <span className="max-w-40 truncate text-sm text-[var(--sea-ink-soft)]">
        {session.user.email}
      </span>
    );
  }

  return (
    <Link
      to="/"
      className="inline-flex h-9 items-center rounded-md border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-medium text-[var(--sea-ink)] no-underline"
    >
      Sign in
    </Link>
  );
}
