import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";

import { getDb } from "#/db/index";
import { todos } from "#/db/schema";

const getTodos = createServerFn({
  method: "GET",
}).handler(async () => {
  const db = getDb();
  return await db.query.todos.findMany({
    orderBy: [desc(todos.createdAt)],
  });
});

const createTodo = createServerFn({
  method: "POST",
})
  .validator((data: { title: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    await db.insert(todos).values({ title: data.title });
    return { success: true };
  });

export const Route = createFileRoute("/demo/drizzle")({
  component: DemoDrizzle,
  loader: async () => await getTodos(),
});

function DemoDrizzle() {
  const router = useRouter();
  const rows = Route.useLoaderData();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    if (!title) return;

    try {
      await createTodo({ data: { title } });
      router.invalidate();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-2xl">
        <header className="mb-8">
          <p className="island-kicker mb-2">Database</p>
          <h1 className="demo-title">Drizzle + D1</h1>
        </header>

        <ul className="mb-6 space-y-3">
          {rows.map((todo) => (
            <li key={todo.id} className="demo-list-item">
              <span className="font-medium">{todo.title}</span>
              <span className="demo-muted text-xs">#{todo.id}</span>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="demo-list-item demo-muted text-center">No todos yet.</li>
          )}
        </ul>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            name="title"
            placeholder="Add a todo..."
            className="demo-input min-w-0 flex-1"
          />
          <button type="submit" className="demo-button whitespace-nowrap">
            Add
          </button>
        </form>
      </section>
    </main>
  );
}
