"use client";

import Image from "next/image";
import {
  Bell, Boxes, ChevronRight, ClipboardList, Factory, GlassWater, Home,
  Menu, Package, Palette, Plus, Search, ShoppingCart, Trash2, Truck,
  Users, X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type StockItem = { id: string; name: string; detail: string; quantity: number; unit: string; color?: string };
type OemItem = { id: number; name: string; quantity: number };

const navItems = [
  { label: "ภาพรวม", icon: Home },
  { label: "ขายสินค้า", icon: ShoppingCart },
  { label: "สต็อก", icon: Boxes },
  { label: "การผลิต", icon: Factory },
  { label: "ลูกค้า OEM", icon: Users },
];

const bottleStock: Record<string, StockItem[]> = {
  "เนบิวลา": [
    { id: "NEB-350", name: "350 ml", detail: "ขวดเปล่า เนบิวลา", quantity: 120, unit: "ลัง" },
    { id: "NEB-500", name: "500 ml", detail: "ขวดเปล่า เนบิวลา", quantity: 86, unit: "ลัง" },
    { id: "NEB-600", name: "600 ml", detail: "ขวดเปล่า เนบิวลา", quantity: 245, unit: "ลัง" },
    { id: "NEB-780", name: "780 ml", detail: "ขวดเปล่า เนบิวลา", quantity: 54, unit: "ลัง" },
    { id: "NEB-1500", name: "1,500 ml", detail: "ขวดเปล่า เนบิวลา", quantity: 42, unit: "ลัง" },
  ],
  "พีพี": [
    { id: "PP-350", name: "350 ml", detail: "ขวดเปล่า พีพี", quantity: 98, unit: "ลัง" },
    { id: "PP-500", name: "500 ml", detail: "ขวดเปล่า พีพี", quantity: 67, unit: "ลัง" },
    { id: "PP-600", name: "600 ml", detail: "ขวดเปล่า พีพี", quantity: 132, unit: "ลัง" },
    { id: "PP-1500", name: "1,500 ml", detail: "ขวดเปล่า พีพี", quantity: 38, unit: "ลัง" },
  ],
};

const packagingStock: StockItem[] = [
  { id: "CAP-BLUE", name: "ฝาสีฟ้า", detail: "ฝาขวดน้ำดื่ม", quantity: 32, unit: "ลัง", color: "#54a9cb" },
  { id: "CAP-WHITE", name: "ฝาสีขาว", detail: "ฝาขวดน้ำดื่ม", quantity: 18, unit: "ลัง", color: "#e8ecec" },
  { id: "CAP-PINK", name: "ฝาสีชมพู", detail: "ฝาขวดน้ำดื่ม", quantity: 9, unit: "ลัง", color: "#ee9fb2" },
  { id: "TANK-W18", name: "ถังขาว 18 ลิตร", detail: "ถังน้ำดื่มหมุนเวียน", quantity: 76, unit: "ถัง" },
  { id: "TANK-CLEAR-A", name: "ถังใส แบบ A", detail: "ถังใสทรงกลม", quantity: 48, unit: "ถัง" },
  { id: "TANK-CLEAR-B", name: "ถังใส แบบ B", detail: "ถังใสมีหูจับ", quantity: 35, unit: "ถัง" },
  { id: "CUP", name: "แก้วน้ำ", detail: "แก้วพลาสติกพร้อมซีล", quantity: 160, unit: "ลัง" },
  { id: "GLASS-CRATE", name: "ลังน้ำแก้ว", detail: "ลังสำหรับขวดแก้ว", quantity: 64, unit: "ลัง" },
];

function StockCard({ item, onAdjust }: { item: StockItem; onAdjust?: (delta: number) => void }) {
  const low = item.quantity <= 20;
  return <article className={`inventory-card ${low ? "low" : ""}`}>
    <div className="inventory-icon">{item.color ? <span className="color-swatch" style={{ background: item.color }} /> : <Package size={21} />}</div>
    <div className="inventory-copy"><strong>{item.name}</strong><small>{item.detail} · {item.id}</small></div>
    <div className="inventory-amount"><strong>{item.quantity.toLocaleString("th-TH")}</strong><span>{item.unit}</span></div>
    {onAdjust && <div className="stepper"><button onClick={() => onAdjust(-1)} aria-label={`ลด ${item.name}`}>−</button><button onClick={() => onAdjust(1)} aria-label={`เพิ่ม ${item.name}`}>+</button></div>}
    {low && <span className="low-label">ใกล้หมด</span>}
  </article>;
}

export default function Dashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [active, setActive] = useState("สต็อก");
  const [brandTab, setBrandTab] = useState("เนบิวลา");
  const [packaging, setPackaging] = useState(packagingStock);
  const [oemItems, setOemItems] = useState<OemItem[]>([
    { id: 1, name: "Evergreen Hotel", quantity: 12500 },
    { id: 2, name: "Siam Wellness", quantity: 8200 },
  ]);
  const [oemName, setOemName] = useState("");
  const [oemQuantity, setOemQuantity] = useState("");
  const [showOemForm, setShowOemForm] = useState(false);

  const bottleTotal = useMemo(() => Object.values(bottleStock).flat().reduce((sum, item) => sum + item.quantity, 0), []);
  const capTotal = packaging.filter(item => item.id.startsWith("CAP")).reduce((sum, item) => sum + item.quantity, 0);
  const oemTotal = oemItems.reduce((sum, item) => sum + item.quantity, 0);

  const adjustPackaging = (id: string, delta: number) => setPackaging(items => items.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
  const addOem = (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(oemQuantity);
    if (!oemName.trim() || !Number.isFinite(quantity) || quantity < 0) return;
    setOemItems(items => [...items, { id: Date.now(), name: oemName.trim(), quantity }]);
    setOemName(""); setOemQuantity(""); setShowOemForm(false);
  };

  const goTo = (label: string) => { setActive(label); setMobileMenu(false); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="brand">
        <Image className="brand-logo" src="/insight-taweechai-logo.jpg" alt="โลโก้ทวีชัยน้ำดื่ม" width={42} height={42} priority />
        <div><strong>Insight Taweechai</strong><small>Stock & operations</small></div>
        <button className="icon-btn sidebar-close" onClick={() => setMobileMenu(false)} aria-label="ปิดเมนู"><X size={20} /></button>
      </div>
      <nav className="side-nav" aria-label="เมนูหลัก">
        <p className="nav-caption">เมนูหลัก</p>
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={20} /><span>{label}</span>{label === "สต็อก" && <em>2</em>}</button>)}
        <p className="nav-caption spaced">จัดการ</p>
        <button><Truck size={20} /><span>จัดซื้อและซัพพลายเออร์</span></button>
        <button><ClipboardList size={20} /><span>รายงาน</span></button>
      </nav>
      <div className="sidebar-profile"><div className="avatar">อภ</div><div><strong>อภิญญา</strong><small>ผู้ดูแลระบบ</small></div><ChevronRight size={18} /></div>
    </aside>
    {mobileMenu && <button className="scrim" aria-label="ปิดเมนู" onClick={() => setMobileMenu(false)} />}

    <main className="main">
      <header className="topbar">
        <button className="icon-btn menu-btn" onClick={() => setMobileMenu(true)} aria-label="เปิดเมนู"><Menu size={23} /></button>
        <div className="topbar-title"><strong>{active}</strong><small>คลังวัตถุดิบและบรรจุภัณฑ์</small></div>
        <label className="search"><Search size={19} /><input placeholder="ค้นหาขวด ฝา ถัง หรือ OEM" aria-label="ค้นหาสต็อก" /></label>
        <button className="icon-btn notification" aria-label="การแจ้งเตือน"><Bell size={21} /><span /></button>
        <button className="primary-btn" onClick={() => setShowOemForm(true)}><Plus size={19} /><span>เพิ่ม OEM</span></button>
      </header>

      <div className="content inventory-page">
        <section className="welcome inventory-welcome">
          <div><p className="eyebrow"><Boxes size={16} /> คลังสินค้า Insight Taweechai</p><h1>จัดการสต็อกน้ำดื่ม</h1><p>ตรวจสอบจำนวนขวด บรรจุภัณฑ์ และสต็อกของลูกค้า OEM ในหน้าเดียว</p></div>
          <button className="secondary-btn"><ClipboardList size={18} /> ประวัติการปรับสต็อก</button>
        </section>

        <section className="inventory-summary" aria-label="สรุปสต็อก">
          <article><span className="summary-icon blue"><GlassWater /></span><div><small>ขวดทุกแบรนด์</small><strong>{bottleTotal.toLocaleString("th-TH")} <em>ลัง</em></strong></div></article>
          <article><span className="summary-icon teal"><Palette /></span><div><small>ฝาขวดทุกสี</small><strong>{capTotal.toLocaleString("th-TH")} <em>ลัง</em></strong></div></article>
          <article><span className="summary-icon amber"><Package /></span><div><small>รายการใกล้หมด</small><strong>2 <em>รายการ</em></strong></div></article>
          <article><span className="summary-icon violet"><Users /></span><div><small>ขวดของ OEM</small><strong>{oemTotal.toLocaleString("th-TH")} <em>ขวด</em></strong></div></article>
        </section>

        <section className="inventory-layout">
          <div className="inventory-main-column">
            <section className="panel inventory-section">
              <div className="section-heading"><div><h2>สต็อกขวดน้ำ</h2><p>จำนวนขวดเปล่า แยกตามยี่ห้อและขนาด</p></div><span className="updated-chip">อัปเดตวันนี้</span></div>
              <div className="brand-tabs" role="tablist">{Object.keys(bottleStock).map(brand => <button key={brand} role="tab" aria-selected={brandTab === brand} className={brandTab === brand ? "active" : ""} onClick={() => setBrandTab(brand)}>{brand}</button>)}</div>
              <div className="inventory-cards bottle-grid">{bottleStock[brandTab].map(item => <StockCard key={item.id} item={item} />)}</div>
            </section>

            <section className="panel inventory-section">
              <div className="section-heading"><div><h2>บรรจุภัณฑ์และภาชนะ</h2><p>กด +/− เพื่อปรับยอดตัวอย่างในหน้าจอ</p></div></div>
              <div className="inventory-cards packaging-grid">{packaging.map(item => <StockCard key={item.id} item={item} onAdjust={delta => adjustPackaging(item.id, delta)} />)}</div>
            </section>
          </div>

          <aside className="panel oem-panel">
            <div className="section-heading"><div><h2>สต็อก OEM</h2><p>ขวดคงเหลือแยกตามลูกค้า</p></div><button className="add-round" onClick={() => setShowOemForm(true)} aria-label="เพิ่ม OEM"><Plus size={19} /></button></div>
            {showOemForm && <form className="oem-form" onSubmit={addOem}>
              <label>ชื่อ OEM<input value={oemName} onChange={e => setOemName(e.target.value)} placeholder="เช่น โรงแรมทวีชัย" autoFocus /></label>
              <label>จำนวนขวดในสต็อก<input type="number" min="0" value={oemQuantity} onChange={e => setOemQuantity(e.target.value)} placeholder="0" /></label>
              <div><button type="button" className="cancel-btn" onClick={() => setShowOemForm(false)}>ยกเลิก</button><button type="submit" className="save-btn">บันทึกรายการ</button></div>
            </form>}
            <div className="oem-list">{oemItems.map(item => <article key={item.id}><span className="oem-avatar">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>ขวดพร้อมใช้งาน</small></div><p><strong>{item.quantity.toLocaleString("th-TH")}</strong><span>ขวด</span></p><button onClick={() => setOemItems(items => items.filter(i => i.id !== item.id))} aria-label={`ลบ ${item.name}`}><Trash2 size={16} /></button></article>)}</div>
            {!showOemForm && <button className="wide-button" onClick={() => setShowOemForm(true)}><Plus size={18} /> เพิ่มรายการ OEM</button>}
            <div className="oem-note"><strong>ข้อมูลที่ควรบันทึกเพิ่มในระบบจริง</strong><p>ขนาดขวด, ล็อต, วันที่รับเข้า, ยอดจองผลิต และประวัติการปรับจำนวน</p></div>
          </aside>
        </section>
      </div>
    </main>

    <nav className="bottom-nav" aria-label="เมนูมือถือ">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => goTo(label)}><Icon size={21} /><span>{label.replace("สินค้า", "")}</span></button>)}</nav>
    <button className="mobile-fab" onClick={() => setShowOemForm(true)} aria-label="เพิ่ม OEM"><Plus size={24} /></button>
  </div>;
}
