import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const habit = await prisma.habit.findUnique({ where: { id: params.id } });
  if (!habit || habit.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "Date requise" }, { status: 400 });

  const existing = await prisma.habitCompletion.findUnique({
    where: { habitId_date: { habitId: params.id, date } },
  });

  if (existing) {
    await prisma.habitCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  } else {
    await prisma.habitCompletion.create({ data: { habitId: params.id, date } });
    return NextResponse.json({ completed: true });
  }
}
