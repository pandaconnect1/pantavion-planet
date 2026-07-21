import "server-only";

import { createHash } from "crypto";

import { del, list, put } from "@vercel/blob";
import webPush, { type PushSubscription, type VapidKeys } from "web-push";

const VAPID_KEYS_PATH = "water/private/admin-notifications/vapid-keys.json";
const SUBSCRIPTION_PREFIX = "water/private/admin-notifications/subscriptions/";
const VAPID_SUBJECT = "https://www.pantavion.com";

type BlobLike = {
  pathname: string;
  url?: string;
  downloadUrl?: string;
};

type StoredVapidKeys = VapidKeys & {
  version: "pantavion-water-admin-push-v1";
  createdAt: string;
};

type StoredPushSubscription = {
  version: "pantavion-water-admin-push-subscription-v1";
  endpointHash: string;
  subscription: PushSubscription;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
};

export type WaterAdminPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export type WaterAdminPushDelivery = {
  attempted: number;
  sent: number;
  removed: number;
  failed: number;
};

function clean(value: unknown, maxLength = 2000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getBlobToken() {
  const token = clean(process.env.BLOB_READ_WRITE_TOKEN, 4000);

  if (!token) {
    throw new Error("missing_blob_token");
  }

  return token;
}

function privateBlobHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function readPrivateJson<T>(pathname: string, token: string): Promise<T | null> {
  const result = await list({
    prefix: pathname,
    limit: 1,
    token,
  });
  const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);
  const url = blob?.downloadUrl || blob?.url;

  if (!url) return null;

  const response = await fetch(url, {
    cache: "no-store",
    headers: privateBlobHeaders(token),
  });

  if (!response.ok) return null;

  return (await response.json()) as T;
}

function validVapidKeys(value: StoredVapidKeys | null): value is StoredVapidKeys {
  return Boolean(clean(value?.publicKey, 500) && clean(value?.privateKey, 500));
}

export async function getOrCreateWaterAdminVapidKeys(): Promise<VapidKeys> {
  const token = getBlobToken();
  const existing = await readPrivateJson<StoredVapidKeys>(VAPID_KEYS_PATH, token);

  if (validVapidKeys(existing)) {
    return {
      publicKey: existing.publicKey,
      privateKey: existing.privateKey,
    };
  }

  const generated = webPush.generateVAPIDKeys();
  const record: StoredVapidKeys = {
    ...generated,
    version: "pantavion-water-admin-push-v1",
    createdAt: new Date().toISOString(),
  };

  try {
    await put(VAPID_KEYS_PATH, JSON.stringify(record, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
      token,
    });

    return generated;
  } catch (error) {
    const concurrentlyCreated = await readPrivateJson<StoredVapidKeys>(VAPID_KEYS_PATH, token);

    if (validVapidKeys(concurrentlyCreated)) {
      return {
        publicKey: concurrentlyCreated.publicKey,
        privateKey: concurrentlyCreated.privateKey,
      };
    }

    throw error;
  }
}

function normalizeSubscription(value: unknown): PushSubscription {
  if (!value || typeof value !== "object") {
    throw new Error("invalid_push_subscription");
  }

  const candidate = value as {
    endpoint?: unknown;
    expirationTime?: unknown;
    keys?: {
      p256dh?: unknown;
      auth?: unknown;
    };
  };
  const endpoint = clean(candidate.endpoint, 3000);
  const p256dh = clean(candidate.keys?.p256dh, 1000);
  const auth = clean(candidate.keys?.auth, 1000);

  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    throw new Error("invalid_push_subscription");
  }

  return {
    endpoint,
    expirationTime:
      typeof candidate.expirationTime === "number" ? candidate.expirationTime : null,
    keys: {
      p256dh,
      auth,
    },
  };
}

function subscriptionPath(endpoint: string) {
  const endpointHash = createHash("sha256").update(endpoint).digest("hex");

  return {
    endpointHash,
    pathname: `${SUBSCRIPTION_PREFIX}${endpointHash}.json`,
  };
}

export async function saveWaterAdminPushSubscription(input: {
  subscription: unknown;
  userAgent?: unknown;
}) {
  const token = getBlobToken();
  const subscription = normalizeSubscription(input.subscription);
  const { endpointHash, pathname } = subscriptionPath(subscription.endpoint);
  const existing = await readPrivateJson<StoredPushSubscription>(pathname, token);
  const now = new Date().toISOString();
  const record: StoredPushSubscription = {
    version: "pantavion-water-admin-push-subscription-v1",
    endpointHash,
    subscription,
    userAgent: clean(input.userAgent, 500),
    createdAt: clean(existing?.createdAt, 100) || now,
    updatedAt: now,
  };

  await put(pathname, JSON.stringify(record, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });

  return {
    endpointHash,
    updatedAt: now,
  };
}

export async function removeWaterAdminPushSubscription(endpointValue: unknown) {
  const endpoint = clean(endpointValue, 3000);

  if (!endpoint.startsWith("https://")) {
    throw new Error("invalid_push_endpoint");
  }

  const token = getBlobToken();
  const { pathname } = subscriptionPath(endpoint);
  await del(pathname, { token });
}

export async function hasWaterAdminPushSubscription(endpointValue: unknown) {
  const endpoint = clean(endpointValue, 3000);

  if (!endpoint.startsWith("https://")) return false;

  const token = getBlobToken();
  const { pathname } = subscriptionPath(endpoint);
  const record = await readPrivateJson<StoredPushSubscription>(pathname, token);

  return Boolean(record?.subscription?.endpoint === endpoint);
}

async function listWaterAdminPushSubscriptions() {
  const token = getBlobToken();
  const result = await list({
    prefix: SUBSCRIPTION_PREFIX,
    limit: 1000,
    token,
  });

  const records = await Promise.all(
    (result.blobs as BlobLike[]).map(async (blob) => {
      const record = await readPrivateJson<StoredPushSubscription>(blob.pathname, token);

      if (!record) return null;

      try {
        return {
          pathname: blob.pathname,
          subscription: normalizeSubscription(record.subscription),
        };
      } catch {
        return null;
      }
    }),
  );

  return {
    token,
    records: records.filter(
      (record): record is { pathname: string; subscription: PushSubscription } => Boolean(record),
    ),
  };
}

export async function getWaterAdminPushSubscriptionCount() {
  const { records } = await listWaterAdminPushSubscriptions();

  return records.length;
}

function pushStatusCode(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return 0;

  const statusCode = Number((error as { statusCode?: unknown }).statusCode);
  return Number.isFinite(statusCode) ? statusCode : 0;
}

export async function sendWaterAdminPushNotification(
  payload: WaterAdminPushPayload,
): Promise<WaterAdminPushDelivery> {
  const { token, records } = await listWaterAdminPushSubscriptions();

  if (records.length === 0) {
    return {
      attempted: 0,
      sent: 0,
      removed: 0,
      failed: 0,
    };
  }

  const vapidKeys = await getOrCreateWaterAdminVapidKeys();
  const notificationPayload = JSON.stringify({
    title: clean(payload.title, 120) || "Pantavion",
    body: clean(payload.body, 300),
    url: clean(payload.url, 500) || "/professional/infrastructure/water/admin/approvals",
    tag: clean(payload.tag, 80) || "pantavion-water-admin",
    createdAt: new Date().toISOString(),
  });

  const deliveries = await Promise.all(
    records.map(async (record) => {
      try {
        await webPush.sendNotification(record.subscription, notificationPayload, {
          TTL: 60 * 60,
          urgency: "high",
          topic: clean(payload.tag, 32) || "water-admin-alert",
          timeout: 10_000,
          vapidDetails: {
            subject: VAPID_SUBJECT,
            publicKey: vapidKeys.publicKey,
            privateKey: vapidKeys.privateKey,
          },
        });

        return "sent" as const;
      } catch (error) {
        const statusCode = pushStatusCode(error);

        if (statusCode === 404 || statusCode === 410) {
          await del(record.pathname, { token });
          return "removed" as const;
        }

        return "failed" as const;
      }
    }),
  );

  return {
    attempted: records.length,
    sent: deliveries.filter((delivery) => delivery === "sent").length,
    removed: deliveries.filter((delivery) => delivery === "removed").length,
    failed: deliveries.filter((delivery) => delivery === "failed").length,
  };
}
