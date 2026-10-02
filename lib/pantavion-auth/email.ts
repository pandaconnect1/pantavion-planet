type PantavionAuthEmail = {
  to: string;
  subject: string;
  text: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`PANTAVION_AUTH_CONFIG_MISSING:${name}`);
  }
  return value;
}

export async function sendPantavionAuthEmail(message: PantavionAuthEmail) {
  const provider = (process.env.PANTAVION_AUTH_EMAIL_PROVIDER || "resend")
    .trim()
    .toLowerCase();

  if (provider !== "resend") {
    throw new Error("PANTAVION_AUTH_EMAIL_PROVIDER_UNSUPPORTED");
  }

  const apiKey = required("PANTAVION_AUTH_EMAIL_API_KEY");
  const from = required("PANTAVION_AUTH_FROM_EMAIL");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`PANTAVION_AUTH_EMAIL_SEND_FAILED:${response.status}`);
  }
}
