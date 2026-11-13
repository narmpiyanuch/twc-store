import { supabase } from "@/lib/supabase";

export type InventoryRecord = { id: string; category: "bottle" | "cap" | "tank" | "glass"; brand?: string; name: string; detail: string; quantity: number; unit: string; color?: string };
export type OemFulfillment = "delivery" | "pickup";
export type OemRecord = { id: string; name: string; sizeMl: string; pricePerPack: number; fulfillmentType: OemFulfillment; updatedAt: string };
export type SupplierRecord = { id: string; factoryId: string; sizeMl: number; pricePerBottle: number; bottlesPerPack: number; updatedAt: string };
export type SupplierFactory = { id: string; name: string; createdAt: string; updatedAt: string };
export type SupplierLog = { id: string; supplierId: string; factory: string; action: "created" | "updated" | "deleted"; summary: string; createdAt: string };
export type OemPackPrice = { id: string; sizeLabel: string; tierPacks: number; pricePerPack: number; updatedAt: string };
export type DeliverySetting = { id: string; fuelEfficiency: number; updatedAt: string };
export type OemPriceLog = { id: string; priceId: string; sizeLabel: string; tierPacks: number; oldPrice: number; newPrice: number; createdAt: string };
export type ProductionMaterial = { inventoryId: string; name: string; quantity: number; unit: string };
export type ProductionRevision = { id: string; action: "created" | "updated" | "cancelled"; summary: string; createdAt: string };
export type ProductionRecord = { id: string; productType: "bottled" | "glass"; brand?: string; sizeMl?: string; outputQuantity: number; outputUnit: string; materials: ProductionMaterial[]; note: string; status: "active" | "cancelled"; producedAt: string; createdAt: string; updatedAt: string; revisions: ProductionRevision[] };
export type StoreName = "inventory" | "oem" | "suppliers" | "supplierFactories" | "supplierLogs" | "oemPackPrices" | "deliverySettings" | "oemPriceLogs" | "productions";

const tables: Record<StoreName, string> = {
  inventory: "inventory",
  oem: "oem",
  suppliers: "suppliers",
  supplierFactories: "supplier_factories",
  supplierLogs: "supplier_logs",
  oemPackPrices: "oem_pack_prices",
  deliverySettings: "delivery_settings",
  oemPriceLogs: "oem_price_logs",
  productions: "productions",
};

const toDatabase = (store: StoreName, value: unknown) => {
  const item = value as Record<string, unknown>;
  if (store === "oem") {
    const sizeMl = String(item.sizeMl ?? "");
    const legacySize = Number(sizeMl) || 0;
    return { id: item.id, name: item.name, quantity: legacySize, size_ml: sizeMl || null, price_per_pack: item.pricePerPack, fulfillment_type: item.fulfillmentType, updated_at: item.updatedAt };
  }
  if (store === "suppliers") return { id: item.id, factory_id: item.factoryId, size_ml: item.sizeMl, price_per_bottle: item.pricePerBottle, bottles_per_pack: item.bottlesPerPack, updated_at: item.updatedAt };
  if (store === "supplierFactories") return { id: item.id, name: item.name, created_at: item.createdAt, updated_at: item.updatedAt };
  if (store === "supplierLogs") return { id: item.id, supplier_id: item.supplierId, factory: item.factory, action: item.action, summary: item.summary, created_at: item.createdAt };
  if (store === "oemPackPrices") return { id: item.id, size_label: item.sizeLabel, tier_packs: item.tierPacks, price_per_pack: item.pricePerPack, updated_at: item.updatedAt };
  if (store === "deliverySettings") return { id: item.id, fuel_efficiency: item.fuelEfficiency, updated_at: item.updatedAt };
  if (store === "oemPriceLogs") return { id: item.id, price_id: item.priceId, size_label: item.sizeLabel, tier_packs: item.tierPacks, old_price: item.oldPrice, new_price: item.newPrice, created_at: item.createdAt };
  if (store === "productions") return { id: item.id, product_type: item.productType, brand: item.brand || null, size_ml: item.sizeMl || null, output_quantity: item.outputQuantity, output_unit: item.outputUnit, materials: item.materials, note: item.note, status: item.status, produced_at: item.producedAt, created_at: item.createdAt, updated_at: item.updatedAt, revisions: item.revisions };
  return item;
};

const fromDatabase = (store: StoreName, value: Record<string, unknown>) => {
  if (store === "oem") {
    const legacySize = Number(value.quantity ?? 0);
    const storedSize = String(value.size_ml ?? "");
    const sizeMl = storedSize === "500/600"
      ? "500"
      : storedSize
        ? storedSize
        : legacySize === 350 || legacySize === 500 || legacySize === 600 || legacySize === 1500
          ? String(legacySize)
          : "";
    return { id: value.id, name: value.name, sizeMl, pricePerPack: Number(value.price_per_pack ?? 0), fulfillmentType: value.fulfillment_type === "delivery" ? "delivery" : "pickup", updatedAt: value.updated_at };
  }
  if (store === "suppliers") return { id: value.id, factoryId: value.factory_id, sizeMl: value.size_ml, pricePerBottle: Number(value.price_per_bottle), bottlesPerPack: value.bottles_per_pack, updatedAt: value.updated_at };
  if (store === "supplierFactories") return { id: value.id, name: value.name, createdAt: value.created_at, updatedAt: value.updated_at };
  if (store === "supplierLogs") return { id: value.id, supplierId: value.supplier_id, factory: value.factory, action: value.action, summary: value.summary, createdAt: value.created_at };
  if (store === "oemPackPrices") return { id: value.id, sizeLabel: value.size_label, tierPacks: value.tier_packs, pricePerPack: Number(value.price_per_pack), updatedAt: value.updated_at };
  if (store === "deliverySettings") return { id: value.id, fuelEfficiency: Number(value.fuel_efficiency), updatedAt: value.updated_at };
  if (store === "oemPriceLogs") return { id: value.id, priceId: value.price_id, sizeLabel: value.size_label, tierPacks: value.tier_packs, oldPrice: Number(value.old_price), newPrice: Number(value.new_price), createdAt: value.created_at };
  if (store === "productions") return { id: value.id, productType: value.product_type, brand: value.brand || undefined, sizeMl: value.size_ml || undefined, outputQuantity: Number(value.output_quantity), outputUnit: value.output_unit, materials: value.materials || [], note: value.note || "", status: value.status, producedAt: value.produced_at, createdAt: value.created_at, updatedAt: value.updated_at, revisions: value.revisions || [] };
  return value;
};

export async function readAll<T>(store: StoreName): Promise<T[]> {
  const { data, error } = await supabase.from(tables[store]).select("*");
  if (error) throw error;
  return (data ?? []).map(value => fromDatabase(store, value)) as T[];
}

export async function saveRecord<T>(store: StoreName, value: T): Promise<void> {
  const record = toDatabase(store, value);
  const { error } = await supabase.from(tables[store]).upsert(record);
  if (!error) return;

  // Keep OEM editing functional while an older Supabase schema is waiting for
  // the size_ml migration. Other errors must still surface to the form.
  if (store === "oem" && error.code === "PGRST204" && error.message.includes("size_ml")) {
    const { size_ml: _sizeMl, ...legacyRecord } = record;
    void _sizeMl;
    const { error: legacyError } = await supabase.from(tables[store]).upsert(legacyRecord);
    if (!legacyError) return;
    throw legacyError;
  }
  throw error;
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
