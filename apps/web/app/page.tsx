"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Home,
  Menu,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  Truck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "ภาพรวม", icon: Home },
  { label: "ขายสินค้า", icon: ShoppingCart },
  { label: "สต็อก", icon: Boxes },
  { label: "การผลิต", icon: Factory },
  { label: "ลูกค้า OEM", icon: Users },
];

const stockItems = [
  { name: "น้ำดื่ม 600 มล.", sku: "TWC-600", stock: "1,248 แพ็ก", level: 78, state: "ปกติ", tone: "good" },
  { name: "น้ำดื่ม 1.5 ลิตร", sku: "TWC-1500", stock: "286 แพ็ก", level: 35, state: "ใกล้จุดสั่ง", tone: "warn" },
  { name: "ฝาขวด สีฟ้า", sku: "CAP-BLUE", stock: "3,420 ชิ้น", level: 18, state: "ต่ำ", tone: "danger" },
];

const orders = [
  { id: "SO-240721-018", customer: "ร้านสุขใจมาร์ท", detail: "น้ำดื่ม 600 มล. · 80 แพ็ก", price: "฿4,800", status: "รอจัดส่ง", tone: "blue" },
  { id: "SO-240721-017", customer: "บริษัท เอเวอร์กรีน จำกัด", detail: "OEM 350 มล. · 250 ลัง", price: "฿42,500", status: "กำลังผลิต", tone: "purple" },
  { id: "SO-240721-016", customer: "คุณสมชาย", detail: "ถัง 18.9 ลิตร · 12 ถัง", price: "฿660", status: "ชำระแล้ว", tone: "green" },
];

export default function Dashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [active, setActive] = useState("ภาพรวม");

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><span>ธ</span></div>
          <div><strong>ธารา POS</strong><small>Water operations</small></div>
          <button className="icon-btn sidebar-close" onClick={() => setMobileMenu(false)} aria-label="ปิดเมนู"><X size={20} /></button>
        </div>
        <nav className="side-nav" aria-label="เมนูหลัก">
          <p className="nav-caption">เมนูหลัก</p>
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMobileMenu(false); }}>
              <Icon size={20} /><span>{label}</span>{label === "สต็อก" && <em>3</em>}
            </button>
          ))}
          <p className="nav-caption spaced">จัดการ</p>
          <button><Truck size={20} /><span>จัดซื้อและซัพพลายเออร์</span></button>
          <button><ClipboardList size={20} /><span>รายงาน</span></button>
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">อภ</div><div><strong>อภิญญา</strong><small>ผู้ดูแลระบบ</small></div><ChevronRight size={18} />
        </div>
      </aside>
      {mobileMenu && <button className="scrim" aria-label="ปิดเมนู" onClick={() => setMobileMenu(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileMenu(true)} aria-label="เปิดเมนู"><Menu size={23} /></button>
          <div className="topbar-title"><strong>{active}</strong><small>อัปเดตล่าสุด วันนี้ 10:42 น.</small></div>
          <label className="search"><Search size={19} /><input placeholder="ค้นหาสินค้า ออเดอร์ หรือลูกค้า" aria-label="ค้นหา" /><kbd>⌘ K</kbd></label>
          <button className="icon-btn notification" aria-label="การแจ้งเตือน"><Bell size={21} /><span /></button>
          <button className="primary-btn"><Plus size={19} /><span>สร้างรายการ</span></button>
        </header>

        <div className="content">
          <section className="welcome">
            <div><p className="eyebrow"><Sparkles size={16} /> สรุปการทำงานวันนี้</p><h1>สวัสดีตอนเช้า, อภิญญา</h1><p>วันนี้มี 6 ออเดอร์รอจัดส่ง และ 2 รายการที่ต้องตรวจสอบสต็อก</p></div>
            <button className="secondary-btn"><ClipboardList size={18} /> ดูรายงานประจำวัน</button>
          </section>

          <section className="metrics" aria-label="ตัวเลขสรุป">
            <article className="metric"><div className="metric-head"><span className="metric-icon teal"><CircleDollarSign /></span><span className="trend up"><ArrowUpRight size={14} />12.5%</span></div><p>ยอดขายวันนี้</p><h2>฿28,450</h2><small>เทียบกับ ฿25,280 เมื่อวาน</small></article>
            <article className="metric"><div className="metric-head"><span className="metric-icon blue"><WalletCards /></span><span className="trend up"><ArrowUpRight size={14} />8.2%</span></div><p>ออเดอร์วันนี้</p><h2>24 <small>รายการ</small></h2><small>ชำระแล้ว 18 · รอชำระ 6</small></article>
            <article className="metric"><div className="metric-head"><span className="metric-icon amber"><Boxes /></span><span className="trend down"><ArrowDownLeft size={14} />3 รายการ</span></div><p>สินค้าใกล้หมด</p><h2>8 <small>รายการ</small></h2><small>ต้องสั่งซื้อเร่งด่วน 3 รายการ</small></article>
            <article className="metric"><div className="metric-head"><span className="metric-icon violet"><Factory /></span><span className="status-dot">กำลังผลิต</span></div><p>แผนการผลิตวันนี้</p><h2>3 <small>ล็อต</small></h2><small>สำเร็จแล้ว 1 · กำลังผลิต 2</small></article>
          </section>

          <section className="dashboard-grid">
            <article className="panel sales-panel">
              <div className="panel-head"><div><h3>ภาพรวมยอดขาย</h3><p>ยอดขาย 7 วันล่าสุด</p></div><select aria-label="เลือกช่วงเวลา"><option>7 วันล่าสุด</option></select></div>
              <div className="chart-summary"><div><small>ยอดขายรวม</small><strong>฿164,920</strong></div><span className="trend up"><ArrowUpRight size={14} /> 18.2% จากสัปดาห์ก่อน</span></div>
              <div className="chart" aria-label="กราฟยอดขายรายสัปดาห์">
                {[62, 78, 48, 88, 66, 95, 82].map((height, index) => <div className="bar-wrap" key={index}><div className={`bar ${index === 5 ? "peak" : ""}`} style={{height: `${height}%`}}><span>฿{[18,24,14,29,21,34,27][index]}k</span></div><small>{["จ.","อ.","พ.","พฤ.","ศ.","ส.","อา."][index]}</small></div>)}
              </div>
            </article>

            <article className="panel production-panel">
              <div className="panel-head"><div><h3>สถานะการผลิต</h3><p>อัปเดตแบบเรียลไทม์</p></div><button className="text-btn">ดูทั้งหมด <ChevronRight size={16} /></button></div>
              <div className="production-list">
                <div className="production-item"><div className="lot-icon"><Factory size={20}/></div><div className="lot-info"><div><strong>LOT-240721-A</strong><span className="chip producing">กำลังผลิต</span></div><p>น้ำดื่ม 600 มล. · 1,200 แพ็ก</p><div className="progress"><i style={{width:"72%"}} /></div><small>72% · คาดว่าจะเสร็จ 13:30 น.</small></div></div>
                <div className="production-item"><div className="lot-icon soft"><PackageCheck size={20}/></div><div className="lot-info"><div><strong>LOT-240721-B</strong><span className="chip waiting">รอตรวจ QC</span></div><p>OEM Evergreen 350 มล. · 500 ลัง</p><div className="progress amber-progress"><i style={{width:"100%"}} /></div><small>ผลิตเสร็จแล้ว · รอผลตรวจคุณภาพ</small></div></div>
              </div>
              <button className="wide-button"><Plus size={18}/> สร้างแผนการผลิต</button>
            </article>

            <article className="panel orders-panel">
              <div className="panel-head"><div><h3>ออเดอร์ล่าสุด</h3><p>รายการขายที่เพิ่งเกิดขึ้น</p></div><button className="text-btn">ดูทั้งหมด <ChevronRight size={16} /></button></div>
              <div className="table-wrap"><table><thead><tr><th>เลขที่ออเดอร์</th><th>ลูกค้า</th><th>รายการ</th><th>ยอดรวม</th><th>สถานะ</th><th></th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><strong>{order.id}</strong><small>วันนี้ 10:{order.id.slice(-2)}</small></td><td>{order.customer}</td><td>{order.detail}</td><td><strong>{order.price}</strong></td><td><span className={`chip ${order.tone}`}>{order.status}</span></td><td><button className="icon-btn small" aria-label={`ดู ${order.id}`}><ChevronRight size={17}/></button></td></tr>)}</tbody></table></div>
            </article>

            <article className="panel stock-panel">
              <div className="panel-head"><div><h3>สุขภาพสต็อก</h3><p>สินค้าที่ควรติดตาม</p></div><button className="text-btn">ดูทั้งหมด <ChevronRight size={16} /></button></div>
              <div className="stock-list">{stockItems.map(item => <div className="stock-item" key={item.sku}><div className="product-thumb"><Boxes size={21}/></div><div className="stock-info"><div><strong>{item.name}</strong><span className={`stock-state ${item.tone}`}>{item.state}</span></div><small>{item.sku} · คงเหลือ {item.stock}</small><div className={`progress stock-progress ${item.tone}`}><i style={{width:`${item.level}%`}}/></div></div></div>)}</div>
              <div className="stock-alert"><TriangleAlert size={19}/><div><strong>มี 3 รายการต่ำกว่าจุดสั่งซื้อ</strong><small>ตรวจสอบและสร้างใบสั่งซื้อเพื่อป้องกันการผลิตสะดุด</small></div><ChevronRight size={18}/></div>
            </article>
          </section>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="เมนูมือถือ">{navItems.slice(0,5).map(({label,icon:Icon}) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={21}/><span>{label.replace("สินค้า","")}</span></button>)}</nav>
      <button className="mobile-fab" aria-label="สร้างรายการ"><Plus size={24}/></button>
    </div>
  );
}
