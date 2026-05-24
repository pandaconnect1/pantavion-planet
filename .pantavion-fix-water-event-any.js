const fs = require("fs");

const file = "app/professional/infrastructure/water/readiness/water-multimodal-language-console.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replace(
  "recognition.onresult = (event) => {",
  "recognition.onresult = (event: any) => {"
);

fs.writeFileSync(file, text, "utf8");
console.log("FIXED_EVENT_ANY");
