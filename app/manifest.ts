import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantavion One",
    short_name: "Pantavion",
    description: "Pantavion is a governed global ecosystem for communication, safety, knowledge, work and AI-assisted execution.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#020712",
    theme_color: "#071a2d",
    categories: ["social", "productivity", "education", "utilities"],
    icons: [
      {
        src: "/pantavion-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  };
}
