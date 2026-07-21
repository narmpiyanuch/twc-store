"use client";

import Image from "next/image";
import { Boxes, ChevronRight, Database, GlassWater, Home, Menu, Package, Palette, Plus, Trash2, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { deleteRecord, InventoryRecord, OemRecord, readAll, saveMany, saveRecord } from "@/lib/database";

const navItems = [
  { label: "ภาพรวม", icon: Home },
  { label: "สต็อก", icon: Boxes },
  { label: "ลูกค้า OEM", icon: Users },
];

const initialInventory: InventoryRecord[] = [
  ...[350, 500, 600, 780, 1500].map((size, i) => ({ id: `NEB-${size}`, category: "bottle" as const, brand: "เนบิวลา", name: `${size.toLocaleString()} ml`, detail: "ขวดเปล่า เนบิวลา", quantity: [120, 86, 245, 54, 42][i], unit: "ลัง" })),
  ...[350, 500, 600, 1500].map((size, i) => ({ id: `PP-${size}`, category: "bottle" as const, brand: "พีพี", name: `${size.toLocaleString()} ml`, detail: "ขวดเปล่า พีพี", quantity: [98, 67, 132, 38][i], unit: "ลัง" })),
  { id: "CAP-BLUE", category: "packaging", name: "ฝาสีฟ้า", detail: "ฝาขวดน้ำดื่ม", quantity: 32, unit: "ลัง", color: "#54a9cb" },
  { id: "CAP-WHITE", category: "packaging", name: "ฝาสีขาว", detail: "ฝาขวดน้ำดื่ม", quantity: 18, unit: "ลัง", color: "#e8ecec" },
  { id: "CAP-PINK", category: "packaging", name: "ฝาสีชมพู", detail: "ฝาขวดน้ำดื่ม", quantity: 9, unit: "ลัง", color: "#ee9fb2" },
  { id: "TANK-W18", category: "packaging", name: "ถังขาว 18 ลิตร", detail: "ถังน้ำดื่มหมุนเวียน", quantity: 76, unit: "ถัง" },
  { id: "TANK-CLEAR-A", category: "packaging", name: "ถังใส แบบ A", detail: "ถังใสทรงกลม", quantity: 48, unit: "ถัง" },
  { id: "TANK-CLEAR-B", category: "packaging", name: "ถังใส แบบ B", detail: "ถังใสมีหูจับ", quantity: 35, unit: "ถัง" },
  { id: "CUP", category: "packaging", name: "แก้วน้ำ", detail: "แก้วพลาสติกพร้อมซีล", quantity: 160, unit: "ลัง" },
  { id: "GLASS-CRATE", category: "packaging", name: "ลังน้ำแก้ว", detail: "ลังสำหรับขวดแก้ว", quantity: 64, unit: "ลัง" },
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
    <article><span className="summary-icon blue"><GlassWater /></span><div><small>ขวดทุกแบรนด์</small><strong>{bottleTotal.toLocaleString("th-TH")} <em>ลัง</em></strong></div></article>
    <article><span className="summary-icon teal"><Palette /></span><div><small>ฝาขวดทุกสี</small><strong>{capTotal.toLocaleString("th-TH")} <em>ลัง</em></strong></div></article>
    <article><span className="summary-icon violet"><Users /></span><div><small>ขวดของ OEM</small><strong>{oemTotal.toLocaleString("th-TH")} <em>ขวด</em></strong></div></article>
  </section>;
}

function OemList({ items, onRemove }: { items: OemRecord[]; onRemove: (id: string) => void }) {
  return <div className="oem-list">{items.map(item => <article key={item.id}>
    <span className="oem-avatar">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>อัปเดต {new Date(item.updatedAt).toLocaleDateString("th-TH")}</small></div>
    <p><strong>{item.quantity.toLocaleString("th-TH")}</strong><span>ขวด</span></p><button onClick={() => onRemove(item.id)} aria-label={`ลบ ${item.name}`}><Trash2 size={16} /></button>
  </article>)}</div>;
}

export default function Dashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
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
  const [newStock, setNewStock] = useState({ name: "", detail: "", quantity: "", unit: "ลัง", category: "packaging", brand: "เนบิวลา" });

  useEffect(() => {
    const hydrate = async () => {
      const [storedInventory, storedOem] = await Promise.all([readAll<InventoryRecord>("inventory"), readAll<OemRecord>("oem")]);
      if (storedInventory.length) setInventory(storedInventory); else await saveMany("inventory", initialInventory);
      if (storedOem.length) setOemItems(storedOem); else await saveMany("oem", initialOem);
      setDatabaseReady(true);
    };
    hydrate().catch(() => setDatabaseReady(true));
  }, []);

  const bottles = inventory.filter(item => item.category === "bottle");
  const packaging = inventory.filter(item => item.category === "packaging");
  const bottleTotal = bottles.reduce((sum, item) => sum + item.quantity, 0);
  const capTotal = packaging.filter(item => item.id.startsWith("CAP")).reduce((sum, item) => sum + item.quantity, 0);
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
    const record: InventoryRecord = { id: `CUSTOM-${crypto.randomUUID()}`, category: newStock.category as "bottle" | "packaging", brand: newStock.category === "bottle" ? newStock.brand : undefined, name: newStock.name.trim(), detail: newStock.detail.trim() || "รายการสต็อกเพิ่มเติม", quantity: Math.max(0, Number(newStock.quantity) || 0), unit: newStock.unit.trim() || "ชิ้น" };
    setInventory(items => [...items, record]); await saveRecord("inventory", record);
    setNewStock({ name: "", detail: "", quantity: "", unit: "ลัง", category: "packaging", brand: "เนบิวลา" }); setShowAddStock(false);
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

  const goTo = (label: string) => { setActive(label); setMobileMenu(false); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><Image className="brand-logo" src="/insight-taweechai-logo.jpg" alt="โลโก้ทวีชัยน้ำดื่ม" width={42} height={42} priority /><div><strong>Insight Taweechai</strong><small>Stock management</small></div><button className="icon-btn sidebar-close" onClick={() => setMobileMenu(false)} aria-label="ปิดเมนู"><X size={20} /></button></div>
      <nav className="side-nav" aria-label="เมนูหลัก"><p className="nav-caption">เมนูหลัก</p>{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={20} /><span>{label}</span></button>)}</nav>
      <div className="database-status"><Database size={16} /><div><strong>{databaseReady ? "ฐานข้อมูลพร้อมใช้งาน" : "กำลังเปิดฐานข้อมูล"}</strong><small>บันทึกอัตโนมัติบนอุปกรณ์นี้</small></div></div>
    </aside>
    {mobileMenu && <button className="scrim" aria-label="ปิดเมนู" onClick={() => setMobileMenu(false)} />}

    <main className="main">
      <header className="topbar simple-topbar"><button className="icon-btn menu-btn" onClick={() => setMobileMenu(true)} aria-label="เปิดเมนู"><Menu size={23} /></button><div className="topbar-title"><strong>{active}</strong><small>{active === "ภาพรวม" ? "สรุปข้อมูลล่าสุด" : active === "สต็อก" ? "ขวดและบรรจุภัณฑ์" : "สต็อกแยกตามลูกค้า"}</small></div><span className="save-state"><i /> บันทึกอัตโนมัติ</span></header>

      <div className="content inventory-page">
        {active === "ภาพรวม" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Home size={16} /> ภาพรวม Insight Taweechai</p><h1>สรุปคลังสินค้าปัจจุบัน</h1><p>ตัวเลขทั้งหมดคำนวณจากข้อมูลที่บันทึกในฐานข้อมูลบนอุปกรณ์นี้</p></div></section>
          <SummaryCards bottleTotal={bottleTotal} capTotal={capTotal} oemTotal={oemTotal} />
          <section className="overview-grid">
            <article className="panel overview-panel"><div className="section-heading"><div><h2>ขวดแยกตามแบรนด์</h2><p>จำนวนคงเหลือปัจจุบัน</p></div><button className="text-link" onClick={() => goTo("สต็อก")}>ไปที่สต็อก <ChevronRight size={16} /></button></div><div className="brand-overview"><div><span>เนบิวลา</span><strong>{bottles.filter(item => item.brand === "เนบิวลา").reduce((sum,item) => sum + item.quantity, 0).toLocaleString("th-TH")} ลัง</strong></div><div><span>พีพี</span><strong>{bottles.filter(item => item.brand === "พีพี").reduce((sum,item) => sum + item.quantity, 0).toLocaleString("th-TH")} ลัง</strong></div><div><span>บรรจุภัณฑ์และภาชนะ</span><strong>{packaging.length} รายการ</strong></div></div></article>
            <article className="panel overview-panel"><div className="section-heading"><div><h2>OEM อัปเดตล่าสุด</h2><p>ลูกค้าในฐานข้อมูล {oemItems.length} ราย</p></div><button className="text-link" onClick={() => goTo("ลูกค้า OEM")}>ดูทั้งหมด <ChevronRight size={16} /></button></div><div className="attention-list">{latestOem.map(item => <div key={item.id}><span className="oem-avatar">{item.name.slice(0,2).toUpperCase()}</span><p><strong>{item.name}</strong><small>{new Date(item.updatedAt).toLocaleDateString("th-TH")}</small></p><em>{item.quantity.toLocaleString("th-TH")} ขวด</em></div>)}</div></article>
          </section>
        </>}

        {active === "สต็อก" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Boxes size={16} /> คลังสินค้า</p><h1>ขวดและบรรจุภัณฑ์</h1><p>กดที่รายการเพื่อดูและปรับจำนวน ระบบจะบันทึกลงฐานข้อมูลทันที</p></div><button className="secondary-btn add-stock-button" onClick={() => setShowAddStock(true)}><Plus size={18} /> เพิ่มสต็อก</button></section>
          <SummaryCards bottleTotal={bottleTotal} capTotal={capTotal} oemTotal={oemTotal} />
          <div className="inventory-main-column">
            <section className="panel inventory-section"><div className="section-heading"><div><h2>สต็อกขวดน้ำ</h2><p>แยกตามยี่ห้อและขนาด</p></div><span className="updated-chip">บันทึกอัตโนมัติ</span></div><div className="brand-tabs" role="tablist">{["เนบิวลา","พีพี"].map(brand => <button key={brand} role="tab" aria-selected={brandTab === brand} className={brandTab === brand ? "active" : ""} onClick={() => setBrandTab(brand)}>{brand}</button>)}</div><div className="inventory-cards bottle-grid">{bottles.filter(item => item.brand === brandTab).map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
            <section className="panel inventory-section"><div className="section-heading"><div><h2>บรรจุภัณฑ์และภาชนะ</h2><p>ฝาขวด ถัง แก้ว และลังน้ำแก้ว</p></div><button className="text-link" onClick={() => setShowAddStock(true)}><Plus size={16} /> เพิ่มสต็อก</button></div><div className="inventory-cards packaging-grid">{packaging.map(item => <StockCard key={item.id} item={item} onOpen={() => openStock(item)} />)}</div></section>
          </div>
        </>}

        {active === "ลูกค้า OEM" && <>
          <section className="welcome inventory-welcome"><div><p className="eyebrow"><Users size={16} /> ลูกค้า OEM</p><h1>สต็อกขวดของลูกค้า</h1><p>เพิ่มและตรวจสอบจำนวนขวดที่เก็บไว้สำหรับแต่ละแบรนด์ลูกค้า</p></div><button className="secondary-btn" onClick={() => setShowOemForm(true)}><Plus size={18} /> เพิ่มลูกค้า OEM</button></section>
          <section className="oem-page-grid">
            <article className="panel oem-directory"><div className="section-heading"><div><h2>รายการ OEM ทั้งหมด</h2><p>{oemItems.length} ลูกค้า · {oemTotal.toLocaleString("th-TH")} ขวด</p></div><button className="add-round" onClick={() => setShowOemForm(true)} aria-label="เพิ่ม OEM"><Plus size={19} /></button></div><OemList items={oemItems} onRemove={removeOem} />{!oemItems.length && <p className="empty-state">ยังไม่มีข้อมูล OEM กด “เพิ่มลูกค้า OEM” เพื่อเริ่มต้น</p>}</article>
            <aside className="panel oem-editor"><div className="section-heading"><div><h2>เพิ่มข้อมูล OEM</h2><p>บันทึกลงฐานข้อมูลทันที</p></div></div>{showOemForm ? <form className="oem-form open" onSubmit={addOem}><label>ชื่อ OEM<input value={oemName} onChange={e => setOemName(e.target.value)} placeholder="เช่น โรงแรมทวีชัย" autoFocus required /></label><label>จำนวนขวดในสต็อก<input type="number" min="0" value={oemQuantity} onChange={e => setOemQuantity(e.target.value)} placeholder="0" required /></label><div><button type="button" className="cancel-btn" onClick={() => setShowOemForm(false)}>ยกเลิก</button><button type="submit" className="save-btn">บันทึกรายการ</button></div></form> : <button className="wide-button" onClick={() => setShowOemForm(true)}><Plus size={18} /> เพิ่มรายการใหม่</button>}<div className="oem-note"><strong>การจัดเก็บข้อมูล</strong><p>ข้อมูลจะยังอยู่หลัง refresh และเปิด browser ใหม่บนอุปกรณ์เดิม การลบและเพิ่มจะแสดงผลบนภาพรวมทันที</p></div></aside>
          </section>
        </>}
      </div>
    </main>
    <nav className="bottom-nav compact-nav" aria-label="เมนูมือถือ">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={21} /><span>{label}</span></button>)}</nav>
    {selectedStock && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setSelectedStock(null)}><section className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title"><header><div><small>ปรับจำนวนสต็อก</small><h2 id="stock-modal-title">{selectedStock.name}</h2><p>{selectedStock.detail} · {selectedStock.id}</p></div><button onClick={() => setSelectedStock(null)} aria-label="ปิด"><X size={20} /></button></header><div className="quantity-editor"><button onClick={() => adjustDraft(-1)} aria-label="ลดจำนวน">−</button><label>จำนวนคงเหลือ<input type="number" min="0" value={editQuantity} onChange={event => setEditQuantity(event.target.value)} /><span>{selectedStock.unit}</span></label><button onClick={() => adjustDraft(1)} aria-label="เพิ่มจำนวน">+</button></div><footer><button className="cancel-btn" onClick={() => setSelectedStock(null)}>ยกเลิก</button><button className="save-btn" onClick={saveQuantity}>บันทึกจำนวน</button></footer></section></div>}
    {showAddStock && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowAddStock(false)}><section className="stock-modal add-stock-modal" role="dialog" aria-modal="true" aria-labelledby="add-stock-title"><header><div><small>สร้างรายการใหม่</small><h2 id="add-stock-title">เพิ่มสต็อก</h2><p>กรอกรายละเอียดและจำนวนเริ่มต้น</p></div><button onClick={() => setShowAddStock(false)} aria-label="ปิด"><X size={20} /></button></header><form onSubmit={addStock}><div className="form-grid"><label>ประเภท<select value={newStock.category} onChange={event => setNewStock(value => ({...value,category:event.target.value}))}><option value="packaging">บรรจุภัณฑ์/ภาชนะ</option><option value="bottle">ขวดน้ำ</option></select></label>{newStock.category === "bottle" && <label>ยี่ห้อ<select value={newStock.brand} onChange={event => setNewStock(value => ({...value,brand:event.target.value}))}><option>เนบิวลา</option><option>พีพี</option></select></label>}<label>ชื่อรายการ<input required value={newStock.name} onChange={event => setNewStock(value => ({...value,name:event.target.value}))} placeholder="เช่น ฝาสีเขียว" /></label><label>รายละเอียด<input value={newStock.detail} onChange={event => setNewStock(value => ({...value,detail:event.target.value}))} placeholder="รายละเอียดเพิ่มเติม" /></label><label>จำนวนเริ่มต้น<input required type="number" min="0" value={newStock.quantity} onChange={event => setNewStock(value => ({...value,quantity:event.target.value}))} placeholder="0" /></label><label>หน่วย<input required value={newStock.unit} onChange={event => setNewStock(value => ({...value,unit:event.target.value}))} placeholder="ลัง" /></label></div><footer><button type="button" className="cancel-btn" onClick={() => setShowAddStock(false)}>ยกเลิก</button><button type="submit" className="save-btn">เพิ่มสต็อก</button></footer></form></section></div>}
  </div>;
}
