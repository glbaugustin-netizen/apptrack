import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const habit = await prisma.habit.findUnique({ where: { id: params.id } });
  if (!habit || habit.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.habit.update({
    where: { id: params.id },
    data: {
      name: body.name ?? habit.name,
      icon: body.icon ?? habit.icon,
      color: body.color ?? habit.color,
      frequency: body.frequency ?? habit.frequency,
      targetDays: body.targetDays !== undefined ? JSON.stringify(body.targetDays) : habit.targetDays,
      order: body.order ?? habit.order,
    },
  });

  return NextResponse.json({ habit: { ...updated, targetDays: JSON.parse(updated.targetDays) } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const habit = await prisma.habit.findUnique({ where: { id: params.id } });
  if (!habit || habit.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.habit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
