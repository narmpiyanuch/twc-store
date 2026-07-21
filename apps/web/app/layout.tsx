import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insight Taweechai — ระบบจัดการสต็อกน้ำดื่ม",
  description: "POS, stock และการผลิตสำหรับธุรกิจน้ำดื่ม",
  applicationName: "Insight Taweechai",
  icons: {
    icon: [
      {
        url: "/insight-taweechai-logo.jpg",
        type: "image/jpeg",
        sizes: "500x500",
      },
    ],
    shortcut: "/insight-taweechai-logo.jpg",
    apple: [
      {
        url: "/insight-taweechai-logo.jpg",
        type: "image/jpeg",
        sizes: "500x500",
      },
    ],
  },
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
