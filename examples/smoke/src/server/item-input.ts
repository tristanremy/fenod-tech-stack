import { z } from "zod";

/**
 * Input contract for the item server functions. Every field is parsed from
 * `unknown`; TypeScript annotations alone are not runtime validation.
 */
const idSchema = z.coerce.number().int().positive();
const titleSchema = z.string().trim().min(1).max(200);

export const createItemInput = z.object({ title: titleSchema }).strict();
export const itemIdInput = z.object({ id: idSchema }).strict();
export const setItemCompletedInput = z.object({ id: idSchema, completed: z.boolean() }).strict();

export type Item = {
  id: number;
  title: string;
  completed: boolean;
};
