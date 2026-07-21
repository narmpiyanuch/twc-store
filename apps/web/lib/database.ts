export type InventoryRecord = {
  id: string;
  category: "bottle" | "cap" | "tank" | "glass";
  brand?: string;
  name: string;
  detail: string;
  quantity: number;
  unit: string;
  color?: string;
};

export type OemRecord = { id: string; name: string; quantity: number; updatedAt: string };

const DB_NAME = "insight-taweechai";
const DB_VERSION = 1;

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("inventory")) db.createObjectStore("inventory", { keyPath: "id" });
    if (!db.objectStoreNames.contains("oem")) db.createObjectStore("oem", { keyPath: "id" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export async function readAll<T>(storeName: "inventory" | "oem"): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecord<T>(storeName: "inventory" | "oem", value: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveMany<T>(storeName: "inventory" | "oem", values: T[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    values.forEach(value => store.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteRecord(storeName: "inventory" | "oem", id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
