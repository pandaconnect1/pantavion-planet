const fs = require("fs");

const file = "app/professional/infrastructure/water/readiness/water-multimodal-language-console.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replaceAll("recognition.onresult = (event) =>", "recognition.onresult = (event: any) =>");
text = text.replaceAll("recognition.onerror = (event) =>", "recognition.onerror = (event: any) =>");
text = text.replaceAll("recognition.onnomatch = (event) =>", "recognition.onnomatch = (event: any) =>");
text = text.replaceAll("recognition.onspeechend = (event) =>", "recognition.onspeechend = (event: any) =>");
text = text.replaceAll("recognition.onstart = (event) =>", "recognition.onstart = (event: any) =>");
text = text.replaceAll("recognition.onend = (event) =>", "recognition.onend = (event: any) =>");

fs.writeFileSync(file, text, "utf8");
console.log("FIXED_ALL_WATER_SPEECH_EVENTS");
