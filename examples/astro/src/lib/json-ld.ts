import type { Thing, WithContext } from "schema-dts";

// Script contents are raw text, not HTML entities. Unicode escapes preserve JSON values.
export function serializeJsonLd(data: WithContext<Thing>): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
