const fs = require("fs");

const file = "app/pantavion/live-interpreter/page.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replace(/declare global \{[\s\S]*?\n\}\n\n/, "");

text = text.replace(
  `const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;`,
  `const browserWindow = window as typeof window & {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };

    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;`
);

fs.writeFileSync(file, text, "utf8");
console.log("fixed live interpreter browser speech types");
