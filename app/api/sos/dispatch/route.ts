import { NextRequest, NextResponse } from "next/server";
import { persistPantavionSosKernelIntake } from "@/core/sos/pantavion-sos-kernel-lane";
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
        { status: 400 },
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
        { status: 400 },
      );
    }

    try {
      await persistPantavionSosKernelIntake(packet, receivedAt);
    } catch {
      return NextResponse.json<PantavionSosDispatchResult>(
        {
          ok: false,
          delivery: "manual",
          message:
            "SOS could not be durably recorded inside Pantavion. No external delivery is claimed. Use local emergency phone, SMS, or trusted-contact actions now.",
          receivedAt,
        },
        { status: 503 },
      );
    }

    const webhookUrl = process.env.PANTAVION_SOS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json<PantavionSosDispatchResult>({
        ok: true,
        delivery: "internal-api",
        message:
          "SOS was durably recorded in the Pantavion Kernel SOS lane. External rescue dispatch is not configured and is not claimed.",
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
            "SOS was recorded inside Pantavion, but the configured external emergency channel failed. No authority dispatch is claimed. Keep using phone, SMS, share, and local rescue actions.",
          receivedAt,
        },
        { status: 502 },
      );
    }

    return NextResponse.json<PantavionSosDispatchResult>({
      ok: true,
      delivery: "webhook",
      message:
        "SOS was durably recorded and delivered to the configured Pantavion emergency channel. This does not by itself confirm dispatch by police, ambulance, fire, or another authority.",
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
      { status: 500 },
    );
  }
}
