"use client";

import Image from "next/image";
import {
  Boxes,
  Calculator,
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Factory,
  GlassWater,
  History,
  Home,
  LogOut,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  deleteRecord,
  InventoryRecord,
  OemRecord,
  OemPackPrice,
  OemPriceLog,
  ProductionMaterial,
  ProductionRecord,
  DeliverySetting,
  readAll,
  saveMany,
  saveRecord,
  SupplierFactory,
  SupplierLog,
  SupplierRecord,
} from "@/lib/database";
import { supabase } from "@/lib/supabase";

const navSections = [
  {
    title: "Overall",
    items: [
      { label: "ภาพรวม", icon: Home },
      { label: "สต็อก", icon: Boxes },
      { label: "การผลิต", icon: ClipboardList },
      { label: "Supplier", icon: Factory },
    ],
  },
  {
    title: "OEM",
    items: [
      { label: "ลูกค้า OEM", icon: Users },
      { label: "ราคา OEM", icon: Calculator },
    ],
  },
];
const navItems = navSections.flatMap((section) => section.items);
const mobilePrimaryItems = navItems.filter((item) =>
  ["ภาพรวม", "สต็อก", "Supplier"].includes(item.label),
);
const mobileMoreItems = navItems.filter(
  (item) => !mobilePrimaryItems.some((primary) => primary.label === item.label),
);
const activeMenuStorageKey = "taweechai-active-menu";
const isValidMenu = (value: string | null) =>
  Boolean(value && navItems.some((item) => item.label === value));
const supplierBottleSizes = [350, 500, 600, 780, 1500];
const digitsOnly = (value: string) => value.replace(/\D/g, "");
const decimalOnly = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...fractionParts] = cleaned.split(".");
  if (!fractionParts.length) return whole;
  return `${whole || "0"}.${fractionParts.join("").slice(0, 4)}`;
};
const initialOemPrices: OemPackPrice[] = [
  ["350", "350 ml"],
  ["500-600", "500/600 ml"],
  ["1500", "1,500 ml"],
].flatMap(([key, sizeLabel]) =>
  [100, 250].map((tierPacks) => ({
    id: `${key}-${tierPacks}`,
    sizeLabel,
    tierPacks,
    pricePerPack: 0,
    updatedAt: new Date(0).toISOString(),
  })),
);

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
    sizeMl: "350",
    pricePerPack: 35,
    productionRate: 0,
    fulfillmentType: "delivery",
    updatedAt: "2026-07-21T00:00:00.000Z",
  },
  {
    id: "oem-siam",
    name: "Siam Wellness",
    sizeMl: "500",
    pricePerPack: 33,
    productionRate: 0,
    fulfillmentType: "pickup",
    updatedAt: "2026-07-21T00:00:00.000Z",
  },
];

function StockTable({
  items,
  onEdit,
  onDelete,
}: {
  items: InventoryRecord[];
  onEdit: (item: InventoryRecord) => void;
  onDelete: (item: InventoryRecord) => void;
}) {
  return (
    <div className="inventory-table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th scope="col">ชื่อ</th>
            <th scope="col">จำนวน</th>
            <th scope="col" className="inventory-action-heading">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="inventory-table-name">
                  {item.color && (
                    <span
                      className="color-swatch"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </div>
                </div>
              </td>
              <td>
                <div className="inventory-table-quantity">
                  <strong>{item.quantity.toLocaleString("th-TH")}</strong>
                  <span>{item.unit}</span>
                </div>
              </td>
              <td>
                <div className="supplier-actions stock-card-actions">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label={`แก้ไข ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(item)}
                    aria-label={`ลบ ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && <p className="empty-state">ยังไม่มีรายการสต็อก</p>}
    </div>
  );
}

function SummaryCards({
  inventoryItemCount,
  bottleTotal,
  oemCustomerCount,
  supplierFactoryCount,
}: {
  inventoryItemCount: number;
  bottleTotal: number;
  oemCustomerCount: number;
  supplierFactoryCount: number;
}) {
  return (
    <section className="inventory-summary overview-summary" aria-label="สรุปการดำเนินงาน">
      <article>
        <span className="summary-icon blue">
          <Boxes />
        </span>
        <div>
          <small>รายการในคลัง</small>
          <strong>
            {inventoryItemCount.toLocaleString("th-TH")} <em>รายการ</em>
          </strong>
        </div>
      </article>
      <article>
        <span className="summary-icon teal">
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
        <span className="summary-icon violet">
          <Users />
        </span>
        <div>
          <small>ลูกค้า OEM</small>
          <strong>
            {oemCustomerCount.toLocaleString("th-TH")} <em>ราย</em>
          </strong>
        </div>
      </article>
      <article>
        <span className="summary-icon amber">
          <Factory />
        </span>
        <div>
          <small>โรงงาน Supplier</small>
          <strong>
            {supplierFactoryCount.toLocaleString("th-TH")} <em>โรงงาน</em>
          </strong>
        </div>
      </article>
    </section>
  );
}

function OemTable({
  items,
  onAdd,
  onEdit,
  onRemove,
}: {
  items: OemRecord[];
  onAdd: () => void;
  onEdit: (item: OemRecord) => void;
  onRemove: (item: OemRecord) => void;
}) {
  const pageSize = 20;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    if (!keyword) return items;
    return items.filter((item) =>
      item.name.toLocaleLowerCase("th").includes(keyword),
    );
  }, [items, query]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="oem-table-section">
      <div className="oem-table-toolbar">
        <label className="oem-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อยี่ห้อน้ำ"
            aria-label="ค้นหาชื่อยี่ห้อน้ำ"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้นหา">
              <X size={16} />
            </button>
          )}
        </label>
        <button type="button" className="secondary-btn oem-add-button" onClick={onAdd}>
          <Plus size={18} /> เพิ่มลูกค้า OEM
        </button>
      </div>

      <div className="oem-table-wrap">
        <table className="oem-table">
          <thead>
            <tr>
              <th>ชื่อยี่ห้อน้ำ</th>
              <th>ขนาด (มล.)</th>
              <th>ราคาต่อแพ็ค</th>
              <th>เรทผลิต</th>
              <th>ประเภทจัดส่ง</th>
              <th className="oem-action-heading">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td data-label="ชื่อยี่ห้อน้ำ">
                  <div className="oem-brand-cell">
                    <div>
                      <strong>{item.name}</strong>
                      <small>อัปเดต {new Date(item.updatedAt).toLocaleDateString("th-TH")}</small>
                    </div>
                  </div>
                </td>
                <td data-label="ขนาด (มล.)"><strong>{item.sizeMl || "—"}</strong></td>
                <td data-label="ราคาต่อแพ็ค"><strong className="oem-table-price">฿{item.pricePerPack.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td data-label="เรทผลิต"><strong>{item.productionRate.toLocaleString("th-TH")}</strong></td>
                <td data-label="ประเภทจัดส่ง">
                  <span className={`fulfillment-badge ${item.fulfillmentType}`}>
                    {item.fulfillmentType === "delivery" ? <Truck size={13} /> : <Package size={13} />}
                    {item.fulfillmentType === "delivery" ? "ไปส่ง" : "มารับเอง"}
                  </span>
                </td>
                <td data-label="Action">
                  <div className="supplier-actions oem-table-actions">
                    <button type="button" onClick={() => onEdit(item)} aria-label={`แก้ไข ${item.name}`}><Pencil size={16} /></button>
                    <button type="button" className="danger" onClick={() => onRemove(item)} aria-label={`ลบ ${item.name}`}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredItems.length && (
        <p className="empty-state">{query ? `ไม่พบยี่ห้อน้ำที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลลูกค้า OEM"}</p>
      )}

      {filteredItems.length > 0 && (
        <nav className="oem-pagination" aria-label="แบ่งหน้ารายการลูกค้า OEM">
          <span>แสดง {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)} จาก {filteredItems.length} รายการ</span>
          <div>
            <button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="หน้าก่อนหน้า"><ChevronLeft size={17} /></button>
            <strong>หน้า {currentPage} / {totalPages}</strong>
            <button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} aria-label="หน้าถัดไป"><ChevronRight size={17} /></button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [active, setActive] = useState("ภาพรวม");
  const [activeMenuReady, setActiveMenuReady] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [brandTab, setBrandTab] = useState("เนบิวลา");
  const [inventory, setInventory] =
    useState<InventoryRecord[]>(initialInventory);
  const [oemItems, setOemItems] = useState<OemRecord[]>(initialOem);
  const [oemName, setOemName] = useState("");
  const [oemSizeMl, setOemSizeMl] = useState("350");
  const [oemPricePerPack, setOemPricePerPack] = useState("");
  const [oemProductionRate, setOemProductionRate] = useState("");
  const [oemFulfillmentType, setOemFulfillmentType] = useState<"delivery" | "pickup">("pickup");
  const [showOemForm, setShowOemForm] = useState(false);
  const [editingOem, setEditingOem] = useState<OemRecord | null>(null);
  const [oemSaveError, setOemSaveError] = useState("");
  const [oemSaving, setOemSaving] = useState(false);
  const [oemPrices, setOemPrices] = useState<OemPackPrice[]>(initialOemPrices);
  const [oemPriceLogs, setOemPriceLogs] = useState<OemPriceLog[]>([]);
  const priceBeforeEdit = useRef<Record<string, number>>({});
  const [isEditingOemPrices, setIsEditingOemPrices] = useState(false);
  const [oemPriceSaving, setOemPriceSaving] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState({
    distance: "",
    fuelEfficiency: "11.5",
    fuelPrice: "",
    packsPerTrip: "250",
    trips: "1",
  });
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
  const [stockToDelete, setStockToDelete] = useState<InventoryRecord | null>(
    null,
  );
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [editingProduction, setEditingProduction] =
    useState<ProductionRecord | null>(null);
  const [productionToCancel, setProductionToCancel] =
    useState<ProductionRecord | null>(null);
  const [productionError, setProductionError] = useState("");
  const [productionDraft, setProductionDraft] = useState({
    productType: "bottled" as "bottled" | "glass",
    brand: "เนบิวลา",
    sizeMl: "350",
    producedAt: new Date().toISOString().slice(0, 10),
    bottleInventoryId: "",
    bottleQuantity: "",
    capInventoryId: "",
    capQuantity: "",
    cupInventoryId: "",
    cupQuantity: "",
    crateInventoryId: "",
    crateQuantity: "",
    note: "",
  });
  const [oemToDelete, setOemToDelete] = useState<OemRecord | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const savedMenu = window.localStorage.getItem(activeMenuStorageKey);
        if (isValidMenu(savedMenu)) setActive(savedMenu!);
      }
      setSession(data.session);
      setActiveMenuReady(true);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        setActive("ภาพรวม");
        window.localStorage.setItem(activeMenuStorageKey, "ภาพรวม");
        setShowMobileMore(false);
        setShowLogoutConfirm(false);
      }
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeMenuReady || !session || !isValidMenu(active)) return;
    window.localStorage.setItem(activeMenuStorageKey, active);
  }, [active, activeMenuReady, session]);

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

  useEffect(() => {
    if (!session) return;
    readAll<ProductionRecord>("productions")
      .then((items) => setProductions(items))
      .catch(() => setProductions([]));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      readAll<OemPackPrice>("oemPackPrices"),
      readAll<DeliverySetting>("deliverySettings"),
      readAll<OemPriceLog>("oemPriceLogs"),
    ])
      .then(([prices, settings, logs]) => {
        if (prices.length) setOemPrices(prices);
        if (settings[0])
          setDeliveryDraft((value) => ({
            ...value,
            fuelEfficiency: String(settings[0].fuelEfficiency),
          }));
        setOemPriceLogs(logs);
      })
      .catch(() => undefined);
  }, [session]);

  const bottleSize = (item: InventoryRecord) =>
    Number(item.id.match(/(\d+)/)?.[1] ?? 99999);
  const bottles = inventory
    .filter((item) => item.category === "bottle")
    .sort((a, b) => bottleSize(a) - bottleSize(b));
  const caps = inventory.filter((item) => item.category === "cap");
  const tanks = inventory.filter((item) => item.category === "tank");
  const isGlassCrate = (item: InventoryRecord) =>
    item.category === "glass" &&
    (item.id.startsWith("GLASS-CRATE") || item.name.includes("ลังน้ำแก้ว"));
  const cups = inventory.filter(
    (item) => item.category === "glass" && !isGlassCrate(item),
  );
  const glassCrates = inventory.filter(isGlassCrate);
  const bottleTotal = bottles.reduce((sum, item) => sum + item.quantity, 0);
  const capTotal = caps.reduce((sum, item) => sum + item.quantity, 0);
  const tankTotal = tanks.reduce((sum, item) => sum + item.quantity, 0);
  const cupTotal = cups.reduce((sum, item) => sum + item.quantity, 0);
  const glassCrateTotal = glassCrates.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const oemPickupCount = oemItems.filter(
    (item) => item.fulfillmentType === "pickup",
  ).length;
  const oemDeliveryCount = oemItems.length - oemPickupCount;
  const latestSupplierLog = [...supplierLogs].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
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
    if (stockToDelete?.id !== item.id) {
      setStockToDelete(item);
      return;
    }
    setInventory((items) => items.filter((entry) => entry.id !== item.id));
    await deleteRecord("inventory", item.id);
    setStockToDelete(null);
  };

  const addStock = async (event: FormEvent) => {
    event.preventDefault();
    const isNewGlassCrate = newStock.category === "glassCrate";
    const record: InventoryRecord = {
      id: isNewGlassCrate
        ? `GLASS-CRATE-${crypto.randomUUID()}`
        : newStock.category === "glass"
          ? `CUP-${crypto.randomUUID()}`
          : `CUSTOM-${crypto.randomUUID()}`,
      category: (isNewGlassCrate
        ? "glass"
        : newStock.category) as InventoryRecord["category"],
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

  const openAddProduction = () => {
    const defaultBottle = bottles.find(
      (item) => item.brand === "เนบิวลา" && bottleSize(item) === 350,
    );
    setEditingProduction(null);
    setProductionError("");
    setProductionDraft({
      productType: "bottled",
      brand: "เนบิวลา",
      sizeMl: "350",
      producedAt: new Date().toISOString().slice(0, 10),
      bottleInventoryId: defaultBottle?.id ?? "",
      bottleQuantity: "",
      capInventoryId: caps[0]?.id ?? "",
      capQuantity: "",
      cupInventoryId: cups[0]?.id ?? "",
      cupQuantity: "",
      crateInventoryId: glassCrates[0]?.id ?? "",
      crateQuantity: "",
      note: "",
    });
    setShowProductionForm(true);
  };

  const openEditProduction = (production: ProductionRecord) => {
    const materialByCategory = (category: InventoryRecord["category"], crate = false) =>
      production.materials.find((material) => {
        const stock = inventory.find((item) => item.id === material.inventoryId);
        return stock?.category === category && (category !== "glass" || isGlassCrate(stock) === crate);
      });
    const bottleMaterial = materialByCategory("bottle");
    const capMaterial = materialByCategory("cap");
    const cupMaterial = materialByCategory("glass", false);
    const crateMaterial = materialByCategory("glass", true);
    setEditingProduction(production);
    setProductionError("");
    setProductionDraft({
      productType: production.productType,
      brand: production.brand ?? "เนบิวลา",
      sizeMl: production.sizeMl ?? "350",
      producedAt: production.producedAt.slice(0, 10),
      bottleInventoryId: bottleMaterial?.inventoryId ?? "",
      bottleQuantity: bottleMaterial ? String(bottleMaterial.quantity) : "",
      capInventoryId: capMaterial?.inventoryId ?? "",
      capQuantity: capMaterial ? String(capMaterial.quantity) : "",
      cupInventoryId: cupMaterial?.inventoryId ?? "",
      cupQuantity: cupMaterial ? String(cupMaterial.quantity) : "",
      crateInventoryId: crateMaterial?.inventoryId ?? "",
      crateQuantity: crateMaterial ? String(crateMaterial.quantity) : "",
      note: production.note,
    });
    setShowProductionForm(true);
  };

  const saveProduction = async (event: FormEvent) => {
    event.preventDefault();
    setProductionError("");
    const materialDrafts =
      productionDraft.productType === "bottled"
        ? [
            [productionDraft.bottleInventoryId, productionDraft.bottleQuantity],
            [productionDraft.capInventoryId, productionDraft.capQuantity],
          ]
        : [
            [productionDraft.cupInventoryId, productionDraft.cupQuantity],
            [productionDraft.crateInventoryId, productionDraft.crateQuantity],
          ];
    if (materialDrafts.some(([id, quantity]) => !id || Number(quantity) <= 0)) {
      setProductionError("กรุณาเลือกวัตถุดิบและกรอกจำนวนที่ใช้ให้ครบ");
      return;
    }
    const materials: ProductionMaterial[] = materialDrafts.map(([id, quantity]) => {
      const stock = inventory.find((item) => item.id === id)!;
      return {
        inventoryId: id,
        name: stock.name,
        quantity: Number(quantity),
        unit: stock.unit,
      };
    });
    const restoredInventory = inventory.map((item) => {
      const oldMaterial = editingProduction?.status === "active"
        ? editingProduction.materials.find((material) => material.inventoryId === item.id)
        : undefined;
      return oldMaterial
        ? { ...item, quantity: item.quantity + oldMaterial.quantity }
        : item;
    });
    const insufficient = materials.find((material) => {
      const stock = restoredInventory.find((item) => item.id === material.inventoryId);
      return !stock || stock.quantity < material.quantity;
    });
    if (insufficient) {
      const stock = restoredInventory.find((item) => item.id === insufficient.inventoryId);
      setProductionError(
        insufficient.name + " คงเหลือ " + (stock?.quantity ?? 0) + " " + insufficient.unit + " ไม่เพียงพอ",
      );
      return;
    }
    const adjustedInventory = restoredInventory.map((item) => {
      const used = materials.find((material) => material.inventoryId === item.id);
      return used ? { ...item, quantity: item.quantity - used.quantity } : item;
    });
    const now = new Date().toISOString();
    const action = editingProduction ? "updated" : "created";
    const record: ProductionRecord = {
      id: editingProduction?.id ?? crypto.randomUUID(),
      productType: productionDraft.productType,
      brand: productionDraft.productType === "bottled" ? productionDraft.brand : undefined,
      sizeMl: productionDraft.productType === "bottled" ? productionDraft.sizeMl : undefined,
      outputQuantity: 0,
      outputUnit: "-",
      materials,
      note: productionDraft.note.trim(),
      status: "active",
      producedAt: new Date(productionDraft.producedAt + "T12:00:00").toISOString(),
      createdAt: editingProduction?.createdAt ?? now,
      updatedAt: now,
      revisions: [
        ...(editingProduction?.revisions ?? []),
        {
          id: crypto.randomUUID(),
          action,
          summary: (editingProduction ? "แก้ไข" : "บันทึก") + "การผลิต ใช้วัตถุดิบ " + materials.map((item) => item.name + " " + item.quantity + " " + item.unit).join(", "),
          createdAt: now,
        },
      ],
    };
    try {
      await Promise.all([
        saveMany("inventory", adjustedInventory),
        saveRecord("productions", record),
      ]);
      setInventory(adjustedInventory);
      setProductions((items) =>
        editingProduction
          ? items.map((item) => (item.id === record.id ? record : item))
          : [record, ...items],
      );
      setShowProductionForm(false);
      setEditingProduction(null);
    } catch {
      setProductionError("บันทึกไม่สำเร็จ กรุณาตรวจสอบว่าติดตั้งตารางการผลิตแล้ว");
    }
  };

  const cancelProduction = async (production: ProductionRecord) => {
    const restoredInventory = inventory.map((item) => {
      const used = production.materials.find((material) => material.inventoryId === item.id);
      return used ? { ...item, quantity: item.quantity + used.quantity } : item;
    });
    await Promise.all([
      saveMany("inventory", restoredInventory),
      deleteRecord("productions", production.id),
    ]);
    setInventory(restoredInventory);
    setProductions((items) => items.filter((item) => item.id !== production.id));
    setProductionToCancel(null);
  };

  const closeOemForm = () => {
    setShowOemForm(false);
    setEditingOem(null);
    setOemSaveError("");
    setOemSaving(false);
    setOemName("");
    setOemSizeMl("350");
    setOemPricePerPack("");
    setOemProductionRate("");
    setOemFulfillmentType("pickup");
  };

  const openAddOem = () => {
    setEditingOem(null);
    setOemSaveError("");
    setOemSaving(false);
    setOemName("");
    setOemSizeMl("350");
    setOemPricePerPack("");
    setOemProductionRate("");
    setOemFulfillmentType("pickup");
    setShowOemForm(true);
  };

  const openEditOem = (item: OemRecord) => {
    setEditingOem(item);
    setOemSaveError("");
    setOemSaving(false);
    setOemName(item.name);
    setOemSizeMl(item.sizeMl === "500/600" ? "500" : item.sizeMl || "350");
    setOemPricePerPack(String(item.pricePerPack));
    setOemProductionRate(String(item.productionRate));
    setOemFulfillmentType(item.fulfillmentType);
    setShowOemForm(true);
  };

  const saveOem = async (event: FormEvent) => {
    event.preventDefault();
    const pricePerPack = Number(oemPricePerPack);
    const productionRate = Number(oemProductionRate);
    if (!oemName.trim() || !Number.isFinite(pricePerPack) || pricePerPack < 0 || !Number.isFinite(productionRate) || productionRate < 0) return;
    const item: OemRecord = {
      id: editingOem?.id ?? crypto.randomUUID(),
      name: oemName.trim(),
      sizeMl: oemSizeMl,
      pricePerPack,
      productionRate,
      fulfillmentType: oemFulfillmentType,
      updatedAt: new Date().toISOString(),
    };
    setOemSaveError("");
    setOemSaving(true);
    try {
      await saveRecord("oem", item);
      setOemItems((items) =>
        editingOem
          ? items.map((entry) => (entry.id === item.id ? item : entry))
          : [...items, item],
      );
      closeOemForm();
    } catch {
      setOemSaveError("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setOemSaving(false);
    }
  };

  const removeOem = async (item: OemRecord) => {
    if (oemToDelete?.id !== item.id) {
      setOemToDelete(item);
      return;
    }
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

  const saveOemPrice = async (price: OemPackPrice, value: string) => {
    const oldPrice = priceBeforeEdit.current[price.id] ?? price.pricePerPack;
    const newPrice = Number(value) || 0;
    if (oldPrice === newPrice) return;
    const now = new Date().toISOString();
    const updated = { ...price, pricePerPack: newPrice, updatedAt: now };
    const log: OemPriceLog = {
      id: crypto.randomUUID(),
      priceId: price.id,
      sizeLabel: price.sizeLabel,
      tierPacks: price.tierPacks,
      oldPrice,
      newPrice,
      createdAt: now,
    };
    setOemPrices((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
    setOemPriceLogs((items) => [log, ...items]);
    await Promise.all([
      saveRecord("oemPackPrices", updated),
      saveRecord("oemPriceLogs", log),
    ]);
  };

  const beginOemPriceEdit = () => {
    priceBeforeEdit.current = Object.fromEntries(
      oemPrices.map((price) => [price.id, price.pricePerPack]),
    );
    setIsEditingOemPrices(true);
  };

  const cancelOemPriceEdit = () => {
    setOemPrices((items) =>
      items.map((item) => ({
        ...item,
        pricePerPack:
          priceBeforeEdit.current[item.id] ?? item.pricePerPack,
      })),
    );
    setIsEditingOemPrices(false);
  };

  const saveAllOemPrices = async () => {
    const changedPrices = oemPrices.filter(
      (price) =>
        (priceBeforeEdit.current[price.id] ?? price.pricePerPack) !==
        price.pricePerPack,
    );
    if (!changedPrices.length) {
      setIsEditingOemPrices(false);
      return;
    }
    setOemPriceSaving(true);
    try {
      await Promise.all(
        changedPrices.map((price) =>
          saveOemPrice(price, String(price.pricePerPack)),
        ),
      );
      setIsEditingOemPrices(false);
    } finally {
      setOemPriceSaving(false);
    }
  };
  const saveFuelEfficiency = async () => {
    const fuelEfficiency = Number(deliveryDraft.fuelEfficiency);
    if (fuelEfficiency <= 0) return;
    await saveRecord("deliverySettings", {
      id: "pickup",
      fuelEfficiency,
      updatedAt: new Date().toISOString(),
    } as DeliverySetting);
  };
  const deliveryResult = useMemo(() => {
    const packsPerTrip = Number(deliveryDraft.packsPerTrip) || 0,
      trips = Number(deliveryDraft.trips) || 0,
      distance = Number(deliveryDraft.distance) || 0,
      efficiency = Number(deliveryDraft.fuelEfficiency) || 0,
      fuelPrice = Number(deliveryDraft.fuelPrice) || 0;
    const liters = efficiency > 0 ? (distance * trips) / efficiency : 0;
    const fuelTotal = liters * fuelPrice;
    const totalPacks = packsPerTrip * trips;
    const fuelPerPack = totalPacks > 0 ? fuelTotal / totalPacks : 0;
    return {
      packsPerTrip,
      totalPacks,
      liters,
      fuelTotal,
      fuelPerPack,
    };
  }, [deliveryDraft]);

  const enterApp = async () => {
    setAuthLoading(true);
    setAuthMessage("");
    setActive("ภาพรวม");
    setShowMobileMore(false);
    setShowLogoutConfirm(false);
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
            src="/insight-taweechai-logo-hd.png"
            alt="Taweechai Drinking Water"
            width={1776}
            height={887}
            sizes="(max-width: 760px) 310px, 350px"
            quality={100}
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
            <span>{authLoading ? "Loading..." : "Taweechai"}</span>
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
            <strong>Taweechai</strong>
            <small>Stock management</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="เมนูหลัก">
          {navSections.map((section) => (
            <section
              className="side-nav-section"
              key={section.title}
              aria-labelledby={`nav-section-${section.title.toLowerCase()}`}
            >
              <p
                className="nav-caption"
                id={`nav-section-${section.title.toLowerCase()}`}
              >
                {section.title}
              </p>
              {section.items.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={active === label ? "active" : ""}
                  onClick={() => goTo(label)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </section>
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
            <small>Taweechai</small>
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
                    <Home size={16} /> ภาพรวม Taweechai
                  </p>
                  <h1>สรุปคลังสินค้าปัจจุบัน</h1>
                  <p>
                    ภาพรวมสต็อก ลูกค้า OEM และข้อมูลจัดซื้อจากฐานข้อมูล Cloud ล่าสุด
                  </p>
                </div>
              </section>
              <SummaryCards
                inventoryItemCount={inventory.length}
                bottleTotal={bottleTotal}
                oemCustomerCount={oemItems.length}
                supplierFactoryCount={supplierFactories.length}
              />
              <section className="overview-grid">
                <article className="panel overview-panel overview-stock-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ภาพรวมสต็อกตามประเภท</h2>
                      <p>แสดงจำนวนด้วยหน่วยจริงของแต่ละประเภท</p>
                    </div>
                    <button className="text-link" onClick={() => goTo("สต็อก")}>
                      จัดการสต็อก <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="overview-stock-grid">
                    {[
                      { label: "ขวดน้ำ", value: bottleTotal, unit: "ห่อ", tone: "blue" },
                      { label: "ฝาขวด", value: capTotal, unit: "ลัง", tone: "cyan" },
                      { label: "ถังน้ำ", value: tankTotal, unit: "ถัง", tone: "navy" },
                      { label: "แก้ว", value: cupTotal, unit: "ลัง", tone: "sky" },
                      { label: "ลังน้ำแก้ว", value: glassCrateTotal, unit: "ลัง", tone: "slate" },
                    ].map((item) => (
                      <div className={"overview-stock-item " + item.tone} key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value.toLocaleString("th-TH")}</strong>
                        <small>{item.unit}</small>
                      </div>
                    ))}
                  </div>
                  <div className="overview-brand-strip">
                    <span>ขวดแยกตามแบรนด์</span>
                    <div>
                      <strong>เนบิวลา {bottles.filter((item) => item.brand === "เนบิวลา").reduce((sum, item) => sum + item.quantity, 0).toLocaleString("th-TH")} ห่อ</strong>
                      <strong>พีพี {bottles.filter((item) => item.brand === "พีพี").reduce((sum, item) => sum + item.quantity, 0).toLocaleString("th-TH")} ห่อ</strong>
                    </div>
                  </div>
                </article>
                <article className="panel overview-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ภาพรวมลูกค้า OEM</h2>
                      <p>รูปแบบการรับสินค้าและข้อมูลล่าสุด</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => goTo("ลูกค้า OEM")}
                    >
                      ดูทั้งหมด <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="overview-oem-stats">
                    <div><Truck size={18} /><span>ไปส่ง</span><strong>{oemDeliveryCount} ราย</strong></div>
                    <div><Package size={18} /><span>มารับเอง</span><strong>{oemPickupCount} ราย</strong></div>
                  </div>
                  <div className="attention-list">
                    {latestOem.map((item) => (
                      <div key={item.id}>
                        <p>
                          <strong>{item.name}</strong>
                          <small>
                            {new Date(item.updatedAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </small>
                        </p>
                        <em>
                          ฿{item.pricePerPack.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / แพ็ค · {item.fulfillmentType === "delivery" ? "ไปส่ง" : "มารับเอง"}
                        </em>
                      </div>
                    ))}
                    {!latestOem.length && <p className="overview-empty">ยังไม่มีข้อมูลลูกค้า OEM</p>}
                  </div>
                </article>
                <article className="panel overview-panel overview-supplier-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ข้อมูลจัดซื้อ Supplier</h2>
                      <p>โรงงานและรายการราคาขวดที่บันทึกไว้</p>
                    </div>
                    <button className="text-link" onClick={() => goTo("Supplier")}>
                      ดู Supplier <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="overview-supplier-stats">
                    <div><span>โรงงานขวด</span><strong>{supplierFactories.length.toLocaleString("th-TH")} <small>โรงงาน</small></strong></div>
                    <div><span>รายการราคาขวด</span><strong>{suppliers.length.toLocaleString("th-TH")} <small>รายการ</small></strong></div>
                  </div>
                  <div className="overview-latest-update">
                    <History size={18} />
                    <div>
                      <span>อัปเดตล่าสุด</span>
                      {latestSupplierLog ? (
                        <>
                          <strong>{latestSupplierLog.factory}</strong>
                          <small>{latestSupplierLog.summary}</small>
                        </>
                      ) : (
                        <small>ยังไม่มีประวัติการเปลี่ยนแปลง</small>
                      )}
                    </div>
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
                    ตรวจสอบ แก้ไข และลบจำนวนคงเหลือ ระบบจะบันทึกลงฐานข้อมูลทันที
                  </p>
                </div>
                <button
                  className="secondary-btn add-stock-button"
                  onClick={() => setShowAddStock(true)}
                >
                  <Plus size={18} /> เพิ่มสต็อก
                </button>
              </section>
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
                  <StockTable
                    items={bottles.filter((item) => item.brand === brandTab)}
                    onEdit={openStock}
                    onDelete={setStockToDelete}
                  />
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>สต็อกฝาขวด</h2>
                      <p>จำนวนฝาแยกตามสี หน่วยเป็นลัง</p>
                    </div>
                  </div>
                  <StockTable
                    items={caps}
                    onEdit={openStock}
                    onDelete={setStockToDelete}
                  />
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>สต็อกถังน้ำ</h2>
                      <p>ถังขาว 18 ลิตรและถังใส</p>
                    </div>
                  </div>
                  <StockTable
                    items={tanks}
                    onEdit={openStock}
                    onDelete={setStockToDelete}
                  />
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>แก้ว</h2>
                      <p>แก้วสำหรับบรรจุน้ำดื่ม</p>
                    </div>
                  </div>
                  <StockTable
                    items={cups}
                    onEdit={openStock}
                    onDelete={setStockToDelete}
                  />
                </section>
                <section className="panel inventory-section">
                  <div className="section-heading">
                    <div>
                      <h2>ลังน้ำแก้ว</h2>
                      <p>ลังสำหรับจัดเก็บขวดน้ำแก้ว</p>
                    </div>
                  </div>
                  <StockTable
                    items={glassCrates}
                    onEdit={openStock}
                    onDelete={setStockToDelete}
                  />
                </section>
              </div>
            </>
          )}

          {active === "การผลิต" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <ClipboardList size={16} /> การผลิต
                  </p>
                  <h1>บันทึกการผลิตของร้าน</h1>
                  <p>หักวัตถุดิบจากสต็อกของร้าน พร้อมแก้ไขส่วนต่างและคืนสต็อกเมื่อยกเลิกรายการ</p>
                </div>
                <button className="secondary-btn add-stock-button" onClick={openAddProduction}>
                  <Plus size={18} /> บันทึกการผลิต
                </button>
              </section>
              <section className="panel production-panel-page">
                <div className="section-heading">
                  <div>
                    <h2>รายการผลิต</h2>
                    <p>{productions.filter((item) => item.status === "active").length} รายการ · ไม่รวมการผลิต OEM</p>
                  </div>
                </div>
                <div className="production-table-wrap">
                  <table className="production-table">
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>ประเภท</th>
                        <th>วัตถุดิบที่ใช้</th>
                        <th>สถานะ</th>
                        <th className="inventory-action-heading">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productions
                        .filter((item) => item.status === "active")
                        .sort((a, b) => b.producedAt.localeCompare(a.producedAt))
                        .map((production) => (
                          <tr key={production.id} className={production.status === "cancelled" ? "cancelled" : ""}>
                            <td>{new Date(production.producedAt).toLocaleDateString("th-TH")}</td>
                            <td>
                              <strong>
                                {production.productType === "bottled"
                                  ? production.brand + " " + Number(production.sizeMl).toLocaleString("th-TH") + " ml"
                                  : "น้ำดื่มบรรจุแก้ว"}
                              </strong>
                              {production.note && <small>{production.note}</small>}
                            </td>
                            <td>
                              <div className="production-materials">
                                {production.materials.map((material) => (
                                  <span key={material.inventoryId}>{material.name} {material.quantity} {material.unit}</span>
                                ))}
                              </div>
                            </td>
                            <td><span className={"production-status " + production.status}>{production.status === "active" ? "บันทึกแล้ว" : "ยกเลิกแล้ว"}</span></td>
                            <td>
                              <div className="supplier-actions">
                                <button type="button" disabled={production.status === "cancelled"} onClick={() => openEditProduction(production)} aria-label="แก้ไขรายการผลิต"><Pencil size={16} /></button>
                                <button type="button" className="danger" disabled={production.status === "cancelled"} onClick={() => setProductionToCancel(production)} aria-label="ยกเลิกรายการผลิต"><X size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!productions.some((item) => item.status === "active") && <p className="empty-state">ยังไม่มีรายการผลิต กด “บันทึกการผลิต” เพื่อเริ่มต้น</p>}
                </div>
              </section>
            </>
          )}

          {active === "ลูกค้า OEM" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Users size={16} /> ลูกค้า OEM
                  </p>
                  <h1>ข้อมูลราคาและการรับสินค้า</h1>
                  <p>
                    จัดเก็บราคาต่อแพ็คและรูปแบบการรับสินค้าของลูกค้าแต่ละราย
                  </p>
                </div>
              </section>
              <section className="oem-page-grid single">
                <article className="panel oem-directory">
                  <div className="section-heading">
                    <div>
                      <h2>รายการลูกค้า OEM</h2>
                      <p>
                        {oemItems.length} ลูกค้า · แสดงราคาปัจจุบันและการรับสินค้า
                      </p>
                    </div>
                  </div>
                  <OemTable
                    items={oemItems}
                    onAdd={openAddOem}
                    onEdit={openEditOem}
                    onRemove={setOemToDelete}
                  />
                </article>
              </section>
            </>
          )}

          {active === "ราคา OEM" && (
            <>
              <section className="welcome inventory-welcome">
                <div>
                  <p className="eyebrow">
                    <Calculator size={16} /> ราคา OEM
                  </p>
                  <h1>ราคาต่อแพ็คและราคาจัดส่ง</h1>
                  <p>ดูเรทปัจจุบันและคำนวณค่าน้ำมันต่อแพ็คจากระยะทางไป–กลับ</p>
                </div>
              </section>
              <section className="oem-pricing-layout">
                <article className="panel oem-price-panel">
                  <div className="section-heading">
                    <div>
                      <h2>ราคาต่อแพ็คปัจจุบัน</h2>
                      <p>
                        {isEditingOemPrices
                          ? "กำลังแก้ไขราคา กรุณาบันทึกเมื่อเสร็จ"
                          : "เรท 100 และ 250 แพ็ค · กดแก้ไขก่อนเปลี่ยนราคา"}
                      </p>
                    </div>
                    <div className="oem-price-edit-actions">
                      {isEditingOemPrices ? (
                        <>
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={cancelOemPriceEdit}
                            disabled={oemPriceSaving}
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            className="save-btn"
                            onClick={saveAllOemPrices}
                            disabled={oemPriceSaving}
                          >
                            {oemPriceSaving ? "กำลังบันทึก..." : "บันทึกราคา"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="secondary-btn oem-price-edit-button"
                          onClick={beginOemPriceEdit}
                        >
                          <Pencil size={16} /> แก้ไขราคา
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="oem-price-table">
                    <div className="oem-price-head">
                      <span>ขนาด</span>
                      <span>เรท 100</span>
                      <span>เรท 250</span>
                    </div>
                    {["350 ml", "500/600 ml", "1,500 ml"].map((size) => (
                      <div className="oem-price-row" key={size}>
                        <strong>{size}</strong>
                        {[100, 250].map((tier) => {
                          const price = oemPrices.find(
                            (item) =>
                              item.sizeLabel === size &&
                              item.tierPacks === tier,
                          )!;
                          return (
                            <label key={tier}>
                              ฿
                              <input
                                aria-label={`${size} เรท ${tier} แพ็ค`}
                                inputMode="decimal"
                                disabled={!isEditingOemPrices}
                                value={price?.pricePerPack ?? 0}
                                onChange={(event) =>
                                  setOemPrices((items) =>
                                    items.map((item) =>
                                      item.id === price.id
                                        ? {
                                            ...item,
                                            pricePerPack: Number(
                                              decimalOnly(event.target.value),
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="oem-price-history"><div className="section-heading"><div><h2>ประวัติการแก้ไขราคา</h2><p>บันทึกราคาเดิมและราคาใหม่</p></div><History size={18} /></div><div className="oem-price-log-list">{[...oemPriceLogs].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map((log)=><article key={log.id}><span className="log-dot updated"/><div><strong>{log.sizeLabel} · เรท {log.tierPacks} แพ็ค</strong><p>฿{log.oldPrice.toFixed(2)} → ฿{log.newPrice.toFixed(2)}</p><small>{new Date(log.createdAt).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}</small></div></article>)}</div>{!oemPriceLogs.length&&<p className="empty-state">ยังไม่มีประวัติการแก้ไขราคา</p>}</div>
                </article>
                <article className="panel delivery-calculator">
                  <div className="section-heading">
                    <div>
                      <h2>คำนวณค่าน้ำมันต่อแพ็ค</h2>
                      <p>คำนวณจากจำนวนแพ็คที่รถขนส่งได้ต่อเที่ยว · ค่าเริ่มต้น 11.5 กม./ลิตร</p>
                    </div>
                  </div>
                  <div className="delivery-form">
                    <label>
                      ระยะทางไป–กลับ (กม.)
                      <input
                        inputMode="decimal"
                        value={deliveryDraft.distance}
                        onChange={(event) =>
                          setDeliveryDraft((value) => ({
                            ...value,
                            distance: decimalOnly(event.target.value),
                          }))
                        }
                        placeholder="0"
                      />
                    </label>
                    <label>
                      อัตราสิ้นเปลือง (กม./ลิตร)
                      <input
                        inputMode="decimal"
                        value={deliveryDraft.fuelEfficiency}
                        onChange={(event) =>
                          setDeliveryDraft((value) => ({
                            ...value,
                            fuelEfficiency: decimalOnly(event.target.value),
                          }))
                        }
                        onBlur={saveFuelEfficiency}
                      />
                    </label>
                    <label>
                      ราคาน้ำมัน (บาท/ลิตร)
                      <input
                        inputMode="decimal"
                        value={deliveryDraft.fuelPrice}
                        onChange={(event) =>
                          setDeliveryDraft((value) => ({
                            ...value,
                            fuelPrice: decimalOnly(event.target.value),
                          }))
                        }
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      จำนวนแพ็คต่อเที่ยว
                      <input
                        inputMode="numeric"
                        value={deliveryDraft.packsPerTrip}
                        onChange={(event) =>
                          setDeliveryDraft((value) => ({
                            ...value,
                            packsPerTrip: digitsOnly(event.target.value),
                          }))
                        }
                        placeholder="250"
                      />
                    </label>
                    <label>
                      จำนวนเที่ยว
                      <input
                        inputMode="numeric"
                        value={deliveryDraft.trips}
                        onChange={(event) =>
                          setDeliveryDraft((value) => ({
                            ...value,
                            trips: digitsOnly(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="delivery-result">
                    <div>
                      <span>จำนวนแพ็คต่อเที่ยว</span>
                      <strong>{deliveryResult.packsPerTrip.toLocaleString("th-TH")} แพ็ค</strong>
                    </div>
                    <div>
                      <span>น้ำมันที่ใช้</span>
                      <strong>{deliveryResult.liters.toFixed(2)} ลิตร</strong>
                    </div>
                    <div>
                      <span>ค่าน้ำมันรวม</span>
                      <strong>฿{deliveryResult.fuelTotal.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>จำนวนแพ็ครวมทุกเที่ยว</span>
                      <strong>{deliveryResult.totalPacks.toLocaleString("th-TH")} แพ็ค</strong>
                    </div>
                    <div className="delivery-total">
                      <span>ค่าน้ำมันต่อแพ็ค</span>
                      <strong>฿{deliveryResult.fuelPerPack.toFixed(2)}</strong>
                    </div>
                  </div>
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
        {mobilePrimaryItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={active === label ? "active" : ""}
            onClick={() => goTo(label)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={mobileMoreItems.some((item) => item.label === active) ? "active" : ""}
          onClick={() => setShowMobileMore(true)}
          aria-haspopup="dialog"
          aria-expanded={showMobileMore}
        >
          <MoreHorizontal size={21} />
          <span>เพิ่มเติม</span>
        </button>
      </nav>
      {showMobileMore && (
        <div
          className="mobile-more-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowMobileMore(false)
          }
        >
          <section
            className="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <header>
              <div>
                <small>เมนู</small>
                <h2 id="mobile-more-title">เพิ่มเติม</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMore(false)}
                aria-label="ปิดเมนูเพิ่มเติม"
              >
                <X size={20} />
              </button>
            </header>
            <div className="mobile-more-list">
              {mobileMoreItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className={active === label ? "active" : ""}
                  onClick={() => {
                    goTo(label);
                    setShowMobileMore(false);
                  }}
                >
                  <span className="mobile-more-icon"><Icon size={21} /></span>
                  <span><strong>{label}</strong><small>เปิดเมนู {label}</small></span>
                  <ChevronRight size={18} />
                </button>
              ))}
              <button
                type="button"
                className="mobile-logout-item"
                onClick={() => {
                  setShowMobileMore(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <span className="mobile-more-icon"><LogOut size={21} /></span>
                <span><strong>ออกจากระบบ</strong><small>กลับไปยังหน้าเข้าสู่ระบบ</small></span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        </div>
      )}
      {showLogoutConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowLogoutConfirm(false)
          }
        >
          <section
            className="stock-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
          >
            <header>
              <div>
                <small>ยืนยันการออกจากระบบ</small>
                <h2 id="logout-confirm-title">ต้องการออกจากระบบหรือไม่?</h2>
                <p>คุณสามารถกด Taweechai เพื่อเข้าใช้งานใหม่ได้</p>
              </div>
              <button type="button" onClick={() => setShowLogoutConfirm(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <footer>
              <button className="cancel-btn" type="button" onClick={() => setShowLogoutConfirm(false)}>ยกเลิก</button>
              <button className="delete-confirm-btn" type="button" onClick={() => supabase.auth.signOut()}>
                <LogOut size={16} /> ออกจากระบบ
              </button>
            </footer>
          </section>
        </div>
      )}
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
            <div className="quantity-editor single-input">
              <label>
                จำนวนคงเหลือ
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editQuantity}
                  onChange={(event) =>
                    setEditQuantity(digitsOnly(event.target.value))
                  }
                />
                <span>{selectedStock.unit}</span>
              </label>
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
                <h2 id="confirm-stock-delete-title">
                  ลบ {stockToDelete.name} หรือไม่?
                </h2>
                <p id="confirm-stock-delete-description">
                  {stockToDelete.detail} ·{" "}
                  {stockToDelete.quantity.toLocaleString("th-TH")}{" "}
                  {stockToDelete.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockToDelete(null)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>
                รายการนี้จะถูกลบออกจากสต็อกและฐานข้อมูล Cloud
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setStockToDelete(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={() => removeStock(stockToDelete)}
              >
                ยืนยันการลบ
              </button>
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
                <h2 id="confirm-oem-delete-title">
                  ลบ {oemToDelete.name} หรือไม่?
                </h2>
                <p id="confirm-oem-delete-description">
                  ราคา ฿{oemToDelete.pricePerPack.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ต่อแพ็ค · {oemToDelete.fulfillmentType === "delivery" ? "ไปส่ง" : "มารับเอง"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOemToDelete(null)}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>
                ข้อมูลลูกค้า ราคา และรูปแบบการรับสินค้าจะถูกลบออกจากฐานข้อมูล Cloud
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setOemToDelete(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={() => removeOem(oemToDelete)}
              >
                ยืนยันการลบ
              </button>
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
                    <option value="glass">แก้ว</option>
                    <option value="glassCrate">ลังน้ำแก้ว</option>
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
      {showProductionForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowProductionForm(false)}>
          <section className="stock-modal add-stock-modal production-modal" role="dialog" aria-modal="true" aria-labelledby="production-form-title">
            <header>
              <div>
                <small>การผลิตของร้าน</small>
                <h2 id="production-form-title">{editingProduction ? "แก้ไขรายการผลิต" : "บันทึกการผลิต"}</h2>
                <p>ระบบจะปรับยอดวัตถุดิบในสต็อกตามจำนวนที่ใช้</p>
              </div>
              <button type="button" onClick={() => setShowProductionForm(false)} aria-label="ปิด"><X size={20} /></button>
            </header>
            <form onSubmit={saveProduction}>
              <div className="form-grid production-form-grid">
                <label>
                  ประเภทการผลิต
                  <select value={productionDraft.productType} onChange={(event) => {
                    const productType = event.target.value as "bottled" | "glass";
                    setProductionDraft((value) => ({ ...value, productType }));
                  }}>
                    <option value="bottled">น้ำดื่มแบรนด์ร้าน</option>
                    <option value="glass">น้ำดื่มบรรจุแก้ว</option>
                  </select>
                </label>
                <label>
                  วันที่ผลิต
                  <input required type="date" value={productionDraft.producedAt} onChange={(event) => setProductionDraft((value) => ({ ...value, producedAt: event.target.value }))} />
                </label>
                {productionDraft.productType === "bottled" ? (
                  <>
                    <label>
                      แบรนด์
                      <select value={productionDraft.brand} onChange={(event) => {
                        const brand = event.target.value;
                        const bottle = bottles.find((item) => item.brand === brand && bottleSize(item) === Number(productionDraft.sizeMl));
                        setProductionDraft((value) => ({ ...value, brand, bottleInventoryId: bottle?.id ?? "" }));
                      }}>
                        <option>เนบิวลา</option><option>พีพี</option>
                      </select>
                    </label>
                    <label>
                      ขนาดขวด
                      <select value={productionDraft.sizeMl} onChange={(event) => {
                        const sizeMl = event.target.value;
                        const bottle = bottles.find((item) => item.brand === productionDraft.brand && bottleSize(item) === Number(sizeMl));
                        setProductionDraft((value) => ({ ...value, sizeMl, bottleInventoryId: bottle?.id ?? "" }));
                      }}>
                        {[350,500,600,780,1500].filter((size) => bottles.some((item) => item.brand === productionDraft.brand && bottleSize(item) === size)).map((size) => <option key={size} value={size}>{size.toLocaleString("th-TH")} ml</option>)}
                      </select>
                    </label>
                    <label>
                      ขวดที่ใช้
                      <select required value={productionDraft.bottleInventoryId} onChange={(event) => setProductionDraft((value) => ({ ...value, bottleInventoryId: event.target.value }))}>
                        <option value="">เลือกขวด</option>
                        {bottles.filter((item) => item.brand === productionDraft.brand && bottleSize(item) === Number(productionDraft.sizeMl)).map((item) => <option key={item.id} value={item.id}>{item.name} · เหลือ {item.quantity} {item.unit}</option>)}
                      </select>
                    </label>
                    <label>
                      จำนวนขวดที่ใช้
                      <input required inputMode="numeric" value={productionDraft.bottleQuantity} onChange={(event) => setProductionDraft((value) => ({ ...value, bottleQuantity: digitsOnly(event.target.value) }))} placeholder="0" />
                    </label>
                    <label>
                      ฝาที่ใช้
                      <select required value={productionDraft.capInventoryId} onChange={(event) => setProductionDraft((value) => ({ ...value, capInventoryId: event.target.value }))}>
                        <option value="">เลือกฝาขวด</option>
                        {caps.map((item) => <option key={item.id} value={item.id}>{item.name} · เหลือ {item.quantity} {item.unit}</option>)}
                      </select>
                    </label>
                    <label>
                      จำนวนฝาที่ใช้
                      <input required inputMode="numeric" value={productionDraft.capQuantity} onChange={(event) => setProductionDraft((value) => ({ ...value, capQuantity: digitsOnly(event.target.value) }))} placeholder="0" />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      แก้วที่ใช้
                      <select required value={productionDraft.cupInventoryId} onChange={(event) => setProductionDraft((value) => ({ ...value, cupInventoryId: event.target.value }))}>
                        <option value="">เลือกแก้ว</option>
                        {cups.map((item) => <option key={item.id} value={item.id}>{item.name} · เหลือ {item.quantity} {item.unit}</option>)}
                      </select>
                    </label>
                    <label>
                      จำนวนแก้วที่ใช้
                      <input required inputMode="numeric" value={productionDraft.cupQuantity} onChange={(event) => setProductionDraft((value) => ({ ...value, cupQuantity: digitsOnly(event.target.value) }))} placeholder="0" />
                    </label>
                    <label>
                      ลังน้ำแก้วที่ใช้
                      <select required value={productionDraft.crateInventoryId} onChange={(event) => setProductionDraft((value) => ({ ...value, crateInventoryId: event.target.value }))}>
                        <option value="">เลือกลังน้ำแก้ว</option>
                        {glassCrates.map((item) => <option key={item.id} value={item.id}>{item.name} · เหลือ {item.quantity} {item.unit}</option>)}
                      </select>
                    </label>
                    <label>
                      จำนวนลังน้ำแก้วที่ใช้
                      <input required inputMode="numeric" value={productionDraft.crateQuantity} onChange={(event) => setProductionDraft((value) => ({ ...value, crateQuantity: digitsOnly(event.target.value) }))} placeholder="0" />
                    </label>
                  </>
                )}
                <label className="form-grid-wide">
                  หมายเหตุ
                  <input value={productionDraft.note} onChange={(event) => setProductionDraft((value) => ({ ...value, note: event.target.value }))} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
                </label>
                {productionError && <p className="form-error">{productionError}</p>}
                {editingProduction && editingProduction.revisions.length > 0 && (
                  <div className="production-revision-note">
                    <History size={16} />
                    <span>แก้ไขล่าสุด: {editingProduction.revisions.at(-1)?.summary}</span>
                  </div>
                )}
              </div>
              <footer>
                <button type="button" className="cancel-btn" onClick={() => setShowProductionForm(false)}>ยกเลิก</button>
                <button type="submit" className="save-btn">{editingProduction ? "บันทึกการแก้ไข" : "ยืนยันการผลิต"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {productionToCancel && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProductionToCancel(null)}>
          <section className="stock-modal confirm-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-production-title">
            <header>
              <div><small>ยืนยันการยกเลิก</small><h2 id="cancel-production-title">ยกเลิกรายการผลิตหรือไม่?</h2><p>วัตถุดิบที่ใช้จะถูกคืนเข้าสู่สต็อกทั้งหมด</p></div>
              <button type="button" onClick={() => setProductionToCancel(null)} aria-label="ปิด"><X size={20} /></button>
            </header>
            <div className="confirm-delete-copy"><ClipboardList size={22} /><p>รายการผลิตวันที่ {new Date(productionToCancel.producedAt).toLocaleDateString("th-TH")} จะถูกลบออก และวัตถุดิบที่ใช้จะถูกคืนเข้าสู่สต็อก</p></div>
            <footer><button type="button" className="cancel-btn" onClick={() => setProductionToCancel(null)}>กลับ</button><button type="button" className="delete-confirm-btn" onClick={() => cancelProduction(productionToCancel)}>ยืนยันการยกเลิก</button></footer>
          </section>
        </div>
      )}
      {showOemForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeOemForm()
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
                <h2 id="add-oem-title">
                  {editingOem ? "แก้ไขลูกค้า OEM" : "เพิ่มลูกค้า OEM"}
                </h2>
                <p>{editingOem ? "แก้ไขชื่อ ราคา และรูปแบบการรับสินค้า" : "กรอกข้อมูลข้อตกลงของลูกค้า"}</p>
              </div>
              <button onClick={closeOemForm} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <form onSubmit={saveOem}>
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
                  ขนาดขวด (มล.)
                  <select
                    value={oemSizeMl}
                    onChange={(event) => setOemSizeMl(event.target.value)}
                    required
                  >
                    <option value="350">350 ml</option>
                    <option value="500">500 ml</option>
                    <option value="600">600 ml</option>
                    <option value="1500">1,500 ml</option>
                  </select>
                </label>
                <label>
                  ราคาต่อแพ็ค (บาท)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={oemPricePerPack}
                    onChange={(event) =>
                      setOemPricePerPack(decimalOnly(event.target.value))
                    }
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  เรทผลิต
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={oemProductionRate}
                    onChange={(event) =>
                      setOemProductionRate(digitsOnly(event.target.value))
                    }
                    placeholder="0"
                    required
                  />
                </label>
                <fieldset className="fulfillment-fieldset">
                  <legend>รูปแบบการรับสินค้า</legend>
                  <div className="fulfillment-options">
                    <label className={oemFulfillmentType === "pickup" ? "selected" : ""}>
                      <input type="radio" name="fulfillment" value="pickup" checked={oemFulfillmentType === "pickup"} onChange={() => setOemFulfillmentType("pickup")} />
                      <Package size={18} />
                      <span><strong>ลูกค้ามารับเอง</strong><small>รับสินค้าที่โรงงาน</small></span>
                    </label>
                    <label className={oemFulfillmentType === "delivery" ? "selected" : ""}>
                      <input type="radio" name="fulfillment" value="delivery" checked={oemFulfillmentType === "delivery"} onChange={() => setOemFulfillmentType("delivery")} />
                      <Truck size={18} />
                      <span><strong>ไปส่ง</strong><small>จัดส่งถึงลูกค้า</small></span>
                    </label>
                  </div>
                </fieldset>
                {oemSaveError && (
                  <p className="form-error" role="alert">{oemSaveError}</p>
                )}
              </div>
              <footer>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeOemForm}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn" disabled={oemSaving}>
                  {oemSaving ? "กำลังบันทึก..." : editingOem ? "บันทึกการแก้ไข" : "บันทึกลูกค้า"}
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
                <h2 id="confirm-factory-delete-title">
                  ลบ {factoryToDelete.name} หรือไม่?
                </h2>
                <p id="confirm-factory-delete-description">
                  มีรายการขวด{" "}
                  {suppliers
                    .filter((item) => item.factoryId === factoryToDelete.id)
                    .length.toLocaleString("th-TH")}{" "}
                  รายการ
                </p>
              </div>
              <button onClick={() => setFactoryToDelete(null)} aria-label="ปิด">
                <X size={20} />
              </button>
            </header>
            <div className="confirm-delete-copy">
              <Trash2 size={24} />
              <p>
                โรงงานและรายการขวดทั้งหมดภายในจะถูกลบออก
                ระบบจะบันทึกเหตุการณ์นี้ไว้ในประวัติการแก้ไข
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setFactoryToDelete(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={() => removeFactory(factoryToDelete)}
              >
                ลบโรงงานและรายการขวด
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
