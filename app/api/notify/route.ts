import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

// Server-side half of the Pusher notification flow (matches the
// pattern from pusher.com/tutorials/realtime-notifications): the
// browser never talks to Pusher's HTTP API directly (that would leak
// the app secret), so client actions call this route instead, and this
// route uses the private "pusher" package with PUSHER_APP_ID/SECRET to
// trigger an event that every subscribed browser receives instantly
// through pusher-js.
export async function POST(request: NextRequest) {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    // Pusher isn't configured — don't fail the caller's action (placing
    // an order should still work even without live notifications), just
    // report that no notification was sent.
    return NextResponse.json({ sent: false, reason: "Pusher is not configured" });
  }

  const { title, body } = await request.json();

  if (!title) {
    return NextResponse.json({ sent: false, reason: "Missing title" }, { status: 400 });
  }

  const pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });

  await pusher.trigger("marketloop", "notification", {
    title,
    body: body ?? "",
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({ sent: true });
}
