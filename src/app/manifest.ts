import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vox — Onchain Voice Agent", short_name: "Vox",
    description: "Speak naturally. Move onchain with clarity.",
    start_url: "/", display: "standalone", background_color: "#f4f3ef", theme_color: "#f4f3ef",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
