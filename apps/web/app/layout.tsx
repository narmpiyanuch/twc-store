import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ธารา POS — ระบบจัดการโรงงานน้ำดื่ม",
  description: "POS, stock และการผลิตสำหรับธุรกิจน้ำดื่ม",
  applicationName: "ธารา POS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087b8c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
