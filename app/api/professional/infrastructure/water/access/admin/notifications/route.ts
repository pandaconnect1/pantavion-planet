import { NextResponse } from "next/server";

import {
  getOrCreateWaterAdminVapidKeys,
  getWaterAdminPushSubscriptionCount,
  hasWaterAdminPushSubscription,
  removeWaterAdminPushSubscription,
  saveWaterAdminPushSubscription,
  sendWaterAdminPushNotification,
} from "@/core/infrastructure/water/water-admin-push";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NotificationRequestBody = {
  action?: "bootstrap" | "status" | "subscribe" | "test" | "unsubscribe";
  subscription?: unknown;
  endpoint?: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!hasWaterAdminSession(request)) {
    return json(
      {
        ok: false,
        error: "admin_session_required",
      },
      401,
    );
  }

  try {
    const body = (await request.json()) as NotificationRequestBody;

    if (body.action === "bootstrap") {
      const [vapidKeys, subscriptionCount] = await Promise.all([
        getOrCreateWaterAdminVapidKeys(),
        getWaterAdminPushSubscriptionCount(),
      ]);

      return json({
        ok: true,
        publicKey: vapidKeys.publicKey,
        subscriptionCount,
      });
    }

    if (body.action === "status") {
      const subscribed = await hasWaterAdminPushSubscription(body.endpoint);

      return json({
        ok: true,
        subscribed,
      });
    }

    if (body.action === "subscribe") {
      const saved = await saveWaterAdminPushSubscription({
        subscription: body.subscription,
        userAgent: request.headers.get("user-agent"),
      });
      const delivery = await sendWaterAdminPushNotification({
        title: "Pantavion ειδοποιήσεις ενεργές",
        body: "Οι ειδοποιήσεις νέων αιτημάτων λειτουργούν. Αν άκουσες τον ήχο, είσαι έτοιμος.",
        url: "/professional/infrastructure/water/admin/approvals",
        tag: "water-push-enabled",
      });

      return json({
        ok: true,
        saved: true,
        endpointHash: saved.endpointHash,
        testSent: delivery.sent > 0,
        delivery,
      });
    }

    if (body.action === "test") {
      const delivery = await sendWaterAdminPushNotification({
        title: "Δοκιμή Pantavion",
        body: "Η ειδοποίηση και ο ήχος νέων αιτημάτων λειτουργούν στο κινητό σου.",
        url: "/professional/infrastructure/water/admin/approvals",
        tag: "water-admin-push-test",
      });

      if (delivery.sent === 0) {
        return json(
          {
            ok: false,
            error: "no_active_push_subscription",
            delivery,
          },
          409,
        );
      }

      return json({
        ok: true,
        testSent: true,
        delivery,
      });
    }

    if (body.action === "unsubscribe") {
      await removeWaterAdminPushSubscription(body.endpoint);

      return json({
        ok: true,
        unsubscribed: true,
      });
    }

    return json(
      {
        ok: false,
        error: "unsupported_notification_action",
      },
      400,
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "notification_action_failed",
      },
      500,
    );
  }
}
