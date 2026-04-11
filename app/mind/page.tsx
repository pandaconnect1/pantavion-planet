import { PantavionPage } from "../pantavion-clean-ui";

export default function MindPage() {
  return (
    <PantavionPage
      current="mind"
      title="MIND • KNOWLEDGE & IDEAS"
      subtitle="The knowledge brain of Pantavion: notes, memory, idea networks, research surfaces and future graph-based understanding."
      wideCards
      cards={[
        {
          title: "Mind workspace",
          copy: "This is the shell for structured knowledge and idea continuity. It prepares the path for research hubs, graph memory and AI reasoning surfaces.",
          bullets: [
            "Graph knowledge surfaces for people, roles and concepts",
            "Personal mind space per user",
            "Research hubs for health, education and cities",
            "AI agents that read, connect and propose knowledge",
          ],
        },
      ]}
    />
  );
}
