import type { Category, Product, ProductPriceView } from "@/lib/contracts";

const DB_NAME = "hp-customer-ordering-catalog-v1";
const DB_VERSION = 1;
const PRODUCT_STORE = "products";
const META_STORE = "meta";
const USER_INDEX = "userId";

interface ProductRecord {
  cacheKey: string;
  userId: string;
  variantId: string;
  product: Product;
}

interface MetaRecord {
  userId: string;
  cursor: string | null;
  categories: Category[];
  updatedAt: string;
}

export interface CatalogSnapshot {
  cursor: string | null;
  products: Product[];
  categories: Category[];
  updatedAt: string | null;
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("INDEXED_DB_REQUEST_FAILED"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("INDEXED_DB_TRANSACTION_ABORTED"));
    transaction.onerror = () => reject(transaction.error ?? new Error("INDEXED_DB_TRANSACTION_FAILED"));
  });
}

async function openCatalogDb(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return null;
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
      const store = db.createObjectStore(PRODUCT_STORE, { keyPath: "cacheKey" });
      store.createIndex(USER_INDEX, USER_INDEX, { unique: false });
    }
    if (!db.objectStoreNames.contains(META_STORE)) {
      db.createObjectStore(META_STORE, { keyPath: "userId" });
    }
  };
  return requestResult(request);
}

function cacheKey(userId: string, variantId: string): string {
  return `${userId}:${variantId}`;
}

async function deleteUserProducts(store: IDBObjectStore, userId: string): Promise<void> {
  const index = store.index(USER_INDEX);
  await new Promise<void>((resolve, reject) => {
    const cursorRequest = index.openCursor(IDBKeyRange.only(userId));
    cursorRequest.onerror = () => reject(cursorRequest.error ?? new Error("INDEXED_DB_CURSOR_FAILED"));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
  });
}

export async function readCatalogSnapshot(userId: string): Promise<CatalogSnapshot> {
  const db = await openCatalogDb();
  if (!db) return { cursor: null, products: [], categories: [], updatedAt: null };
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], "readonly");
    const productStore = transaction.objectStore(PRODUCT_STORE);
    const metaStore = transaction.objectStore(META_STORE);
    const [records, meta] = await Promise.all([
      requestResult(productStore.index(USER_INDEX).getAll(IDBKeyRange.only(userId))) as Promise<ProductRecord[]>,
      requestResult(metaStore.get(userId)) as Promise<MetaRecord | undefined>,
    ]);
    await transactionDone(transaction);
    return {
      cursor: meta?.cursor ?? null,
      products: records.map((record) => ({
        ...record.product,
        aliases: [...record.product.aliases],
        price: { ...record.product.price },
      })),
      categories: (meta?.categories ?? []).map((category) => ({ ...category })),
      updatedAt: meta?.updatedAt ?? null,
    };
  } finally {
    db.close();
  }
}

export async function applyCatalogSync(
  userId: string,
  input: {
    cursor: string;
    full: boolean;
    upserts: Product[];
    removeVariantIds: string[];
    categories: Category[];
  },
): Promise<void> {
  const db = await openCatalogDb();
  if (!db) return;
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], "readwrite");
    const productStore = transaction.objectStore(PRODUCT_STORE);
    if (input.full) await deleteUserProducts(productStore, userId);
    for (const product of input.upserts) {
      const variantId = product.variantId?.trim();
      if (!variantId) continue;
      productStore.put({
        cacheKey: cacheKey(userId, variantId),
        userId,
        variantId,
        product: {
          ...product,
          aliases: [...product.aliases],
          price: { ...product.price },
        },
      } satisfies ProductRecord);
    }
    for (const variantId of input.removeVariantIds) {
      productStore.delete(cacheKey(userId, variantId));
    }
    transaction.objectStore(META_STORE).put({
      userId,
      cursor: input.cursor,
      categories: input.categories.map((category) => ({ ...category })),
      updatedAt: new Date().toISOString(),
    } satisfies MetaRecord);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function updateCatalogPrices(
  userId: string,
  prices: ReadonlyMap<string, ProductPriceView>,
): Promise<void> {
  if (prices.size === 0) return;
  const db = await openCatalogDb();
  if (!db) return;
  try {
    const transaction = db.transaction(PRODUCT_STORE, "readwrite");
    const store = transaction.objectStore(PRODUCT_STORE);
    for (const [variantId, price] of prices) {
      const key = cacheKey(userId, variantId);
      const record = await requestResult(store.get(key)) as ProductRecord | undefined;
      if (!record) continue;
      store.put({
        ...record,
        product: {
          ...record.product,
          aliases: [...record.product.aliases],
          price: { ...price },
        },
      } satisfies ProductRecord);
    }
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function clearCatalogForUser(userId: string): Promise<void> {
  const db = await openCatalogDb();
  if (!db) return;
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], "readwrite");
    await deleteUserProducts(transaction.objectStore(PRODUCT_STORE), userId);
    transaction.objectStore(META_STORE).delete(userId);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}
