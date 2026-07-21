"use client";

import Image from "next/image";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Database,
  Factory,
  GlassWater,
  History,
  Home,
  LogOut,
  Package,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  deleteRecord,
  InventoryRecord,
  OemRecord,
  readAll,
  saveMany,
  saveRecord,
  SupplierFactory,
  SupplierLog,
  SupplierRecord,
} from "@/lib/database";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "ภาพรวม", icon: Home },
  { label: "สต็อก", icon: Boxes },
  { label: "ลูกค้า OEM", icon: Users },
  { label: "Supplier", icon: Factory },
];
const supplierBottleSizes = [350, 500, 600, 780, 1500];
const digitsOnly = (value: string) => value.replace(/\D/g, "");
const decimalOnly = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...fractionParts] = cleaned.split(".");
  if (!fractionParts.length) return whole;
  return `${whole || "0"}.${fractionParts.join("").slice(0, 4)}`;
};

const initialInventory: InventoryRecord[] = [
  ...[350, 500, 600, 780, 1500].map((size, i) => ({
    id: `NEB-${size}`,
    category: "bottle" as const,
    brand: "เนบิวลา",
    name: `${size.toLocaleString()} ml`,
    detail: "ขวดเปล่า เนบิวลา",
    quantity: [120, 86, 245, 54, 42][i],
    unit: "ห่อ",
  })),
  ...[350, 500, 600, 1500].map((size, i) => ({
    id: `PP-${size}`,
    category: "bottle" as const,
    brand: "พีพี",
    name: `${size.toLocaleString()} ml`,
    detail: "ขวดเปล่า พีพี",
    quantity: [98, 67, 132, 38][i],
    unit: "ห่อ",
  })),
  {
    id: "CAP-BLUE",
    category: "cap",
    name: "ฝาสีฟ้า",
    detail: "ฝาขวดน้ำดื่ม",
    quantity: 32,
    unit: "ลัง",
    color: "#54a9cb",
  },
  {
    id: "CAP-WHITE",
    category: "cap",
    name: "ฝาสีขาว",
    detail: "ฝาขวดน้ำดื่ม",
    quantity: 18,
    unit: "ลัง",
    color: "#e8ecec",
  },
  {
    id: "CAP-PINK",
    category: "cap",
    name: "ฝาสีชมพู",
    detail: "ฝาขวดน้ำดื่ม",
    quantity: 9,
    unit: "ลัง",
    color: "#ee9fb2",
  },
  {
    id: "TANK-W18",
    category: "tank",
    name: "ถังขาว 18 ลิตร",
    detail: "ถังน้ำดื่มหมุนเวียน",
    quantity: 76,
    unit: "ถัง",
  },
  {
    id: "TANK-CLEAR-A",
    category: "tank",
    name: "ถังใส แบบ A",
    detail: "ถังใสทรงกลม",
    quantity: 48,
    unit: "ถัง",
  },
  {
    id: "TANK-CLEAR-B",
    category: "tank",
    name: "ถังใส แบบ B",
    detail: "ถังใสมีหูจับ",
    quantity: 35,
    unit: "ถัง",
  },
  {
    id: "CUP",
    category: "glass",
    name: "แก้วน้ำ",
    detail: "แก้วพลาสติกพร้อมซีล",
    quantity: 160,
    unit: "ลัง",
  },
  {
    id: "GLASS-CRATE",
    category: "glass",
    name: "ลังน้ำแก้ว",
    detail: "ลังสำหรับขวดแก้ว",
    quantity: 64,
    unit: "ลัง",
  },
];

const initialOem: OemRecord[] = [
  {
    id: "oem-evergreen",
    name: "Evergreen Hotel",
    quantity: 12500,
    updatedAt: "2026-07-21T00:00:00.000Z",
  },
  {
    id: "oem-siam",
    name: "Siam Wellness",
    quantity: 8200,
    updatedAt: "2026-07-21T00:00:00.000Z",
  },
];

function StockCard({
  item,
  onOpen,
  onDelete,
}: {
  item: InventoryRecord;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="inventory-card-shell">
      <button className="inventory-card inventory-card-button" onClick={onOpen}>
        <div className="inventory-icon">
          {item.color ? (
            <span className="color-swatch" style={{ background: item.color }} />
          ) : (
            <Package size={21} />
          )}
        </div>
        <div className="inventory-copy">
          <strong>{item.name}</strong>
          <small>{item.detail} · {item.id}</small>
        </div>
        <div className="inventory-amount">
          <strong>{item.quantity.toLocaleString("th-TH")}</strong>
          <span>{item.unit}</span>
        </div>
        <ChevronRight className="card-chevron" size={18} />
      </button>
      <button type="button" className="stock-delete-button" onClick={onDelete} aria-label={`ลบ ${item.name}`}><Trash2 size={16} /></button>
    </article>
  );
}

function SummaryCards({
  bottleTotal,
  capTotal,
  oemTotal,
}: {
  bottleTotal: number;
  capTotal: number;
  oemTotal: number;
}) {
  return (
    <section className="inventory-summary" aria-label="สรุปสต็อก">
      <article>
        <span className="summary-icon blue">
          <GlassWater />
        </span>
        <div>
          <small>ขวดทุกแบรนด์</small>
          <strong>
            {bottleTotal.toLocaleString("th-TH")} <em>ห่อ</em>
          </strong>
        </div>
      </article>
      <article>
        <span className="summary-icon teal">
          <Palette />
        </span>
        <div>
          <small>ฝาขวดทุกสี</small>
          <strong>
            {capTotal.toLocaleString("th-TH")} <em>ลัง</em>
          </strong>
        </div>
      </article>
      <article>
        <span className="summary-icon violet">
          <Users />
        </span>
        <div>
          <small>ขวดของ OEM</small>
          <strong>
            {oemTotal.toLocaleString("th-TH")} <em>ห่อ</em>
          </strong>
        </div>
      </article>
    </section>
  );
}

function OemList({
  items,
  onRemove,
}: {
  items: OemRecord[];
  onRemove: (item: OemRecord) => void;
}) {
  return (
    <div className="oem-list">
      {items.map((item) => (
        <article key={item.id}>
          <span className="oem-avatar">
            {item.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{item.name}</strong>
            <small>
              อัปเดต {new Date(item.updatedAt).toLocaleDateString("th-TH")}
            </small>
          </div>
          <p>
            <strong>{item.quantity.toLocaleString("th-TH")}</strong>
            <span>ห่อ</span>
          </p>
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`ลบ ${item.name}`}
          >
            <Trash2 size={16} />
          </button>
        </article>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [active, setActive] = useState("ภาพรวม");
  const [brandTab, setBrandTab] = useState("เนบิวลา");
  const [inventory, setInventory] =
    useState<InventoryRecord[]>(initialInventory);
  const [oemItems, setOemItems] = useState<OemRecord[]>(initialOem);
  const [oemName, setOemName] = useState("");
  const [oemQuantity, setOemQuantity] = useState("");
  const [showOemForm, setShowOemForm] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [selectedStock, setSelectedStock] = useState<InventoryRecord | null>(
    null,
  );
  const [editQuantity, setEditQuantity] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState({
    name: "",
    detail: "",
    quantity: "",
    unit: "ลัง",
    category: "cap",
    brand: "เนบิวลา",
  });
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [supplierFactories, setSupplierFactories] = useState<SupplierFactory[]>(
    [],
  );
  const [supplierLogs, setSupplierLogs] = useState<SupplierLog[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showFactoryForm, setShowFactoryForm] = useState(false);
  const [factoryName, setFactoryName] = useState("");
  const [selectedFactory, setSelectedFactory] =
    useState<SupplierFactory | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(
    null,
  );
  const [supplierDraft, setSupplierDraft] = useState({
    sizeMl: "350",
    pricePerBottle: "",
    bottlesPerPack: "",
  });
  const [expandedFactories, setExpandedFactories] = useState<string[]>([]);
  const [supplierToDelete, setSupplierToDelete] =
    useState<SupplierRecord | null>(null);
  const [factoryToDelete, setFactoryToDelete] =
    useState<SupplierFactory | null>(null);
  const [stockToDelete, setStockToDelete] =
    useState<InventoryRecord | null>(null);
  const [oemToDelete, setOemToDelete] = useState<OemRecord | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const hydrate = async () => {
      const [
        storedInventory,
        storedOem,
        storedSuppliers,
        storedFactories,
        storedSupplierLogs,
      ] = await Promise.all([
        readAll<InventoryRecord>("inventory"),
        readAll<OemRecord>("oem"),
        readAll<SupplierRecord>("suppliers"),
        readAll<SupplierFactory>("supplierFactories"),
        readAll<SupplierLog>("supplierLogs"),
      ]);
      if (storedInventory.length) {
        const migrated = storedInventory.map((item) => {
          const legacyCategory = item.category as string;
          const category =
            legacyCategory === "packaging"
              ? item.id.startsWith("CAP")
                ? "cap"
                : item.id.startsWith("TANK")
                  ? "tank"
                  : "glass"
              : item.category;
          return {
            ...item,
            category,
            unit: category === "bottle" ? "ห่อ" : item.unit,
          } as InventoryRecord;
        });
        setInventory(migrated);
        await saveMany("inventory", migrated);
      } else setInventory([]);
      if (storedOem.length) setOemItems(storedOem);
      else setOemItems([]);
      const factories = [...storedFactories];
      const migratedSuppliers = storedSuppliers.map((item) => {
        const legacy = item as SupplierRecord & {
          factory?: string;
          pricePerPack?: number;
        };
        const factoryName = legacy.factory?.trim() || "ไม่ระบุชื่อโรงงาน";
        let factory = factories.find(
          (entry) => entry.id === item.factoryId || entry.name === factoryName,
        );
        if (!factory) {
          const now = item.updatedAt || new Date().toISOString();
          factory = {
            id: crypto.randomUUID(),
            name: factoryName,
            createdAt: now,
            updatedAt: now,
          };
          factories.push(factory);
        }
        const { factory: _factory, pricePerPack = 0, ...supplier } = legacy;
        void _factory;
        return {
          ...supplier,
          factoryId: factory.id,
          pricePerBottle: Number.isFinite(item.pricePerBottle)
            ? item.pricePerBottle
            : item.bottlesPerPack > 0
              ? pricePerPack / item.bottlesPerPack
              : pricePerPack,
        };
      });
      setSupplierFactories(factories);
      setSuppliers(migratedSuppliers);
      if (factories.length !== storedFactories.length)
        await saveMany("supplierFactories", factories);
      if (
        storedSuppliers.some(
          (item) => !item.factoryId || !Number.isFinite(item.pricePerBottle),
        )
      )
        await saveMany("suppliers", migratedSuppliers);
      setSupplierLogs(storedSupplierLogs);
      setDatabaseReady(true);
    };
    hydrate().catch(() => setDatabaseReady(true));
  }, [session]);

  const bottleSize = (item: InventoryRecord) =>
    Number(item.id.match(/(\d+)/)?.[1] ?? 99999);
  const bottles = inventory
    .filter((item) => item.category === "bottle")
    .sort((a, b) => bottleSize(a) - bottleSize(b));
  const caps = inventory.filter((item) => item.category === "cap");
  const tanks = inventory.filter((item) => item.category === "tank");
  const glassItems = inventory.filter((item) => item.category === "glass");
  const packaging = [...caps, ...tanks, ...glassItems];
  const bottleTotal = bottles.reduce((sum, item) => sum + item.quantity, 0);
  const capTotal = caps.reduce((sum, item) => sum + item.quantity, 0);
  const oemTotal = oemItems.reduce((sum, item) => sum + item.quantity, 0);
  const latestOem = useMemo(
    () =>
      [...oemItems]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    [oemItems],
  );
  const supplierGroups = useMemo(
    () =>
      [...supplierFactories]
        .sort((a, b) => a.name.localeCompare(b.name, "th"))
        .map((factory) => ({
          factory,
          items: suppliers
            .filter((item) => item.factoryId === factory.id)
            .sort((a, b) => a.sizeMl - b.sizeMl),
        })),
    [supplierFactories, suppliers],
  );

  const openStock = (item: InventoryRecord) => {
    setSelectedStock(item);
    setEditQuantity(String(item.quantity));
  };
  const adjustDraft = (delta: number) =>
    setEditQuantity((value) =>
      String(Math.max(0, (Number(value) || 0) + delta)),
    );
  const saveQuantity = async () => {
    if (!selectedStock) return;
    const updated = {
      ...selectedStock,
      quantity: Math.max(0, Number(editQuantity) || 0),
    };
    setInventory((items) =>
      items.map((item) => (item.id === selectedStock.id ? updated : item)),
    );
    await saveRecord("inventory", updated);
    setSelectedStock(null);
  };

  const removeStock = async (item: InventoryRecord) => {
    if (stockToDelete?.id !== item.id) { setStockToDelete(item); return; }
    setInventory((items) => items.filter((entry) => entry.id !== item.id));
    await deleteRecord("inventory", item.id);
    setStockToDelete(null);
  };

  const addStock = async (event: FormEvent) => {
    event.preventDefault();
    const record: InventoryRecord = {
      id: `CUSTOM-${crypto.randomUUID()}`,
      category: newStock.category as InventoryRecord["category"],
      brand: newStock.category === "bottle" ? newStock.brand : undefined,
      name: newStock.name.trim(),
      detail: newStock.detail.trim() || "รายการสต็อกเพิ่มเติม",
      quantity: Math.max(0, Number(newStock.quantity) || 0),
      unit:
        newStock.category === "bottle" ? "ห่อ" : newStock.unit.trim() || "ชิ้น",
    };
    setInventory((items) => [...items, record]);
    await saveRecord("inventory", record);
    setNewStock({
      name: "",
      detail: "",
      quantity: "",
      unit: "ลัง",
      category: "cap",
      brand: "เนบิวลา",
    });
    setShowAddStock(false);
  };

  const addOem = async (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(oemQuantity);
    if (!oemName.trim() || !Number.isFinite(quantity) || quantity < 0) return;
    const item: OemRecord = {
      id: crypto.randomUUID(),
      name: oemName.trim(),
      quantity,
      updatedAt: new Date().toISOString(),
    };
    setOemItems((items) => [...items, item]);
    await saveRecord("oem", item);
    setOemName("");
    setOemQuantity("");
    setShowOemForm(false);
  };

  const removeOem = async (item: OemRecord) => {
    if (oemToDelete?.id !== item.id) { setOemToDelete(item); return; }
    setOemItems((items) => items.filter((entry) => entry.id !== item.id));
    await deleteRecord("oem", item.id);
    setOemToDelete(null);
  };

  const addFactory = async (event: FormEvent) => {
    event.preventDefault();
    const name = factoryName.trim();
    if (
      !name ||
      supplierFactories.some(
        (factory) =>
          factory.name.toLocaleLowerCase("th") === name.toLocaleLowerCase("th"),
      )
    )
      return;
    const now = new Date().toISOString();
    const factory: SupplierFactory = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    };
    const log: SupplierLog = {
      id: crypto.randomUUID(),
      supplierId: factory.id,
      factory: name,
      action: "created",
      summary: "เพิ่มโรงงานขวด",
      createdAt: now,
    };
    setSupplierFactories((items) => [...items, factory]);
    setSupplierLogs((items) => [log, ...items]);
    setExpandedFactories((items) => [...items, factory.id]);
    await Promise.all([
      saveRecord("supplierFactories", factory),
      saveRecord("supplierLogs", log),
    ]);
    setFactoryName("");
    setShowFactoryForm(false);
  };

  const openSupplierForm = (
    factory: SupplierFactory,
    supplier?: SupplierRecord,
  ) => {
    setSelectedFactory(factory);
    setEditingSupplier(supplier ?? null);
    const firstAvailableSize =
      supplierBottleSizes.find(
        (size) =>
          !suppliers.some(
            (item) => item.factoryId === factory.id && item.sizeMl === size,
          ),
      ) ?? supplierBottleSizes[0];
    setSupplierDraft(
      supplier
        ? {
            sizeMl: String(supplier.sizeMl),
            pricePerBottle: String(supplier.pricePerBottle),
            bottlesPerPack: String(supplier.bottlesPerPack),
          }
        : {
            sizeMl: String(firstAvailableSize),
            pricePerBottle: "",
            bottlesPerPack: "",
          },
    );
    setShowSupplierForm(true);
  };

  const saveSupplier = async (event: FormEvent) => {
    event.preventDefault();
    const pricePerBottle = Number(supplierDraft.pricePerBottle);
    const bottlesPerPack = Number(supplierDraft.bottlesPerPack);
    const sizeMl = Number(supplierDraft.sizeMl);
    if (
      !selectedFactory ||
      !Number.isFinite(pricePerBottle) ||
      !Number.isFinite(bottlesPerPack) ||
      !Number.isFinite(sizeMl) ||
      pricePerBottle < 0 ||
      bottlesPerPack <= 0 ||
      sizeMl <= 0 ||
      suppliers.some(
        (item) =>
          item.factoryId === selectedFactory.id &&
          item.sizeMl === sizeMl &&
          item.id !== editingSupplier?.id,
      )
    )
      return;
    const now = new Date().toISOString();
    const record: SupplierRecord = {
      id: editingSupplier?.id ?? crypto.randomUUID(),
      factoryId: selectedFactory.id,
      sizeMl,
      pricePerBottle,
      bottlesPerPack,
      updatedAt: now,
    };
    const action: SupplierLog["action"] = editingSupplier
      ? "updated"
      : "created";
    const summary = editingSupplier
      ? `แก้ไข ${sizeMl} ml: ฿${editingSupplier.pricePerBottle.toLocaleString("th-TH")} → ฿${pricePerBottle.toLocaleString("th-TH")} ต่อขวด / ${editingSupplier.bottlesPerPack.toLocaleString("th-TH")} → ${bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`
      : `เพิ่มขวด ${sizeMl} ml ราคา ฿${pricePerBottle.toLocaleString("th-TH")} ต่อขวด จำนวน ${bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`;
    const log: SupplierLog = {
      id: crypto.randomUUID(),
      supplierId: record.id,
      factory: selectedFactory.name,
      action,
      summary,
      createdAt: now,
    };
    setSuppliers((items) =>
      editingSupplier
        ? items.map((item) => (item.id === record.id ? record : item))
        : [...items, record],
    );
    setSupplierLogs((items) => [log, ...items]);
    await Promise.all([
      saveRecord("suppliers", record),
      saveRecord("supplierLogs", log),
    ]);
    setShowSupplierForm(false);
    setEditingSupplier(null);
    setSelectedFactory(null);
  };

  const removeSupplier = async (supplier: SupplierRecord) => {
    if (supplierToDelete?.id !== supplier.id) {
      setSupplierToDelete(supplier);
      return;
    }
    const factory = supplierFactories.find(
      (item) => item.id === supplier.factoryId,
    );
    const log: SupplierLog = {
      id: crypto.randomUUID(),
      supplierId: supplier.id,
      factory: factory?.name ?? "ไม่ระบุชื่อโรงงาน",
      action: "deleted",
      summary: `ลบขวด ${supplier.sizeMl} ml ราคา ฿${supplier.pricePerBottle.toLocaleString("th-TH")} ต่อขวด จำนวน ${supplier.bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((items) => items.filter((item) => item.id !== supplier.id));
    setSupplierLogs((items) => [log, ...items]);
    await Promise.all([
      deleteRecord("suppliers", supplier.id),
      saveRecord("supplierLogs", log),
    ]);
    setSupplierToDelete(null);
  };

  const removeFactory = async (factory: SupplierFactory) => {
    if (factoryToDelete?.id !== factory.id) {
      setFactoryToDelete(factory);
      return;
    }
    const itemCount = suppliers.filter(
      (item) => item.factoryId === factory.id,
    ).length;
    const log: SupplierLog = {
      id: crypto.randomUUID(),
      supplierId: factory.id,
      factory: factory.name,
      action: "deleted",
      summary: `ลบโรงงานและรายการขวด ${itemCount.toLocaleString("th-TH")} รายการ`,
      createdAt: new Date().toISOString(),
    };
    setSupplierFactories((items) =>
      items.filter((item) => item.id !== factory.id),
    );
    setSuppliers((items) =>
      items.filter((item) => item.factoryId !== factory.id),
    );
    setSupplierLogs((items) => [log, ...items]);
    setExpandedFactories((items) => items.filter((id) => id !== factory.id));
    await Promise.all([
      deleteRecord("supplierFactories", factory.id),
      saveRecord("supplierLogs", log),
    ]);
    setFactoryToDelete(null);
  };

  const enterApp = async () => {
    setAuthLoading(true);
    setAuthMessage("");
    const result = await supabase.auth.signInAnonymously();
    setAuthLoading(false);
    if (result.error)
      setAuthMessage("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
  };

  const goTo = (label: string) => setActive(label);
  const toggleFactory = (factoryId: string) =>
    setExpandedFactories((items) =>
      items.includes(factoryId)
        ? items.filter((item) => item !== factoryId)
        : [...items, factoryId],
    );

  if (!session)
    return (
      <main className="auth-page">
        <section className="auth-card">
          <Image
            className="auth-logo"
            src="/insight-taweechai-logo.jpg"
            alt="Taweechai Drinking Water"
            width={180}
            height={100}
            priority
          />
          <button
            className="auth-enter-button"
            type="button"
            onClick={enterApp}
            disabled={authLoading}
          >
            {authLoading && (
              <span className="auth-spinner" aria-hidden="true" />
            )}
            <span>{authLoading ? "Loading..." : "Insight Taweechai"}</span>
          </button>
          {authMessage && (
            <p className="auth-message" role="alert">
              {authMessage}
            </p>
          )}
        </section>
      </main>
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Image
            className="brand-logo"
            src="/insight-taweechai-logo.jpg"
            alt="โลโก้ทวีชัยน้ำดื่ม"
            width={42}
            height={42}
            priority
          />
          <div>
            <strong>Insight Taweechai</strong>
            <small>Stock management</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="เมนูหลัก">
          <p className="nav-caption">เมนูหลัก</p>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => goTo(label)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="database-status">
          <Database size={16} />
          <div>
            <strong>
              {databaseReady
                ? "ฐานข้อมูล Cloud พร้อมใช้งาน"
                : "กำลังเชื่อมต่อฐานข้อมูล"}
            </strong>
            <small>Insight Taweechai</small>
          </div>
          <button
            className="logout-button"
            onClick={() => supabase.auth.signOut()}
            aria-label="ออกจากระบบ"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="content inventory-page">
          {active === "ภาพรวม" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Home size={16} /> ภาพรวม Insight Taweechai
                  </p>
                  <h1>สรุปคลังสินค้าปัจจุบัน</h1>
                  <p>
                    ตัวเลขทั้งหมดคำนวณจากข้อมูลที่บันทึกในฐานข้อมูลบนอุปกรณ์นี้
                  </p>
                </div>
              </section>
              <SummaryCards
                bottleTotal={bottleTotal}
                capTotal={capTotal}
                oemTotal={oemTotal}
              />
              <section className="overview-grid">
                <article className="panel overview-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ขวดแยกตามแบรนด์</h2>
                      <p>จำนวนคงเหลือปัจจุบัน</p>
                    </div>
                    <button className="text-link" onClick={() => goTo("สต็อก")}>
                      ไปที่สต็อก <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="brand-overview">
                    <div>
                      <span>เนบิวลา</span>
                      <strong>
                        {bottles
                          .filter((item) => item.brand === "เนบิวลา")
                          .reduce((sum, item) => sum + item.quantity, 0)
                          .toLocaleString("th-TH")}{" "}
                        ห่อ
                      </strong>
                    </div>
                    <div>
                      <span>พีพี</span>
                      <strong>
                        {bottles
                          .filter((item) => item.brand === "พีพี")
                          .reduce((sum, item) => sum + item.quantity, 0)
                          .toLocaleString("th-TH")}{" "}
                        ห่อ
                      </strong>
                    </div>
                    <div>
                      <span>สต็อกกลุ่มอื่น</span>
                      <strong>{packaging.length} รายการ</strong>
                    </div>
                  </div>
                </article>
                <article className="panel overview-panel">
                  <div className="section-heading">
                    <div>
                      <h2>OEM อัปเดตล่าสุด</h2>
                      <p>ลูกค้าในฐานข้อมูล {oemItems.length} ราย</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => goTo("ลูกค้า OEM")}
                    >
                      ดูทั้งหมด <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="attention-list">
                    {latestOem.map((item) => (
                      <div key={item.id}>
                        <span className="oem-avatar">
                          {item.name.slice(0, 2).toUpperCase()}
                        </span>
                        <p>
                          <strong>{item.name}</strong>
                          <small>
                            {new Date(item.updatedAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </small>
                        </p>
                        <em>{item.quantity.toLocaleString("th-TH")} ห่อ</em>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {active === "สต็อก" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Boxes size={16} /> คลังสินค้า
                  </p>
                  <h1>ขวดและบรรจุภัณฑ์</h1>
                  <p>
                    กดที่รายการเพื่อดูและปรับจำนวน ระบบจะบันทึกลงฐานข้อมูลทันที
                  </p>
                </div>
                <button
                  className="secondary-btn add-stock-button"
                  onClick={() => setShowAddStock(true)}
                >
                  <Plus size={18} /> เพิ่มสต็อก
                </button>
              </section>
              <SummaryCards
                bottleTotal={bottleTotal}
                capTotal={capTotal}
                oemTotal={oemTotal}
              />
              <div className="inventory-main-column">
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>สต็อกขวดน้ำ</h2>
                      <p>แยกตามยี่ห้อและขนาด</p>
                    </div>
                    <span className="updated-chip">บันทึกอัตโนมัติ</span>
                  </div>
                  <div className="brand-tabs" role="tablist">
                    {["เนบิวลา", "พีพี"].map((brand) => (
                      <button
                        key={brand}
                        role="tab"
                        aria-selected={brandTab === brand}
                        className={brandTab === brand ? "active" : ""}
                        onClick={() => setBrandTab(brand)}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  <div className="inventory-cards bottle-grid">
                    {bottles
                      .filter((item) => item.brand === brandTab)
                      .map((item) => (
                        <StockCard
                          key={item.id}
                          item={item}
                          onOpen={() => openStock(item)}
                          onDelete={() => setStockToDelete(item)}
                        />
                      ))}
                  </div>
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>สต็อกฝาขวด</h2>
                      <p>จำนวนฝาแยกตามสี หน่วยเป็นลัง</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => {
                        setNewStock((value) => ({ ...value, category: "cap" }));
                        setShowAddStock(true);
                      }}
                    >
                      <Plus size={16} /> เพิ่มฝา
                    </button>
                  </div>
                  <div className="inventory-cards packaging-grid">
                    {caps.map((item) => (
                      <StockCard
                        key={item.id}
                        item={item}
                        onOpen={() => openStock(item)}
                        onDelete={() => setStockToDelete(item)}
                      />
                    ))}
                  </div>
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>สต็อกถังน้ำ</h2>
                      <p>ถังขาว 18 ลิตรและถังใส</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => {
                        setNewStock((value) => ({
                          ...value,
                          category: "tank",
                          unit: "ถัง",
                        }));
                        setShowAddStock(true);
                      }}
                    >
                      <Plus size={16} /> เพิ่มถัง
                    </button>
                  </div>
                  <div className="inventory-cards packaging-grid">
                    {tanks.map((item) => (
                      <StockCard
                        key={item.id}
                        item={item}
                        onOpen={() => openStock(item)}
                        onDelete={() => setStockToDelete(item)}
                      />
                    ))}
                  </div>
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>แก้วและลังน้ำแก้ว</h2>
                      <p>อุปกรณ์สำหรับน้ำดื่มบรรจุแก้ว</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => {
                        setNewStock((value) => ({
                          ...value,
                          category: "glass",
                          unit: "ลัง",
                        }));
                        setShowAddStock(true);
                      }}
                    >
                      <Plus size={16} /> เพิ่มรายการ
                    </button>
                  </div>
                  <div className="inventory-cards packaging-grid">
                    {glassItems.map((item) => (
                      <StockCard
                        key={item.id}
                        item={item}
                        onOpen={() => openStock(item)}
                        onDelete={() => setStockToDelete(item)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {active === "ลูกค้า OEM" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Users size={16} /> ลูกค้า OEM
                  </p>
                  <h1>สต็อกขวดของลูกค้า</h1>
                  <p>
                    เพิ่มและตรวจสอบจำนวนห่อที่เก็บไว้สำหรับแต่ละแบรนด์ลูกค้า
                  </p>
                </div>
                <button
                  className="secondary-btn oem-add-button"
                  onClick={() => setShowOemForm(true)}
                >
                  <Plus size={18} /> เพิ่มลูกค้า OEM
                </button>
              </section>
              <section className="oem-page-grid single">
                <article className="panel oem-directory">
                  <div className="section-heading">
                    <div>
                      <h2>รายการลูกค้า OEM</h2>
                      <p>
                        {oemItems.length} ลูกค้า ·{" "}
                        {oemTotal.toLocaleString("th-TH")} ห่อ
                      </p>
                    </div>
                  </div>
                  <OemList items={oemItems} onRemove={setOemToDelete} />
                  {!oemItems.length && (
                    <p className="empty-state">
                      ยังไม่มีข้อมูล OEM กด “เพิ่มลูกค้า OEM” เพื่อเริ่มต้น
                    </p>
                  )}
                </article>
              </section>
            </>
          )}

          {active === "Supplier" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Factory size={16} /> Supplier
                  </p>
                  <h1>โรงงานขวดและราคา</h1>
                  <p>
                    เพิ่มชื่อโรงงานก่อน
                    แล้วจึงเพิ่มรายการขวดแต่ละขนาดภายใต้โรงงานนั้น
                    พร้อมประวัติการแก้ไขทุกครั้ง
                  </p>
                </div>
                <button
                  className="secondary-btn add-stock-button"
                  onClick={() => setShowFactoryForm(true)}
                >
                  <Plus size={18} /> เพิ่มโรงงานขวด
                </button>
              </section>
              <section className="supplier-layout">
                <article className="panel supplier-directory">
                  <div className="section-heading">
                    <div>
                      <h2>โรงงานขวด</h2>
                      <p>
                        {supplierFactories.length} โรงงาน · {suppliers.length}{" "}
                        รายการขวด
                      </p>
                    </div>
                  </div>
                  <div className="supplier-groups">
                    {supplierGroups.map(({ factory, items }) => {
                      const expanded = expandedFactories.includes(factory.id);
                      const prices = items.map((item) => item.pricePerBottle);
                      return (
                        <section
                          className={`supplier-group ${expanded ? "expanded" : ""}`}
                          key={factory.id}
                        >
                          <div className="supplier-group-header">
                            <button
                              type="button"
                              className="supplier-group-toggle"
                              onClick={() => toggleFactory(factory.id)}
                              aria-expanded={expanded}
                            >
                              <span className="supplier-factory-icon">
                                <Factory size={20} />
                              </span>
                              <span className="supplier-group-name">
                                <strong>{factory.name}</strong>
                                <small>
                                  {items.length
                                    ? `${items.length} ขนาด · ${items.map((item) => `${item.sizeMl.toLocaleString("th-TH")} ml`).join(", ")}`
                                    : "ยังไม่มีรายการขวด"}
                                </small>
                              </span>
                              {items.length > 0 && (
                                <span className="supplier-range">
                                  <strong>
                                    ฿
                                    {Math.min(...prices).toLocaleString(
                                      "th-TH",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 4,
                                      },
                                    )}
                                    {prices.length > 1 &&
                                    Math.min(...prices) !== Math.max(...prices)
                                      ? ` – ฿${Math.max(...prices).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                      : ""}
                                  </strong>
                                  <small>ราคาต่อขวด</small>
                                </span>
                              )}
                              <ChevronDown
                                className="supplier-chevron"
                                size={20}
                              />
                            </button>
                            <div className="supplier-factory-actions">
                              <button
                                type="button"
                                className="supplier-add-item"
                                disabled={
                                  items.length >= supplierBottleSizes.length
                                }
                                onClick={() => openSupplierForm(factory)}
                              >
                                <Plus size={16} />{" "}
                                {items.length >= supplierBottleSizes.length
                                  ? "ครบทุกขนาดแล้ว"
                                  : "เพิ่มรายการขวด"}
                              </button>
                              <button
                                type="button"
                                className="supplier-delete-factory"
                                onClick={() => setFactoryToDelete(factory)}
                                aria-label={`ลบโรงงาน ${factory.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div className="supplier-group-items">
                              {items.map((item) => (
                                <article key={item.id}>
                                  <div className="supplier-size">
                                    <strong>
                                      {item.sizeMl.toLocaleString("th-TH")} ml
                                    </strong>
                                    <small>ขนาดขวด</small>
                                  </div>
                                  <div className="supplier-pack">
                                    <strong>
                                      {item.bottlesPerPack.toLocaleString(
                                        "th-TH",
                                      )}{" "}
                                      ขวด
                                    </strong>
                                    <small>ต่อห่อ</small>
                                  </div>
                                  <div className="supplier-price">
                                    <strong>
                                      ฿
                                      {item.pricePerBottle.toLocaleString(
                                        "th-TH",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 4,
                                        },
                                      )}
                                    </strong>
                                    <small>ราคาต่อขวด</small>
                                  </div>
                                  <div className="supplier-actions">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openSupplierForm(factory, item)
                                      }
                                      aria-label={`แก้ไข ${factory.name} ${item.sizeMl} ml`}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="danger"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setSupplierToDelete(item);
                                      }}
                                      aria-label={`ลบ ${factory.name} ${item.sizeMl} ml`}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </article>
                              ))}
                              {!items.length && (
                                <p className="supplier-empty-items">
                                  ยังไม่มีรายการขวด กด “เพิ่มรายการขวด”
                                  เพื่อเริ่มต้น
                                </p>
                              )}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                  {!supplierFactories.length && (
                    <p className="empty-state">
                      ยังไม่มีโรงงานขวด กด “เพิ่มโรงงานขวด” เพื่อเริ่มต้น
                    </p>
                  )}
                </article>
                <aside className="panel supplier-log-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ประวัติการแก้ไข</h2>
                      <p>บันทึกอัตโนมัติทุกการเปลี่ยนแปลง</p>
                    </div>
                    <History size={18} />
                  </div>
                  <div className="supplier-logs">
                    {[...supplierLogs]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .slice(0, 50)
                      .map((log) => (
                        <article key={log.id}>
                          <span className={`log-dot ${log.action}`} />
                          <div>
                            <strong>{log.factory}</strong>
                            <p>{log.summary}</p>
                            <small>
                              {new Date(log.createdAt).toLocaleString("th-TH", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </small>
                          </div>
                        </article>
                      ))}
                  </div>
                  {!supplierLogs.length && (
                    <p className="empty-state">
                      ประวัติจะปรากฏเมื่อมีการเพิ่มหรือแก้ไขข้อมูล
                    </p>
                  )}
                </aside>
              </section>
            </>
          )}
        </div>
      </main>
      <nav className="bottom-nav compact-nav" aria-label="เมนูมือถือ">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={active === label ? "active" : ""}
            onClick={() => goTo(label)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {selectedStock && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSelectedStock(null)
          }
        >
          <section
            className="stock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
          >
            <header>
              <div>
                <small>ปรับจำนวนสต็อก</small>
                <h2 id="stock-modal-title">{selectedStock.name}</h2>
                <p>
                  {selectedStock.detail} · {selectedStock.id}
                </p>
              </div>
              <button onClick={() => setSelectedStock(null)} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <div className="quantity-editor">
              <button onClick={() => adjustDraft(-1)} aria-label="ลดจำนวน">
                −
              </button>
              <label>
                จำนวนคงเหลือ
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(digitsOnly(event.target.value))}
                />
                <span>{selectedStock.unit}</span>
              </label>
              <button onClick={() => adjustDraft(1)} aria-label="เพิ่มจำนวน">
                +
              </button>
            </div>
            <footer>
              <button
                className="cancel-btn"
                onClick={() => setSelectedStock(null)}
              >
                ยกเลิก
              </button>
              <button className="save-btn" onClick={saveQuantity}>
                บันทึกจำนวน
              </button>
            </footer>
          </section>
        </div>
      )}
      {stockToDelete && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setStockToDelete(null)
          }
        >
          <section
            className="stock-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-stock-delete-title"
            aria-describedby="confirm-stock-delete-description"
          >
            <header>
              <div>
                <small>ยืนยันการลบสต็อก</small>
                <h2 id="confirm-stock-delete-title">ลบ {stockToDelete.name} หรือไม่?</h2>
                <p id="confirm-stock-delete-description">{stockToDelete.detail} · {stockToDelete.quantity.toLocaleString("th-TH")} {stockToDelete.unit}</p>
              </div>
              <button type="button" onClick={() => setStockToDelete(null)} aria-label="ปิด"><X size={20} /></button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>รายการนี้จะถูกลบออกจากสต็อกและฐานข้อมูล Cloud การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <footer>
              <button type="button" className="cancel-btn" onClick={() => setStockToDelete(null)}>ยกเลิก</button>
              <button type="button" className="delete-confirm-btn" onClick={() => removeStock(stockToDelete)}>ยืนยันการลบ</button>
            </footer>
          </section>
        </div>
      )}
      {oemToDelete && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOemToDelete(null)
          }
        >
          <section
            className="stock-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-oem-delete-title"
            aria-describedby="confirm-oem-delete-description"
          >
            <header>
              <div>
                <small>ยืนยันการลบลูกค้า OEM</small>
                <h2 id="confirm-oem-delete-title">ลบ {oemToDelete.name} หรือไม่?</h2>
                <p id="confirm-oem-delete-description">จำนวนคงเหลือ {oemToDelete.quantity.toLocaleString("th-TH")} ห่อ</p>
              </div>
              <button type="button" onClick={() => setOemToDelete(null)} aria-label="ปิด"><X size={20} /></button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>ข้อมูลลูกค้าและจำนวนสต็อก OEM จะถูกลบออกจากฐานข้อมูล Cloud การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <footer>
              <button type="button" className="cancel-btn" onClick={() => setOemToDelete(null)}>ยกเลิก</button>
              <button type="button" className="delete-confirm-btn" onClick={() => removeOem(oemToDelete)}>ยืนยันการลบ</button>
            </footer>
          </section>
        </div>
      )}
      {showAddStock && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowAddStock(false)
          }
        >
          <section
            className="stock-modal add-stock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-stock-title"
          >
            <header>
              <div>
                <small>สร้างรายการใหม่</small>
                <h2 id="add-stock-title">เพิ่มสต็อก</h2>
                <p>กรอกรายละเอียดและจำนวนเริ่มต้น</p>
              </div>
              <button onClick={() => setShowAddStock(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <form onSubmit={addStock}>
              <div className="form-grid">
                <label>
                  ประเภท
                  <select
                    value={newStock.category}
                    onChange={(event) =>
                      setNewStock((value) => ({
                        ...value,
                        category: event.target.value,
                        unit:
                          event.target.value === "bottle"
                            ? "ห่อ"
                            : event.target.value === "tank"
                              ? "ถัง"
                              : "ลัง",
                      }))
                    }
                  >
                    <option value="bottle">ขวดน้ำ</option>
                    <option value="cap">ฝาขวด</option>
                    <option value="tank">ถังน้ำ</option>
                    <option value="glass">แก้ว/ลังน้ำแก้ว</option>
                  </select>
                </label>
                {newStock.category === "bottle" && (
                  <label>
                    ยี่ห้อ
                    <select
                      value={newStock.brand}
                      onChange={(event) =>
                        setNewStock((value) => ({
                          ...value,
                          brand: event.target.value,
                        }))
                      }
                    >
                      <option>เนบิวลา</option>
                      <option>พีพี</option>
                    </select>
                  </label>
                )}
                <label>
                  ชื่อรายการ
                  <input
                    required
                    value={newStock.name}
                    onChange={(event) =>
                      setNewStock((value) => ({
                        ...value,
                        name: event.target.value,
                      }))
                    }
                    placeholder="เช่น ฝาสีเขียว"
                  />
                </label>
                <label>
                  รายละเอียด
                  <input
                    value={newStock.detail}
                    onChange={(event) =>
                      setNewStock((value) => ({
                        ...value,
                        detail: event.target.value,
                      }))
                    }
                    placeholder="รายละเอียดเพิ่มเติม"
                  />
                </label>
                <label>
                  จำนวนเริ่มต้น
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newStock.quantity}
                    onChange={(event) =>
                      setNewStock((value) => ({
                        ...value,
                        quantity: digitsOnly(event.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </label>
                <label>
                  หน่วย
                  <input
                    required
                    disabled={newStock.category === "bottle"}
                    value={
                      newStock.category === "bottle" ? "ห่อ" : newStock.unit
                    }
                    onChange={(event) =>
                      setNewStock((value) => ({
                        ...value,
                        unit: event.target.value,
                      }))
                    }
                    placeholder="ลัง"
                  />
                </label>
              </div>
              <footer>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddStock(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  เพิ่มสต็อก
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {showOemForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowOemForm(false)
          }
        >
          <section
            className="stock-modal oem-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-oem-title"
          >
            <header>
              <div>
                <small>ลูกค้า OEM</small>
                <h2 id="add-oem-title">เพิ่มลูกค้า OEM</h2>
                <p>กรอกชื่อและจำนวนห่อในสต็อก</p>
              </div>
              <button onClick={() => setShowOemForm(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <form onSubmit={addOem}>
              <div className="form-grid single-column">
                <label>
                  ชื่อ OEM
                  <input
                    value={oemName}
                    onChange={(event) => setOemName(event.target.value)}
                    placeholder="เช่น โรงแรมทวีชัย"
                    required
                  />
                </label>
                <label>
                  จำนวนห่อในสต็อก
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={oemQuantity}
                    onChange={(event) => setOemQuantity(digitsOnly(event.target.value))}
                    placeholder="0"
                    required
                  />
                </label>
              </div>
              <footer>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowOemForm(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  บันทึกลูกค้า
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {showFactoryForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowFactoryForm(false)
          }
        >
          <section
            className="stock-modal oem-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="factory-modal-title"
          >
            <header>
              <div>
                <small>Supplier</small>
                <h2 id="factory-modal-title">เพิ่มโรงงานขวด</h2>
                <p>สร้างโรงงานก่อนเพิ่มรายการขวด</p>
              </div>
              <button
                onClick={() => setShowFactoryForm(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </header>
            <form onSubmit={addFactory}>
              <div className="form-grid single-column">
                <label>
                  ชื่อโรงงานขวด
                  <input
                    required
                    value={factoryName}
                    onChange={(event) => setFactoryName(event.target.value)}
                    placeholder="เช่น โรงงานขวด ABC"
                  />
                </label>
              </div>
              <footer>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowFactoryForm(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  เพิ่มโรงงาน
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {showSupplierForm && selectedFactory && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowSupplierForm(false)
          }
        >
          <section
            className="stock-modal supplier-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-title"
          >
            <header>
              <div>
                <small>{selectedFactory.name}</small>
                <h2 id="supplier-modal-title">
                  {editingSupplier ? "แก้ไขรายการขวด" : "เพิ่มรายการขวด"}
                </h2>
                <p>ระบุขนาด ราคาต่อขวด และจำนวนขวดต่อห่อ</p>
              </div>
              <button
                onClick={() => setShowSupplierForm(false)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </header>
            <form onSubmit={saveSupplier}>
              <div className="form-grid">
                <label>
                  ขนาดขวด
                  <select
                    value={supplierDraft.sizeMl}
                    onChange={(event) =>
                      setSupplierDraft((value) => ({
                        ...value,
                        sizeMl: event.target.value,
                      }))
                    }
                  >
                    {supplierBottleSizes.map((size) => (
                      <option
                        key={size}
                        value={size}
                        disabled={
                          !editingSupplier &&
                          suppliers.some(
                            (item) =>
                              item.factoryId === selectedFactory.id &&
                              item.sizeMl === size,
                          )
                        }
                      >
                        {size.toLocaleString("th-TH")} ml
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  ราคาต่อขวด (บาท)
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+([.][0-9]{0,4})?"
                    value={supplierDraft.pricePerBottle}
                    onChange={(event) =>
                      setSupplierDraft((value) => ({
                        ...value,
                        pricePerBottle: decimalOnly(event.target.value),
                      }))
                    }
                    placeholder="0.0000"
                  />
                </label>
                <label>
                  จำนวนขวดต่อห่อ
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={supplierDraft.bottlesPerPack}
                    onChange={(event) =>
                      setSupplierDraft((value) => ({
                        ...value,
                        bottlesPerPack: digitsOnly(event.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </label>
              </div>
              <footer>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowSupplierForm(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn">
                  {editingSupplier ? "บันทึกการแก้ไข" : "เพิ่มรายการขวด"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {supplierToDelete && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSupplierToDelete(null)
          }
        >
          <section
            className="stock-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-description"
          >
            <header>
              <div>
                <small>ยืนยันการลบ</small>
                <h2 id="confirm-delete-title">ลบรายการขวดนี้หรือไม่?</h2>
                <p id="confirm-delete-description">
                  {
                    supplierFactories.find(
                      (factory) => factory.id === supplierToDelete.factoryId,
                    )?.name
                  }{" "}
                  · {supplierToDelete.sizeMl.toLocaleString("th-TH")} ml
                </p>
              </div>
              <button
                onClick={() => setSupplierToDelete(null)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>
                รายการที่ลบจะหายออกจากโรงงานทันที
                และระบบจะบันทึกไว้ในประวัติการแก้ไข
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSupplierToDelete(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={() => removeSupplier(supplierToDelete)}
              >
                ยืนยันการลบ
              </button>
            </footer>
          </section>
        </div>
      )}
      {factoryToDelete && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setFactoryToDelete(null)
          }
        >
          <section
            className="stock-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-factory-delete-title"
            aria-describedby="confirm-factory-delete-description"
          >
            <header>
              <div>
                <small>ยืนยันการลบโรงงาน</small>
                <h2 id="confirm-factory-delete-title">ลบ {factoryToDelete.name} หรือไม่?</h2>
                <p id="confirm-factory-delete-description">
                  มีรายการขวด {suppliers.filter((item) => item.factoryId === factoryToDelete.id).length.toLocaleString("th-TH")} รายการ
                </p>
              </div>
              <button onClick={() => setFactoryToDelete(null)} aria-label="ปิด"><X size={20} /></button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>โรงงานและรายการขวดทั้งหมดภายในจะถูกลบออก ระบบจะบันทึกเหตุการณ์นี้ไว้ในประวัติการแก้ไข</p>
            </div>
            <footer>
              <button type="button" className="cancel-btn" onClick={() => setFactoryToDelete(null)}>ยกเลิก</button>
              <button type="button" className="delete-confirm-btn" onClick={() => removeFactory(factoryToDelete)}>ลบโรงงานและรายการขวด</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
