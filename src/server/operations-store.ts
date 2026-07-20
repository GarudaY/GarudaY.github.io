import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OperationsStore } from "@/types/operations";
import { operationsStoreSchema } from "@/server/operations-validation";

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
  __hostedOperationsStore?: OperationsStore;
  __operationsWriteQueue?: Promise<unknown>;
};

async function readStoreFile(): Promise<OperationsStore> {
  if (process.env.HOSTED_DEMO === "true") {
    return structuredClone(globalOperations.__hostedOperationsStore ?? emptyStore());
  }

  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = operationsStoreSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error("Local operations storage has an invalid schema.");
    }
    return parsed.data;
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
      item.status !== "resolved" || new Date(item.updatedAt).getTime() >= threshold,
  );
}

async function persistStore(store: OperationsStore) {
  if (process.env.HOSTED_DEMO === "true") {
    globalOperations.__hostedOperationsStore = structuredClone(store);
    return;
  }

  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(temporaryFile, dataFile);
}

export async function readOperationsStore() {
  return readStoreFile();
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
        const store = await readStoreFile();
        pruneExpiredRecords(store);
        const value = await mutator(store);
        const validated = operationsStoreSchema.parse(store);
        await persistStore(validated);
        resolveResult(value);
      } catch (error) {
        rejectResult(error);
      }
    });

  globalOperations.__operationsWriteQueue = next;
  return result;
}
