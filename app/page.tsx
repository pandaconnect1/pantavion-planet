import { HomeSurface } from "@/components/PantavionPublicShell";
import { homePillars, revenuePillars } from "@/core/public/pantavion-public-surfaces";

export const metadata = {
  title: "Pantavion One | One Living Platform",
  description:
    "One living platform for AI execution, communication, social connection, work, media, services and global language access.",
};

export default function HomePage() {
  return <HomeSurface pillars={homePillars} revenue={revenuePillars} />;
}
