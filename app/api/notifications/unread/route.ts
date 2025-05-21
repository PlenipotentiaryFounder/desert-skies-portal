import { NextRequest, NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/notification-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const count = await getUnreadNotificationCount(userId);
  return NextResponse.json({ count });
} 