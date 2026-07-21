"use client";

import { useEffect, useState } from "react";

const NOTIFICATION_API =
  "/api/professional/infrastructure/water/access/admin/notifications";
const SERVICE_WORKER_PATH = "/water-admin-push-sw.js";
const SERVICE_WORKER_SCOPE = "/professional/infrastructure/water/admin/";

type PushState =
  | "checking"
  | "unsupported"
  | "blocked"
  | "inactive"
  | "active"
  | "busy"
  | "error";

type NotificationApiResponse = {
  ok?: boolean;
  publicKey?: string;
  testSent?: boolean;
  subscribed?: boolean;
  error?: string;
};

function pushIsSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function base64UrlToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}

async function postNotificationAction(body: Record<string, unknown>) {
  const response = await fetch(NOTIFICATION_API, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as NotificationApiResponse;

  if (!response.ok || !json.ok) {
    throw new Error(json.error || "notification_action_failed");
  }

  return json;
}

function pushErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "notification_action_failed";

  if (code === "admin_session_required") {
    return "Το ασφαλές Administrator session έληξε. Κάνε ξανά είσοδο και δοκίμασε.";
  }

  if (code === "no_active_push_subscription") {
    return "Δεν βρέθηκε ενεργή συσκευή ειδοποιήσεων. Πάτησε ξανά Ενεργοποίηση.";
  }

  if (code === "permission_denied") {
    return "Οι ειδοποιήσεις είναι μπλοκαρισμένες από το κινητό ή τον browser.";
  }

  return "Η ειδοποίηση δεν ενεργοποιήθηκε. Έλεγξε τη σύνδεση και δοκίμασε ξανά.";
}

export default function WaterAdminPushControls() {
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushMessage, setPushMessage] = useState("Έλεγχος δυνατότητας ειδοποιήσεων...");

  async function refreshPushState() {
    if (!pushIsSupported()) {
      setPushState("unsupported");
      setPushMessage(
        "Αυτό το παράθυρο δεν υποστηρίζει push. Άνοιξε το Pantavion σε Chrome ή Samsung Internet.",
      );
      return;
    }

    if (Notification.permission === "denied") {
      setPushState("blocked");
      setPushMessage("Οι ειδοποιήσεις του pantavion.com είναι μπλοκαρισμένες στις ρυθμίσεις.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE);
      const subscription = await registration?.pushManager.getSubscription();

      if (Notification.permission === "granted" && subscription) {
        const serverStatus = await postNotificationAction({
          action: "status",
          endpoint: subscription.endpoint,
        });

        if (serverStatus.subscribed) {
          setPushState("active");
          setPushMessage("Οι ειδοποιήσεις νέων αιτημάτων είναι ενεργές σε αυτό το κινητό.");
        } else {
          setPushState("inactive");
          setPushMessage("Η παλιά σύνδεση ειδοποιήσεων χρειάζεται επανενεργοποίηση.");
        }
      } else {
        setPushState("inactive");
        setPushMessage("Οι ειδοποιήσεις δεν έχουν ενεργοποιηθεί ακόμη σε αυτό το κινητό.");
      }
    } catch (error) {
      setPushState("error");
      setPushMessage(pushErrorMessage(error));
    }
  }

  useEffect(() => {
    void refreshPushState();
  }, []);

  async function enablePush() {
    if (!pushIsSupported()) {
      await refreshPushState();
      return;
    }

    setPushState("busy");
    setPushMessage("Ενεργοποίηση ειδοποιήσεων και αποστολή δοκιμαστικού ήχου...");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("permission_denied");
      }

      const bootstrap = await postNotificationAction({ action: "bootstrap" });

      if (!bootstrap.publicKey) {
        throw new Error("missing_push_public_key");
      }

      await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
        scope: SERVICE_WORKER_SCOPE,
        updateViaCache: "none",
      });
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(bootstrap.publicKey),
        });
      }

      const result = await postNotificationAction({
        action: "subscribe",
        subscription: subscription.toJSON(),
      });

      if (!result.testSent) {
        throw new Error("test_push_not_delivered");
      }

      setPushState("active");
      setPushMessage(
        "Ενεργοποιήθηκαν. Στάλθηκε τώρα δοκιμαστική ειδοποίηση — έλεγξε ότι ακούστηκε ο ήχος.",
      );
    } catch (error) {
      if (Notification.permission === "denied") {
        setPushState("blocked");
      } else {
        setPushState("error");
      }
      setPushMessage(pushErrorMessage(error));
    }
  }

  async function testPush() {
    setPushState("busy");
    setPushMessage("Αποστολή πραγματικής δοκιμαστικής ειδοποίησης...");

    try {
      await postNotificationAction({ action: "test" });
      setPushState("active");
      setPushMessage("Η δοκιμαστική ειδοποίηση στάλθηκε. Έλεγξε την οθόνη και τον ήχο του κινητού.");
    } catch (error) {
      setPushState("error");
      setPushMessage(pushErrorMessage(error));
    }
  }

  async function disablePush() {
    if (!pushIsSupported()) return;

    setPushState("busy");
    setPushMessage("Απενεργοποίηση ειδοποιήσεων σε αυτό το κινητό...");

    try {
      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE);
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await postNotificationAction({
          action: "unsubscribe",
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }

      setPushState("inactive");
      setPushMessage("Οι ειδοποιήσεις απενεργοποιήθηκαν σε αυτό το κινητό.");
    } catch (error) {
      setPushState("error");
      setPushMessage(pushErrorMessage(error));
    }
  }

  const stateLabel =
    pushState === "active"
      ? "Ενεργές"
      : pushState === "busy" || pushState === "checking"
        ? "Έλεγχος..."
        : pushState === "blocked"
          ? "Μπλοκαρισμένες"
          : pushState === "unsupported"
            ? "Δεν υποστηρίζονται εδώ"
            : "Ανενεργές";

  return (
    <section className="mt-6 rounded-3xl border border-sky-500/50 bg-sky-950/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
            Mobile Push
          </p>
          <h2 className="mt-2 text-2xl font-black">Ειδοποίηση νέου αιτήματος στο κινητό</h2>
        </div>
        <span className="rounded-full border border-sky-400/50 px-3 py-1 text-xs font-black text-sky-100">
          {stateLabel}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-200">
        Όταν έρθει πραγματικό νέο pending αίτημα, το Android θα εμφανίζει ειδοποίηση με δόνηση και
        τον κανονικό ήχο ειδοποιήσεων, ακόμη κι αν η σελίδα είναι κλειστή.
      </p>

      <p aria-live="polite" className="mt-3 rounded-2xl border border-sky-500/30 bg-[#07111f] p-3 text-sm font-bold text-sky-100">
        {pushMessage}
      </p>

      {pushState === "active" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void testPush()}
            className="rounded-2xl bg-sky-300 px-5 py-3 font-black text-[#06111f]"
          >
            Δοκιμή ειδοποίησης με ήχο
          </button>
          <button
            type="button"
            onClick={() => void disablePush()}
            className="rounded-2xl border border-slate-500 px-5 py-3 font-black text-white"
          >
            Απενεργοποίηση στο κινητό
          </button>
        </div>
      ) : pushState === "unsupported" || pushState === "checking" ? null : (
        <button
          type="button"
          onClick={() => void enablePush()}
          disabled={pushState === "busy"}
          className="mt-4 w-full rounded-2xl bg-sky-300 px-5 py-3 font-black text-[#06111f] disabled:opacity-60"
        >
          {pushState === "busy" ? "Ενεργοποίηση..." : "Ενεργοποίηση ειδοποιήσεων στο κινητό"}
        </button>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Για να ακούγεται: το κινητό δεν πρέπει να είναι σε αθόρυβη λειτουργία και ο ήχος
        ειδοποιήσεων για Chrome ή Samsung Internet / pantavion.com πρέπει να είναι ενεργός.
      </p>
    </section>
  );
}
