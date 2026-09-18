import { z } from "zod";

/**
 * Input contract for the item server functions. Every field is parsed from
 * `unknown`; TypeScript annotations alone are not runtime validation.
 */
const idSchema = z.coerce.number().int().positive();
const titleSchema = z.string().trim().min(1).max(200);

export const createItemInput = z.object({ title: titleSchema });
export const itemIdInput = z.object({ id: idSchema });
export const setItemCompletedInput = z.object({ id: idSchema, completed: z.boolean() });

export type Item = {
  id: number;
  title: string;
  completed: boolean;
};
