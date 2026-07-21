import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taweechai Store",
    short_name: "Taweechai",
    description: "ระบบขาย สต็อก และการผลิตน้ำดื่ม",
    start_url: "/",
    display: "standalone",
    background_color: "#f6fafb",
    theme_color: "#087b8c",
  };
}
