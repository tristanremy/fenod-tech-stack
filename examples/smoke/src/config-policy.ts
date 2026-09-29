const allowedLocalConfigFiles = new Set([".env.schema", ".env.example", ".dev.vars.example"]);

export function findLocalConfigConflicts(names: Iterable<string>) {
  return Array.from(names).filter(
    (name) =>
      (name.startsWith(".env") || name.startsWith(".dev.vars")) &&
      !allowedLocalConfigFiles.has(name),
  );
}
