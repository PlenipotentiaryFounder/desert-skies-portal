import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsAsRead } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const success = await markAllNotificationsAsRead(userId);
  return NextResponse.json({ success });
} 