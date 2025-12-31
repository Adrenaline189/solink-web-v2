// types/source.ts
export const SOURCES = [
  "sharing",
  "farm",
  "node",
  "node_heartbeat",
  "verifier",
  "worker",
  "admin",
  "system",
] as const;

export type Source = (typeof SOURCES)[number];

export function isSource(x: unknown): x is Source {
  return typeof x === "string" && (SOURCES as readonly string[]).includes(x);
}
