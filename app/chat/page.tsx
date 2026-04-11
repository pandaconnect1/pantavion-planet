import { PantavionPage } from "../pantavion-clean-ui";

export default function ChatPage() {
  return (
    <PantavionPage
      current="chat"
      title="CHAT • CONVERSATIONS"
      subtitle="Unified conversations for personal, professional and service communication. This shell prepares the place where text chat, voice, video and AI assistance will converge."
      wideCards
      cards={[
        {
          title: "Conversation workspace",
          copy: "This is the clean conversation shell for pantavion-planet. The future version will merge classic chat, AI help, voice bridges and service communication in one place.",
          bullets: [
            "Conversation list for contacts, groups and services",
            "Primary chat window and message history",
            "Voice / interpreter bridge per conversation",
            "AI assistance attached to the discussion",
          ],
        },
      ]}
    />
  );
}
