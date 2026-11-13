import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taweechai",
    short_name: "Taweechai",
    description: "ระบบสต็อกและการผลิตน้ำดื่มทวีชัย",
    start_url: "/",
    display: "standalone",
    background_color: "#f6fafb",
    theme_color: "#087b8c",
    icons: [
      {
        src: "/insight-taweechai-logo.jpg",
        sizes: "500x500",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
