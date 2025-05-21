import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  const { notificationId } = await req.json();
  if (!notificationId) return NextResponse.json({ error: "Missing notificationId" }, { status: 400 });
  const success = await markNotificationAsRead(notificationId);
  return NextResponse.json({ success });
} 