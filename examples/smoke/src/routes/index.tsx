import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">fenod-smoke</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Law reference app
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          One package. TanStack Start on Workers. Drizzle + D1. Better Auth.
          oRPC. Ultracite. Wrangler. See STACK.md.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/demo/drizzle"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
          >
            Drizzle + D1
          </Link>
          <Link
            to="/demo/better-auth"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
          >
            Better Auth
          </Link>
          <Link
            to="/demo/orpc-todo"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
          >
            oRPC
          </Link>
        </div>
      </section>
    </main>
  );
}
