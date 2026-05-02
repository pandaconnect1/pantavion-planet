import { NextRequest, NextResponse } from "next/server";
import type {
  PantavionSosDispatchResult,
  PantavionSosPacket,
} from "@/types/pantavion-sos";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  try {
    const packet = (await request.json()) as PantavionSosPacket;

    if (!packet?.profile?.consent) {
      return NextResponse.json<PantavionSosDispatchResult>(
        {
          ok: false,
          delivery: "manual",
          message:
            "Consent is required before Pantavion can use emergency profile data for SOS dispatch.",
          receivedAt,
        },
        { status: 400 }
      );
    }

    if (!packet?.id || !packet?.message) {
      return NextResponse.json<PantavionSosDispatchResult>(
        {
          ok: false,
          delivery: "manual",
          message: "Invalid SOS packet. Missing packet id or message.",
          receivedAt,
        },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.PANTAVION_SOS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log("[Pantavion SOS] Internal API received SOS packet:", {
        id: packet.id,
        createdAt: packet.createdAt,
        location: packet.location,
        profileName: packet.profile.fullName,
      });

      return NextResponse.json<PantavionSosDispatchResult>({
        ok: true,
        delivery: "internal-api",
        message:
          "SOS reached the Pantavion internal API. External rescue webhook is not configured yet.",
        receivedAt,
      });
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pantavion-Event": "lifeshield.sos",
      },
      body: JSON.stringify({
        event: "lifeshield.sos",
        receivedAt,
        packet,
      }),
      cache: "no-store",
    });

    if (!webhookResponse.ok) {
      return NextResponse.json<PantavionSosDispatchResult>(
        {
          ok: false,
          delivery: "manual",
          message:
            "External SOS webhook failed. Keep using phone, SMS, share, and local rescue actions.",
          receivedAt,
        },
        { status: 502 }
      );
    }

    return NextResponse.json<PantavionSosDispatchResult>({
      ok: true,
      delivery: "webhook",
      message: "SOS dispatched to the configured Pantavion emergency webhook.",
      receivedAt,
    });
  } catch {
    return NextResponse.json<PantavionSosDispatchResult>(
      {
        ok: false,
        delivery: "manual",
        message: "SOS API could not parse the request. Nothing was silently accepted.",
        receivedAt,
      },
      { status: 500 }
    );
  }
}
