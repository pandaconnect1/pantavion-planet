import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  try {
    const body = await request.json();

    const required = ["organizationName", "country", "officialEmail", "partnerType"];

    for (const key of required) {
      if (!String(body?.[key] ?? "").trim()) {
        return NextResponse.json(
          {
            ok: false,
            message: `Missing required field: ${key}`,
            receivedAt,
          },
          { status: 400 }
        );
      }
    }

    const payload = {
      event: "pantavion.emergency.partner_interest",
      receivedAt,
      body,
    };

    const webhookUrl = process.env.PANTAVION_PARTNER_INTEREST_WEBHOOK_URL;

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pantavion-Event": "emergency.partner_interest",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Partner interest received by Pantavion API but external webhook failed.",
            receivedAt,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        delivery: "webhook",
        message: "Partner interest delivered to configured Pantavion webhook.",
        receivedAt,
      });
    }
return NextResponse.json({
      ok: true,
      delivery: "internal-api",
      message:
        "Partner interest reached the Pantavion API. External partner webhook is not configured yet.",
      receivedAt,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Could not parse partner interest request.",
        receivedAt,
      },
      { status: 500 }
    );
  }
}
