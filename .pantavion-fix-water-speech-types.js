const fs = require("fs");

const file = "app/professional/infrastructure/water/readiness/water-multimodal-language-console.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replace(/declare global \{[\s\S]*?\n\}\n\n/, "");
text = text.replaceAll("window.SpeechRecognition", "(window as any).SpeechRecognition");
text = text.replaceAll("window.webkitSpeechRecognition", "(window as any).webkitSpeechRecognition");

fs.writeFileSync(file, text, "utf8");
console.log("FIXED_WATER_SPEECH_TYPES");
