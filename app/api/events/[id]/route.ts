import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      title: body.title ?? event.title,
      startAt: body.startAt ?? event.startAt,
      endAt: body.endAt ?? event.endAt,
      allDay: body.allDay ?? event.allDay,
      category: body.category ?? event.category,
      color: body.color ?? event.color,
    },
  });

  return NextResponse.json({ event: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
