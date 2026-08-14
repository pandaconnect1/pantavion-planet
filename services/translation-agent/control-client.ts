export async function sendToMyGpt(url: string, apiKey: string, payload: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    // note: node-fetch doesn't support timeout in this signature by default; caller may wrap with AbortController
  });

  const text = await res.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : null;
    return { ok: res.ok, status: res.status, body: json ?? text };
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
}
