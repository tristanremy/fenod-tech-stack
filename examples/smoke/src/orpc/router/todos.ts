import * as z from "zod";

import { authorized, base } from "#/orpc/context";

const todos = [
  { id: 1, name: "Get groceries" },
  { id: 2, name: "Buy a new phone" },
  { id: 3, name: "Finish the project" },
];

export const listTodos = base.input(z.object({})).handler(() => {
  return todos;
});

export const addTodo = base.input(z.object({ name: z.string() })).handler(({ input }) => {
  const newTodo = { id: todos.length + 1, name: input.name };
  todos.push(newTodo);
  return newTodo;
});

export const whoami = authorized.handler(({ context }) => context.session.user);
