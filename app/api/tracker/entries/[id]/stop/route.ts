import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const entry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry || entry.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const now = new Date();
  const endAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const start = new Date(entry.startAt + ":00").getTime();
  const duration = Math.max(Math.floor((now.getTime() - start) / 1000), 0);

  const updated = await prisma.timeEntry.update({
    where: { id: params.id },
    data: { endAt, duration },
  });

  return NextResponse.json({ entry: { ...updated, tags: JSON.parse(updated.tags) } });
}
