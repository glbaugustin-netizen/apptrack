import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const events = await prisma.calendarEvent.findMany({
    where: { userId },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { title, startAt, endAt, allDay, category, color } = await req.json();
  if (!title || !startAt || !endAt)
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });

  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title,
      startAt,
      endAt,
      allDay: allDay ?? false,
      category: category ?? "work",
      color: color ?? "#378ADD",
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
