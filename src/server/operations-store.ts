import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OperationsStore } from "@/types/operations";
import { operationsStoreSchema } from "@/server/operations-validation";

type D1RunResult = {
  success: boolean;
  meta?: { changes?: number };
};

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<D1RunResult>;
};

type D1Database = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<unknown[]>;
};

type D1StateRow = {
  revision: number;
  payload: string;
};

const dataDirectory = path.resolve(
  /* turbopackIgnore: true */
  process.env.LOCAL_DATA_DIR?.trim() || path.join(process.cwd(), ".data"),
);
const dataFile = path.join(dataDirectory, "operations.json");

const emptyStore = (): OperationsStore => ({
  version: 1,
  registrations: [],
  contacts: [],
});

const globalOperations = globalThis as typeof globalThis & {
  __operationsWriteQueue?: Promise<unknown>;
  __operationsD1Ready?: Promise<void>;
};

async function getHostedDatabase(): Promise<D1Database | null> {
  if (process.env.HOSTED_DEMO !== "true") return null;

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const context = await getCloudflareContext({ async: true });
  const database = (context.env as typeof context.env & { DB?: D1Database }).DB;
  if (!database) {
    throw new Error("The production DB binding is unavailable.");
  }
  return database;
}

async function ensureHostedDatabase(database: D1Database) {
  globalOperations.__operationsD1Ready ??= (async () => {
    const initialPayload = JSON.stringify(emptyStore());
    const now = new Date().toISOString();
    await database.batch([
      database.prepare(`
        CREATE TABLE IF NOT EXISTS operations_state (
          id INTEGER PRIMARY KEY NOT NULL,
          revision INTEGER DEFAULT 1 NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
      database
        .prepare(
          "INSERT OR IGNORE INTO operations_state (id, revision, payload, updated_at) VALUES (1, 1, ?, ?)",
        )
        .bind(initialPayload, now),
    ]);
  })();

  return globalOperations.__operationsD1Ready;
}

function parseStore(raw: string) {
  const parsed = operationsStoreSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("Operations storage has an invalid schema.");
  }
  return parsed.data;
}

async function readD1State(database: D1Database): Promise<{
  revision: number;
  store: OperationsStore;
}> {
  await ensureHostedDatabase(database);
  const row = await database
    .prepare("SELECT revision, payload FROM operations_state WHERE id = 1")
    .first<D1StateRow>();
  if (!row) throw new Error("The production operations row is unavailable.");
  return { revision: row.revision, store: parseStore(row.payload) };
}

async function readStoreFile(): Promise<OperationsStore> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return parseStore(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyStore();
    }
    throw error;
  }
}

function pruneExpiredRecords(store: OperationsStore) {
  const retentionDays = Math.max(
    1,
    Number.parseInt(process.env.LOCAL_DATA_RETENTION_DAYS ?? "30", 10) || 30,
  );
  const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  store.registrations = store.registrations.filter(
    (item) =>
      item.status !== "cancelled" ||
      new Date(item.cancelledAt ?? item.updatedAt).getTime() >= threshold,
  );
  store.contacts = store.contacts.filter(
    (item) =>
      item.status !== "resolved" ||
      new Date(item.updatedAt).getTime() >= threshold,
  );
}

async function persistStoreFile(store: OperationsStore) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(temporaryFile, dataFile);
}

export async function readOperationsStore() {
  const database = await getHostedDatabase();
  if (database) return (await readD1State(database)).store;
  return readStoreFile();
}

async function updateD1Store<T>(
  database: D1Database,
  mutator: (store: OperationsStore) => T | Promise<T>,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { revision, store } = await readD1State(database);
    pruneExpiredRecords(store);
    const value = await mutator(store);
    const validated = operationsStoreSchema.parse(store);
    const result = await database
      .prepare(
        "UPDATE operations_state SET revision = revision + 1, payload = ?, updated_at = ? WHERE id = 1 AND revision = ?",
      )
      .bind(JSON.stringify(validated), new Date().toISOString(), revision)
      .run();

    if ((result.meta?.changes ?? 0) === 1) return value;
  }

  throw new Error(
    "Concurrent operations storage update could not be committed.",
  );
}

export async function updateOperationsStore<T>(
  mutator: (store: OperationsStore) => T | Promise<T>,
): Promise<T> {
  const previous = globalOperations.__operationsWriteQueue ?? Promise.resolve();
  let resolveResult!: (value: T) => void;
  let rejectResult!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const next = previous
    .catch(() => undefined)
    .then(async () => {
      try {
        const database = await getHostedDatabase();
        if (database) {
          resolveResult(await updateD1Store(database, mutator));
          return;
        }

        const store = await readStoreFile();
        pruneExpiredRecords(store);
        const value = await mutator(store);
        const validated = operationsStoreSchema.parse(store);
        await persistStoreFile(validated);
        resolveResult(value);
      } catch (error) {
        rejectResult(error);
      }
    });

  globalOperations.__operationsWriteQueue = next;
  return result;
}
