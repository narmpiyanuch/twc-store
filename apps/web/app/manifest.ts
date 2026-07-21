import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Insight Taweechai",
    short_name: "Insight TWC",
    description: "ระบบสต็อกและการผลิตน้ำดื่มทวีชัย",
    start_url: "/",
    display: "standalone",
    background_color: "#f6fafb",
    theme_color: "#087b8c",
  };
}
