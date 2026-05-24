const fs = require("fs");

const file = "core/identity/identity-model.ts";
let text = fs.readFileSync(file, "utf8");

if (!text.includes("export const identityModel")) {
  text += `

export const identityModel = {
  id: "pantavion_identity_model_v1",
  systemIdentity: SYSTEM_KERNEL_IDENTITY,
  buildIdentityProfile,
  resolveIdentity,
  hasRequiredScopes,
} as const;
`;
}

fs.writeFileSync(file, text, "utf8");
console.log("ADDED_IDENTITY_MODEL_EXPORT");
