import Pusher from "pusher-js";

// One Pusher client per browser tab. Components subscribe to the
// shared "marketloop" channel and listen for the "notification"
// event, which is triggered server-side from app/api/notify/route.ts
// whenever something notification-worthy happens (an order is placed,
// an account is created, ...).
let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    // No Pusher app configured yet — the app still works, it just
    // won't receive live notifications until .env.local is filled in.
    return null;
  }

  if (!client) {
    client = new Pusher(key, { cluster });
  }

  return client;
}

export const NOTIFICATION_CHANNEL = "marketloop";
export const NOTIFICATION_EVENT = "notification";
