// Fire-and-forget helper used by client components to announce
// something notification-worthy. It does TWO things:
//
//   1. Shows the notification in THIS tab immediately, through the
//      sink that NotificationProvider registers. The tab that performed
//      the action never has to wait on (or depend on) Pusher just to see
//      feedback for its own action.
//   2. POSTs to /api/notify -> Pusher -> every OTHER open tab/device,
//      on the shared "marketloop" channel, across all three portals
//      (shop, seller hub, admin).
//
// Never throws: a notification failing to send should never block the
// underlying action (login, checkout, publishing a product, ...).

type LocalSink = (title: string, body?: string) => void;

let localSink: LocalSink | null = null;

export function registerLocalNotifier(sink: LocalSink | null) {
  localSink = sink;
}

export async function pushNotification(title: string, body?: string) {
  try {
    localSink?.(title, body);
  } catch {
    // Ignore — never let a UI notification break the caller.
  }

  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body })
    });
  } catch {
    // Silently ignore — notifications are a nice-to-have, not critical.
  }
}
