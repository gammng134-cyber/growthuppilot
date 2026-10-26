import { Storage } from "./types";

// Next.js bundles the server-components layer separately from route handlers,
// so a plain module-level singleton would be duplicated per layer. Stashing the
// store on globalThis shares one instance across every bundle in the process.
type StoreGlobal = typeof globalThis & {
  __growthpilotStore?: Storage | null;
};

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1" || !process.env.DATABASE_URL;
}

export async function getStore(): Promise<Storage> {
  const g = globalThis as StoreGlobal;
  if (g.__growthpilotStore) return g.__growthpilotStore;
  if (isDemoMode()) {
    const { MemoryStore } = await import("./memory");
    g.__growthpilotStore = new MemoryStore();
  } else {
    const { PgStore } = await import("./pg");
    const store = new PgStore(process.env.DATABASE_URL!);
    await store.connect(process.env.DATABASE_URL!);
    g.__growthpilotStore = store;
  }
  return g.__growthpilotStore;
}
