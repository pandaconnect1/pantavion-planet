import { PantavionPage } from "../pantavion-clean-ui";

export default function VoicePage() {
  return (
    <PantavionPage
      current="voice"
      title="VOICE • LIVE INTERPRETER"
      subtitle="Live voice interpreter demo. This is the clean shell for the voice surface inside pantavion-planet, preparing the route for STT, TTS, language detection and translated continuity."
      intro="Press Start listening and the browser demo area will become the first safe container for real-time voice and translated output."
      voicePanels={[
        {
          title: "Original Speech",
          copy: "The speech captured from your microphone will appear here in real time.",
          body: "[Waiting... when you speak, the text will appear here.]",
        },
        {
          title: "Translated Speech (demo)",
          copy: "The translated version will appear here once the interpreter pipeline is connected.",
          body: "Once recognition starts, the translated text area will receive the output here.",
        },
      ]}
      note="At this stage the Voice module is a clean shell and safe demo surface. The next step is to connect real STT, language selection, translated output and persistent session flow."
    />
  );
}
