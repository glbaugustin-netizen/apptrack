import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const entry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry || entry.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.timeEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
