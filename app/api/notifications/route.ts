import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/notification-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const notifications = await getNotifications(userId, 20);
  return NextResponse.json(notifications);
} 