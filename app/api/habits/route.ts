import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [habits, completions] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    prisma.habitCompletion.findMany({
      where: { habit: { userId } },
      orderBy: { date: "desc" },
    }),
  ]);

  return NextResponse.json({
    habits: habits.map((h) => ({ ...h, targetDays: JSON.parse(h.targetDays) })),
    completions: completions.map((c) => ({ habitId: c.habitId, date: c.date })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { name, icon, color, frequency, targetDays } = await req.json();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const count = await prisma.habit.count({ where: { userId } });
  const habit = await prisma.habit.create({
    data: {
      userId,
      name,
      icon: icon ?? "ti-star",
      color: color ?? "#7F77DD",
      frequency: frequency ?? "daily",
      targetDays: JSON.stringify(targetDays ?? []),
      order: count,
    },
  });

  return NextResponse.json(
    { habit: { ...habit, targetDays: JSON.parse(habit.targetDays) } },
    { status: 201 }
  );
}
