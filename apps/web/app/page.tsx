"use client";

import Image from "next/image";
import { Boxes, ChevronRight, Database, Factory, GlassWater, History, Home, Package, Palette, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { deleteRecord, InventoryRecord, OemRecord, readAll, saveMany, saveRecord, SupplierLog, SupplierRecord } from "@/lib/database";

const navItems = [
  { label: "ภาพรวม", icon: Home },
  { label: "สต็อก", icon: Boxes },
  { label: "ลูกค้า OEM", icon: Users },
  { label: "Supplier", icon: Factory },
];

const initialInventory: InventoryRecord[] = [
  ...[350, 500, 600, 780, 1500].map((size, i) => ({ id: `NEB-${size}`, category: "bottle" as const, brand: "เนบิวลา", name: `${size.toLocaleString()} ml`, detail: "ขวดเปล่า เนบิวลา", quantity: [120, 86, 245, 54, 42][i], unit: "ห่อ" })),
  ...[350, 500, 600, 1500].map((size, i) => ({ id: `PP-${size}`, category: "bottle" as const, brand: "พีพี", name: `${size.toLocaleString()} ml`, detail: "ขวดเปล่า พีพี", quantity: [98, 67, 132, 38][i], unit: "ห่อ" })),
  { id: "CAP-BLUE", category: "cap", name: "ฝาสีฟ้า", detail: "ฝาขวดน้ำดื่ม", quantity: 32, unit: "ลัง", color: "#54a9cb" },
  { id: "CAP-WHITE", category: "cap", name: "ฝาสีขาว", detail: "ฝาขวดน้ำดื่ม", quantity: 18, unit: "ลัง", color: "#e8ecec" },
  { id: "CAP-PINK", category: "cap", name: "ฝาสีชมพู", detail: "ฝาขวดน้ำดื่ม", quantity: 9, unit: "ลัง", color: "#ee9fb2" },
  { id: "TANK-W18", category: "tank", name: "ถังขาว 18 ลิตร", detail: "ถังน้ำดื่มหมุนเวียน", quantity: 76, unit: "ถัง" },
  { id: "TANK-CLEAR-A", category: "tank", name: "ถังใส แบบ A", detail: "ถังใสทรงกลม", quantity: 48, unit: "ถัง" },
  { id: "TANK-CLEAR-B", category: "tank", name: "ถังใส แบบ B", detail: "ถังใสมีหูจับ", quantity: 35, unit: "ถัง" },
  { id: "CUP", category: "glass", name: "แก้วน้ำ", detail: "แก้วพลาสติกพร้อมซีล", quantity: 160, unit: "ลัง" },
  { id: "GLASS-CRATE", category: "glass", name: "ลังน้ำแก้ว", detail: "ลังสำหรับขวดแก้ว", quantity: 64, unit: "ลัง" },
];

const initialOem: OemRecord[] = [
  { id: "oem-evergreen", name: "Evergreen Hotel", quantity: 12500, updatedAt: "2026-07-21T00:00:00.000Z" },
  { id: "oem-siam", name: "Siam Wellness", quantity: 8200, updatedAt: "2026-07-21T00:00:00.000Z" },
];

function StockCard({ item, onOpen }: { item: InventoryRecord; onOpen: () => void }) {
  return <button className="inventory-card inventory-card-button" onClick={onOpen}>
    <div className="inventory-icon">{item.color ? <span className="color-swatch" style={{ background: item.color }} /> : <Package size={21} />}</div>
    <div className="inventory-copy"><strong>{item.name}</strong><small>{item.detail} · {item.id}</small></div>
    <div className="inventory-amount"><strong>{item.quantity.toLocaleString("th-TH")}</strong><span>{item.unit}</span></div>
    <ChevronRight className="card-chevron" size={18} />
  </button>;
}

function SummaryCards({ bottleTotal, capTotal, oemTotal }: { bottleTotal: number; capTotal: number; oemTotal: number }) {
  return <section className="inventory-summary" aria-label="สรุปสต็อก">
    <article><span className="summary-icon blue"><GlassWater /></span><div><small>ขวดทุกแบรนด์</small><strong>{bottleTotal.toLocaleString("th-TH")} <em>ห่อ</em></strong></div></article>
    <article><span className="summary-icon teal"><Palette /></span><div><small>ฝาขวดทุกสี</small><strong>{capTotal.toLocaleString("th-TH")} <em>ลัง</em></strong></div></article>
    <article><span className="summary-icon violet"><Users /></span><div><small>ขวดของ OEM</small><strong>{oemTotal.toLocaleString("th-TH")} <em>ห่อ</em></strong></div></article>
  </section>;
}

function OemList({ items, onRemove }: { items: OemRecord[]; onRemove: (id: string) => void }) {
  return <div className="oem-list">{items.map(item => <article key={item.id}>
    <span className="oem-avatar">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>อัปเดต {new Date(item.updatedAt).toLocaleDateString("th-TH")}</small></div>
    <p><strong>{item.quantity.toLocaleString("th-TH")}</strong><span>ห่อ</span></p><button onClick={() => onRemove(item.id)} aria-label={`ลบ ${item.name}`}><Trash2 size={16} /></button>
  </article>)}</div>;
}

export default function Dashboard() {
  const [active, setActive] = useState("ภาพรวม");
  const [brandTab, setBrandTab] = useState("เนบิวลา");
  const [inventory, setInventory] = useState<InventoryRecord[]>(initialInventory);
  const [oemItems, setOemItems] = useState<OemRecord[]>(initialOem);
  const [oemName, setOemName] = useState("");
  const [oemQuantity, setOemQuantity] = useState("");
  const [showOemForm, setShowOemForm] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [selectedStock, setSelectedStock] = useState<InventoryRecord | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState({ name: "", detail: "", quantity: "", unit: "ลัง", category: "cap", brand: "เนบิวลา" });
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [supplierLogs, setSupplierLogs] = useState<SupplierLog[]>([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [supplierDraft, setSupplierDraft] = useState({ factory: "", sizeMl: "350", pricePerPack: "", bottlesPerPack: "" });

  useEffect(() => {
    const hydrate = async () => {
      const [storedInventory, storedOem, storedSuppliers, storedSupplierLogs] = await Promise.all([readAll<InventoryRecord>("inventory"), readAll<OemRecord>("oem"), readAll<SupplierRecord>("suppliers"), readAll<SupplierLog>("supplierLogs")]);
      if (storedInventory.length) {
        const migrated = storedInventory.map(item => {
          const legacyCategory = item.category as string;
          const category = legacyCategory === "packaging" ? (item.id.startsWith("CAP") ? "cap" : item.id.startsWith("TANK") ? "tank" : "glass") : item.category;
          return { ...item, category, unit: category === "bottle" ? "ห่อ" : item.unit } as InventoryRecord;
        });
        setInventory(migrated); await saveMany("inventory", migrated);
      } else await saveMany("inventory", initialInventory);
      if (storedOem.length) setOemItems(storedOem); else await saveMany("oem", initialOem);
      setSuppliers(storedSuppliers);
      setSupplierLogs(storedSupplierLogs);
      setDatabaseReady(true);
    };
    hydrate().catch(() => setDatabaseReady(true));
  }, []);

  const bottleSize = (item: InventoryRecord) => Number(item.id.match(/(\d+)/)?.[1] ?? 99999);
  const bottles = inventory.filter(item => item.category === "bottle").sort((a, b) => bottleSize(a) - bottleSize(b));
  const caps = inventory.filter(item => item.category === "cap");
  const tanks = inventory.filter(item => item.category === "tank");
  const glassItems = inventory.filter(item => item.category === "glass");
  const packaging = [...caps, ...tanks, ...glassItems];
  const bottleTotal = bottles.reduce((sum, item) => sum + item.quantity, 0);
  const capTotal = caps.reduce((sum, item) => sum + item.quantity, 0);
  const oemTotal = oemItems.reduce((sum, item) => sum + item.quantity, 0);
  const latestOem = useMemo(() => [...oemItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4), [oemItems]);

  const openStock = (item: InventoryRecord) => { setSelectedStock(item); setEditQuantity(String(item.quantity)); };
  const adjustDraft = (delta: number) => setEditQuantity(value => String(Math.max(0, (Number(value) || 0) + delta)));
  const saveQuantity = async () => {
    if (!selectedStock) return;
    const updated = { ...selectedStock, quantity: Math.max(0, Number(editQuantity) || 0) };
    setInventory(items => items.map(item => item.id === selectedStock.id ? updated : item));
    await saveRecord("inventory", updated);
    setSelectedStock(null);
  };

  const addStock = async (event: FormEvent) => {
    event.preventDefault();
    const record: InventoryRecord = { id: `CUSTOM-${crypto.randomUUID()}`, category: newStock.category as InventoryRecord["category"], brand: newStock.category === "bottle" ? newStock.brand : undefined, name: newStock.name.trim(), detail: newStock.detail.trim() || "รายการสต็อกเพิ่มเติม", quantity: Math.max(0, Number(newStock.quantity) || 0), unit: newStock.category === "bottle" ? "ห่อ" : newStock.unit.trim() || "ชิ้น" };
    setInventory(items => [...items, record]); await saveRecord("inventory", record);
    setNewStock({ name: "", detail: "", quantity: "", unit: "ลัง", category: "cap", brand: "เนบิวลา" }); setShowAddStock(false);
  };

  const addOem = async (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(oemQuantity);
    if (!oemName.trim() || !Number.isFinite(quantity) || quantity < 0) return;
    const item: OemRecord = { id: crypto.randomUUID(), name: oemName.trim(), quantity, updatedAt: new Date().toISOString() };
    setOemItems(items => [...items, item]);
    await saveRecord("oem", item);
    setOemName(""); setOemQuantity(""); setShowOemForm(false);
  };

  const removeOem = async (id: string) => {
    setOemItems(items => items.filter(item => item.id !== id));
    await deleteRecord("oem", id);
  };

  const openSupplierForm = (supplier?: SupplierRecord) => {
    setEditingSupplier(supplier ?? null);
    setSupplierDraft(supplier ? { factory: supplier.factory, sizeMl: String(supplier.sizeMl), pricePerPack: String(supplier.pricePerPack), bottlesPerPack: String(supplier.bottlesPerPack) } : { factory: "", sizeMl: "350", pricePerPack: "", bottlesPerPack: "" });
    setShowSupplierForm(true);
  };

  const saveSupplier = async (event: FormEvent) => {
    event.preventDefault();
    const pricePerPack = Number(supplierDraft.pricePerPack);
    const bottlesPerPack = Number(supplierDraft.bottlesPerPack);
    const sizeMl = Number(supplierDraft.sizeMl);
    if (!supplierDraft.factory.trim() || !Number.isFinite(pricePerPack) || !Number.isFinite(bottlesPerPack) || !Number.isFinite(sizeMl) || pricePerPack < 0 || bottlesPerPack <= 0 || sizeMl <= 0) return;
    const now = new Date().toISOString();
    const record: SupplierRecord = { id: editingSupplier?.id ?? crypto.randomUUID(), factory: supplierDraft.factory.trim(), sizeMl, pricePerPack, bottlesPerPack, updatedAt: now };
    const action: SupplierLog["action"] = editingSupplier ? "updated" : "created";
    const summary = editingSupplier
      ? `แก้ไข ${sizeMl} ml: ฿${editingSupplier.pricePerPack.toLocaleString("th-TH")} → ฿${pricePerPack.toLocaleString("th-TH")} / ${editingSupplier.bottlesPerPack.toLocaleString("th-TH")} → ${bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`
      : `เพิ่มขวด ${sizeMl} ml ราคา ฿${pricePerPack.toLocaleString("th-TH")} จำนวน ${bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`;
    const log: SupplierLog = { id: crypto.randomUUID(), supplierId: record.id, factory: record.factory, action, summary, createdAt: now };
    setSuppliers(items => editingSupplier ? items.map(item => item.id === record.id ? record : item) : [...items, record]);
    setSupplierLogs(items => [log, ...items]);
    await Promise.all([saveRecord("suppliers", record), saveRecord("supplierLogs", log)]);
    setShowSupplierForm(false); setEditingSupplier(null);
  };

  const removeSupplier = async (supplier: SupplierRecord) => {
    const log: SupplierLog = { id: crypto.randomUUID(), supplierId: supplier.id, factory: supplier.factory, action: "deleted", summary: `ลบขวด ${supplier.sizeMl} ml ราคา ฿${supplier.pricePerPack.toLocaleString("th-TH")} จำนวน ${supplier.bottlesPerPack.toLocaleString("th-TH")} ขวดต่อห่อ`, createdAt: new Date().toISOString() };
    setSuppliers(items => items.filter(item => item.id !== supplier.id));
    setSupplierLogs(items => [log, ...items]);
    await Promise.all([deleteRecord("suppliers", supplier.id), saveRecord("supplierLogs", log)]);
  };

  const goTo = (label: string) => setActive(label);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><Image className="brand-logo" src="/insight-taweechai-logo.jpg" alt="โลโก้ทวีชัยน้ำดื่ม" width={42} height={42} priority /><div><strong>Insight Taweechai</strong><small>Stock management</small></div></div>
      <nav className="side-nav" aria-label="เมนูหลัก"><p className="nav-caption">เมนูหลัก</p>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={20} /><span>{label}</span></button>)}</nav>
      <div className="database-status"><Database size={16} /><div><strong>{databaseReady ? "ฐานข้อมูลพร้อมใช้งาน" : "กำลังเปิดฐานข้อมูล"}</strong><small>บันทึกอัตโนมัติบนอุปกรณ์นี้</small></div></div>
    </aside>
    <main className="main">
      <div className="content inventory-page">
        {active === "ภาพรวม" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Home size={16} /> ภาพรวม Insight Taweechai</p><h1>สรุปคลังสินค้าปัจจุบัน</h1><p>ตัวเลขทั้งหมดคำนวณจากข้อมูลที่บันทึกในฐานข้อมูลบนอุปกรณ์นี้</p></div></section>
          <SummaryCards bottleTotal={bottleTotal} capTotal={capTotal} oemTotal={oemTotal} />
          <section className="overview-grid">
            <article className="panel overview-panel"><div className="section-heading"><div><h2>ขวดแยกตามแบรนด์</h2><p>จำนวนคงเหลือปัจจุบัน</p></div><button className="text-link" onClick={() => goTo("สต็อก")}>ไปที่สต็อก <ChevronRight size={16} /></button></div><div className="brand-overview"><div><span>เนบิวลา</span><strong>{bottles.filter(item => item.brand === "เนบิวลา").reduce((sum,item) => sum + item.quantity, 0).toLocaleString("th-TH")} ห่อ</strong></div><div><span>พีพี</span><strong>{bottles.filter(item => item.brand === "พีพี").reduce((sum,item) => sum + item.quantity, 0).toLocaleString("th-TH")} ห่อ</strong></div><div><span>สต็อกกลุ่มอื่น</span><strong>{packaging.length} รายการ</strong></div></div></article>
            <article className="panel overview-panel"><div className="section-heading"><div><h2>OEM อัปเดตล่าสุด</h2><p>ลูกค้าในฐานข้อมูล {oemItems.length} ราย</p></div><button className="text-link" onClick={() => goTo("ลูกค้า OEM")}>ดูทั้งหมด <ChevronRight size={16} /></button></div><div className="attention-list">{latestOem.map(item => <div key={item.id}><span className="oem-avatar">{item.name.slice(0,2).toUpperCase()}</span><p><strong>{item.name}</strong><small>{new Date(item.updatedAt).toLocaleDateString("th-TH")}</small></p><em>{item.quantity.toLocaleString("th-TH")} ห่อ</em></div>)}</div></article>
          </section>
        </>}

        {active === "สต็อก" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Boxes size={16} /> คลังสินค้า</p><h1>ขวดและบรรจุภัณฑ์</h1><p>กดที่รายการเพื่อดูและปรับจำนวน ระบบจะบันทึกลงฐานข้อมูลทันที</p></div><button className="secondary-btn add-stock-button" onClick={() => setShowAddStock(true)}><Plus size={18} /> เพิ่มสต็อก</button></section>
          <SummaryCards bottleTotal={bottleTotal} capTotal={capTotal} oemTotal={oemTotal} />
          <div className="inventory-main-column">
            <section className="panel inventory-section"><div className="section-heading"><div><h2>สต็อกขวดน้ำ</h2><p>แยกตามยี่ห้อและขนาด</p></div><span className="updated-chip">บันทึกอัตโนมัติ</span></div><div className="brand-tabs" role="tablist">{["เนบิวลา","พีพี"].map(brand => <button key={brand} role="tab" aria-selected={brandTab === brand} className={brandTab === brand ? "active" : ""} onClick={() => setBrandTab(brand)}>{brand}</button>)}</div><div className="inventory-cards bottle-grid">{bottles.filter(item => item.brand === brandTab).map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
            <section className="panel inventory-section"><div className="section-heading"><div><h2>สต็อกฝาขวด</h2><p>จำนวนฝาแยกตามสี หน่วยเป็นลัง</p></div><button className="text-link" onClick={() => { setNewStock(value => ({...value, category:"cap"})); setShowAddStock(true); }}><Plus size={16} /> เพิ่มฝา</button></div><div className="inventory-cards packaging-grid">{caps.map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
            <section className="panel inventory-section"><div className="section-heading"><div><h2>สต็อกถังน้ำ</h2><p>ถังขาว 18 ลิตรและถังใส</p></div><button className="text-link" onClick={() => { setNewStock(value => ({...value, category:"tank", unit:"ถัง"})); setShowAddStock(true); }}><Plus size={16} /> เพิ่มถัง</button></div><div className="inventory-cards packaging-grid">{tanks.map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
            <section className="panel inventory-section"><div className="section-heading"><div><h2>แก้วและลังน้ำแก้ว</h2><p>อุปกรณ์สำหรับน้ำดื่มบรรจุแก้ว</p></div><button className="text-link" onClick={() => { setNewStock(value => ({...value, category:"glass", unit:"ลัง"})); setShowAddStock(true); }}><Plus size={16} /> เพิ่มรายการ</button></div><div className="inventory-cards packaging-grid">{glassItems.map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
          </div>
        </>}

        {active === "ลูกค้า OEM" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Users size={16} /> ลูกค้า OEM</p><h1>สต็อกขวดของลูกค้า</h1><p>เพิ่มและตรวจสอบจำนวนห่อที่เก็บไว้สำหรับแต่ละแบรนด์ลูกค้า</p></div><button className="secondary-btn oem-add-button" onClick={() => setShowOemForm(true)}><Plus size={18} /> เพิ่มลูกค้า OEM</button></section>
          <section className="oem-page-grid single"><article className="panel oem-directory"><div className="section-heading"><div><h2>รายการลูกค้า OEM</h2><p>{oemItems.length} ลูกค้า · {oemTotal.toLocaleString("th-TH")} ห่อ</p></div></div><OemList items={oemItems} onRemove={removeOem} />{!oemItems.length && <p className="empty-state">ยังไม่มีข้อมูล OEM กด “เพิ่มลูกค้า OEM” เพื่อเริ่มต้น</p>}</article></section>
        </>}

        {active === "Supplier" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Factory size={16} /> Supplier</p><h1>ราคาขวดจากโรงงาน</h1><p>จัดเก็บราคาและจำนวนขวดต่อห่อแยกตามโรงงานและขนาด พร้อมประวัติการแก้ไขทุกครั้ง</p></div><button className="secondary-btn add-stock-button" onClick={() => openSupplierForm()}><Plus size={18} /> เพิ่มข้อมูลโรงงาน</button></section>
          <section className="supplier-layout">
            <article className="panel supplier-directory"><div className="section-heading"><div><h2>รายการราคาปัจจุบัน</h2><p>{suppliers.length} รายการ จาก {new Set(suppliers.map(item => item.factory)).size} โรงงาน</p></div></div>
              <div className="supplier-list">{[...suppliers].sort((a,b) => a.factory.localeCompare(b.factory,"th") || a.sizeMl-b.sizeMl).map(item => <article key={item.id}><span className="supplier-factory-icon"><Factory size={20} /></span><div className="supplier-main"><strong>{item.factory}</strong><small>อัปเดต {new Date(item.updatedAt).toLocaleString("th-TH", { dateStyle:"medium", timeStyle:"short" })}</small></div><div className="supplier-size"><strong>{item.sizeMl.toLocaleString("th-TH")} ml</strong><small>ขนาดขวด</small></div><div className="supplier-price"><strong>฿{item.pricePerPack.toLocaleString("th-TH", { minimumFractionDigits:2, maximumFractionDigits:2 })}</strong><small>{item.bottlesPerPack.toLocaleString("th-TH")} ขวด / ห่อ</small></div><div className="supplier-actions"><button onClick={() => openSupplierForm(item)} aria-label={`แก้ไข ${item.factory}`}><Pencil size={16} /></button><button className="danger" onClick={() => removeSupplier(item)} aria-label={`ลบ ${item.factory}`}><Trash2 size={16} /></button></div></article>)}</div>
              {!suppliers.length && <p className="empty-state">ยังไม่มีข้อมูล Supplier กด “เพิ่มข้อมูลโรงงาน” เพื่อเริ่มต้น</p>}
            </article>
            <aside className="panel supplier-log-panel"><div className="section-heading"><div><h2>ประวัติการแก้ไข</h2><p>บันทึกอัตโนมัติทุกการเปลี่ยนแปลง</p></div><History size={18} /></div><div className="supplier-logs">{[...supplierLogs].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,50).map(log => <article key={log.id}><span className={`log-dot ${log.action}`} /><div><strong>{log.factory}</strong><p>{log.summary}</p><small>{new Date(log.createdAt).toLocaleString("th-TH", { dateStyle:"medium", timeStyle:"short" })}</small></div></article>)}</div>{!supplierLogs.length && <p className="empty-state">ประวัติจะปรากฏเมื่อมีการเพิ่มหรือแก้ไขข้อมูล</p>}</aside>
          </section>
        </>}
      </div>
    </main>
    <nav className="bottom-nav compact-nav" aria-label="เมนูมือถือ">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={21} /><span>{label}</span></button>)}</nav>
    {selectedStock && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setSelectedStock(null)}><section className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title"><header><div><small>ปรับจำนวนสต็อก</small><h2 id="stock-modal-title">{selectedStock.name}</h2><p>{selectedStock.detail} · {selectedStock.id}</p></div><button onClick={() => setSelectedStock(null)} aria-label="ปิด"><X size={20} /></button></header><div className="quantity-editor"><button onClick={() => adjustDraft(-1)} aria-label="ลดจำนวน">−</button><label>จำนวนคงเหลือ<input type="number" min="0" value={editQuantity} onChange={event => setEditQuantity(event.target.value)} /><span>{selectedStock.unit}</span></label><button onClick={() => adjustDraft(1)} aria-label="เพิ่มจำนวน">+</button></div><footer><button className="cancel-btn" onClick={() => setSelectedStock(null)}>ยกเลิก</button><button className="save-btn" onClick={saveQuantity}>บันทึกจำนวน</button></footer></section></div>}
    {showAddStock && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowAddStock(false)}><section className="stock-modal add-stock-modal" role="dialog" aria-modal="true" aria-labelledby="add-stock-title"><header><div><small>สร้างรายการใหม่</small><h2 id="add-stock-title">เพิ่มสต็อก</h2><p>กรอกรายละเอียดและจำนวนเริ่มต้น</p></div><button onClick={() => setShowAddStock(false)} aria-label="ปิด"><X size={20} /></button></header><form onSubmit={addStock}><div className="form-grid"><label>ประเภท<select value={newStock.category} onChange={event => setNewStock(value => ({...value,category:event.target.value,unit:event.target.value === "bottle" ? "ห่อ" : event.target.value === "tank" ? "ถัง" : "ลัง"}))}><option value="bottle">ขวดน้ำ</option><option value="cap">ฝาขวด</option><option value="tank">ถังน้ำ</option><option value="glass">แก้ว/ลังน้ำแก้ว</option></select></label>{newStock.category === "bottle" && <label>ยี่ห้อ<select value={newStock.brand} onChange={event => setNewStock(value => ({...value,brand:event.target.value}))}><option>เนบิวลา</option><option>พีพี</option></select></label>}<label>ชื่อรายการ<input required value={newStock.name} onChange={event => setNewStock(value => ({...value,name:event.target.value}))} placeholder="เช่น ฝาสีเขียว" /></label><label>รายละเอียด<input value={newStock.detail} onChange={event => setNewStock(value => ({...value,detail:event.target.value}))} placeholder="รายละเอียดเพิ่มเติม" /></label><label>จำนวนเริ่มต้น<input required type="number" min="0" value={newStock.quantity} onChange={event => setNewStock(value => ({...value,quantity:event.target.value}))} placeholder="0" /></label><label>หน่วย<input required disabled={newStock.category === "bottle"} value={newStock.category === "bottle" ? "ห่อ" : newStock.unit} onChange={event => setNewStock(value => ({...value,unit:event.target.value}))} placeholder="ลัง" /></label></div><footer><button type="button" className="cancel-btn" onClick={() => setShowAddStock(false)}>ยกเลิก</button><button type="submit" className="save-btn">เพิ่มสต็อก</button></footer></form></section></div>}
    {showOemForm && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowOemForm(false)}><section className="stock-modal oem-create-modal" role="dialog" aria-modal="true" aria-labelledby="add-oem-title"><header><div><small>ลูกค้า OEM</small><h2 id="add-oem-title">เพิ่มลูกค้า OEM</h2><p>กรอกชื่อและจำนวนห่อในสต็อก</p></div><button onClick={() => setShowOemForm(false)} aria-label="ปิด"><X size={20} /></button></header><form onSubmit={addOem}><div className="form-grid single-column"><label>ชื่อ OEM<input value={oemName} onChange={event => setOemName(event.target.value)} placeholder="เช่น โรงแรมทวีชัย" required /></label><label>จำนวนห่อในสต็อก<input type="number" min="0" value={oemQuantity} onChange={event => setOemQuantity(event.target.value)} placeholder="0" required /></label></div><footer><button type="button" className="cancel-btn" onClick={() => setShowOemForm(false)}>ยกเลิก</button><button type="submit" className="save-btn">บันทึกลูกค้า</button></footer></form></section></div>}
    {showSupplierForm && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowSupplierForm(false)}><section className="stock-modal supplier-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title"><header><div><small>Supplier</small><h2 id="supplier-modal-title">{editingSupplier ? "แก้ไขข้อมูลโรงงาน" : "เพิ่มข้อมูลโรงงาน"}</h2><p>ระบุราคาขวดและจำนวนขวดต่อห่อ</p></div><button onClick={() => setShowSupplierForm(false)} aria-label="ปิด"><X size={20} /></button></header><form onSubmit={saveSupplier}><div className="form-grid"><label>ชื่อโรงงาน<input required value={supplierDraft.factory} onChange={event => setSupplierDraft(value => ({...value,factory:event.target.value}))} placeholder="เช่น โรงงานขวด ABC" /></label><label>ขนาดขวด<select value={supplierDraft.sizeMl} onChange={event => setSupplierDraft(value => ({...value,sizeMl:event.target.value}))}>{[350,500,600,780,1500].map(size => <option key={size} value={size}>{size.toLocaleString("th-TH")} ml</option>)}</select></label><label>ราคาต่อห่อ (บาท)<input required type="number" inputMode="decimal" min="0" step="0.01" value={supplierDraft.pricePerPack} onChange={event => setSupplierDraft(value => ({...value,pricePerPack:event.target.value}))} placeholder="0.00" /></label><label>จำนวนขวดต่อห่อ<input required type="number" inputMode="numeric" min="1" step="1" value={supplierDraft.bottlesPerPack} onChange={event => setSupplierDraft(value => ({...value,bottlesPerPack:event.target.value}))} placeholder="0" /></label></div><footer><button type="button" className="cancel-btn" onClick={() => setShowSupplierForm(false)}>ยกเลิก</button><button type="submit" className="save-btn">{editingSupplier ? "บันทึกการแก้ไข" : "เพิ่ม Supplier"}</button></footer></form></section></div>}
  </div>;
}
