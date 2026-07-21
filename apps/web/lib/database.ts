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

export type SupplierRecord = {
  id: string;
  factory: string;
  sizeMl: number;
  pricePerBottle: number;
  bottlesPerPack: number;
  updatedAt: string;
};

export type SupplierLog = {
  id: string;
  supplierId: string;
  factory: string;
  action: "created" | "updated" | "deleted";
  summary: string;
  createdAt: string;
};

export type StoreName = "inventory" | "oem" | "suppliers" | "supplierLogs";

const DB_NAME = "insight-taweechai";
const DB_VERSION = 2;

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("inventory")) db.createObjectStore("inventory", { keyPath: "id" });
    if (!db.objectStoreNames.contains("oem")) db.createObjectStore("oem", { keyPath: "id" });
    if (!db.objectStoreNames.contains("suppliers")) db.createObjectStore("suppliers", { keyPath: "id" });
    if (!db.objectStoreNames.contains("supplierLogs")) db.createObjectStore("supplierLogs", { keyPath: "id" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export async function readAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecord<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveMany<T>(storeName: StoreName, values: T[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    values.forEach(value => store.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
