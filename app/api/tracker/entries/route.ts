import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    orderBy: { startAt: "desc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({ ...e, tags: JSON.parse(e.tags) })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { description, projectId, tags, startAt } = await req.json();

  // Stop any running entry first
  const running = await prisma.timeEntry.findFirst({
    where: { userId, endAt: null },
  });
  if (running) {
    const now = new Date();
    const endAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const start = new Date(running.startAt + ":00").getTime();
    const end = now.getTime();
    await prisma.timeEntry.update({
      where: { id: running.id },
      data: { endAt, duration: Math.max(Math.floor((end - start) / 1000), 0) },
    });
  }

  const now = new Date();
  const defaultStart = startAt ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      description: description ?? "",
      projectId: projectId ?? null,
      tags: JSON.stringify(tags ?? []),
      startAt: defaultStart,
      endAt: null,
      duration: null,
    },
  });

  return NextResponse.json(
    { entry: { ...entry, tags: JSON.parse(entry.tags) } },
    { status: 201 }
  );
}
