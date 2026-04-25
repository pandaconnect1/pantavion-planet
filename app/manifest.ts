import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantavion One",
    short_name: "Pantavion",
    description:
      "One living platform for AI execution, communication, social connection, work, media, services and global language access.",
    start_url: "/",
    display: "standalone",
    background_color: "#06111f",
    theme_color: "#06111f",
    icons: [
      {
        src: "/pantavion-orb.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
