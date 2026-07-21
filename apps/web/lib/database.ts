import { supabase } from "@/lib/supabase";

export type InventoryRecord = { id: string; category: "bottle" | "cap" | "tank" | "glass"; brand?: string; name: string; detail: string; quantity: number; unit: string; color?: string };
export type OemRecord = { id: string; name: string; quantity: number; updatedAt: string };
export type SupplierRecord = { id: string; factoryId: string; sizeMl: number; pricePerBottle: number; bottlesPerPack: number; updatedAt: string };
export type SupplierFactory = { id: string; name: string; createdAt: string; updatedAt: string };
export type SupplierLog = { id: string; supplierId: string; factory: string; action: "created" | "updated" | "deleted"; summary: string; createdAt: string };
export type StoreName = "inventory" | "oem" | "suppliers" | "supplierFactories" | "supplierLogs";

const tables: Record<StoreName, string> = {
  inventory: "inventory",
  oem: "oem",
  suppliers: "suppliers",
  supplierFactories: "supplier_factories",
  supplierLogs: "supplier_logs",
};

const toDatabase = (store: StoreName, value: unknown) => {
  const item = value as Record<string, unknown>;
  if (store === "oem") return { id: item.id, name: item.name, quantity: item.quantity, updated_at: item.updatedAt };
  if (store === "suppliers") return { id: item.id, factory_id: item.factoryId, size_ml: item.sizeMl, price_per_bottle: item.pricePerBottle, bottles_per_pack: item.bottlesPerPack, updated_at: item.updatedAt };
  if (store === "supplierFactories") return { id: item.id, name: item.name, created_at: item.createdAt, updated_at: item.updatedAt };
  if (store === "supplierLogs") return { id: item.id, supplier_id: item.supplierId, factory: item.factory, action: item.action, summary: item.summary, created_at: item.createdAt };
  return item;
};

const fromDatabase = (store: StoreName, value: Record<string, unknown>) => {
  if (store === "oem") return { id: value.id, name: value.name, quantity: value.quantity, updatedAt: value.updated_at };
  if (store === "suppliers") return { id: value.id, factoryId: value.factory_id, sizeMl: value.size_ml, pricePerBottle: Number(value.price_per_bottle), bottlesPerPack: value.bottles_per_pack, updatedAt: value.updated_at };
  if (store === "supplierFactories") return { id: value.id, name: value.name, createdAt: value.created_at, updatedAt: value.updated_at };
  if (store === "supplierLogs") return { id: value.id, supplierId: value.supplier_id, factory: value.factory, action: value.action, summary: value.summary, createdAt: value.created_at };
  return value;
};

export async function readAll<T>(store: StoreName): Promise<T[]> {
  const { data, error } = await supabase.from(tables[store]).select("*");
  if (error) throw error;
  return (data ?? []).map(value => fromDatabase(store, value)) as T[];
}

export async function saveRecord<T>(store: StoreName, value: T): Promise<void> {
  const { error } = await supabase.from(tables[store]).upsert(toDatabase(store, value));
  if (error) throw error;
}

export async function saveMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (!values.length) return;
  const { error } = await supabase.from(tables[store]).upsert(values.map(value => toDatabase(store, value)));
  if (error) throw error;
}

export async function deleteRecord(store: StoreName, id: string): Promise<void> {
  const { error } = await supabase.from(tables[store]).delete().eq("id", id);
  if (error) throw error;
}
