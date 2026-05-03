const fs = require("fs");

const path = "core/emergency/lifeshield-emergency-i18n.ts";
let content = fs.readFileSync(path, "utf8");

function replaceOnce(search, replacement) {
  if (!content.includes(search)) {
    return;
  }
  content = content.replace(search, replacement);
}

if (!content.includes("guardianButton: string;")) {
  replaceOnce(
    "  networkButton: string;\n  betaNotice: string;",
    [
      "  networkButton: string;",
      "  guardianButton: string;",
      "  evidenceButton: string;",
      "  scenariosButton: string;",
      "  extremeOffgridButton: string;",
      "  partnersButton: string;",
      "  betaNotice: string;",
    ].join("\n")
  );
}

if (!content.includes('guardianButton: "Guardian Mode"')) {
  replaceOnce(
    '  networkButton: "Global Network",\n  betaNotice:',
    [
      '  networkButton: "Global Network",',
      '  guardianButton: "Guardian Mode",',
      '  evidenceButton: "Evidence Capsule",',
      '  scenariosButton: "Scenario Guide",',
      '  extremeOffgridButton: "Extreme Off-grid",',
      '  partnersButton: "Official Partners",',
      '  betaNotice:',
    ].join("\n")
  );
}

if (!content.includes('guardianButton: "Guardian Mode",') && content.includes('networkButton: "Global Network",')) {
  content = content.replace(
    'networkButton: "Global Network",',
    [
      'networkButton: "Global Network",',
      '    guardianButton: "Guardian Mode",',
      '    evidenceButton: "Evidence Capsule",',
      '    scenariosButton: "δηγός εναρίων",',
      '    extremeOffgridButton: "Extreme Off-grid",',
      '    partnersButton: "πίσημοι υνεργάτες",',
    ].join("\n")
  );
}

if (!content.includes('{ id: "guardian"')) {
  replaceOnce(
    '  { id: "global-network", href: "/pantavion/emergency/global-network", labelKey: "networkButton" },\n];',
    [
      '  { id: "global-network", href: "/pantavion/emergency/global-network", labelKey: "networkButton" },',
      '  { id: "guardian", href: "/pantavion/emergency/guardian", labelKey: "guardianButton" },',
      '  { id: "evidence", href: "/pantavion/emergency/evidence", labelKey: "evidenceButton" },',
      '  { id: "scenarios", href: "/pantavion/emergency/scenarios", labelKey: "scenariosButton" },',
      '  { id: "extreme-offgrid", href: "/pantavion/emergency/extreme-offgrid", labelKey: "extremeOffgridButton" },',
      '  { id: "partners", href: "/pantavion/emergency/partners", labelKey: "partnersButton" },',
      '];',
    ].join("\n")
  );
}

fs.writeFileSync(path, content, "utf8");
console.log("Emergency routes updated with Guardian/Evidence/Scenarios/Partners.");
