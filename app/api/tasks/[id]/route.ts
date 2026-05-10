import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: body.title ?? task.title,
      status: body.status ?? task.status,
      priority: body.priority ?? task.priority,
      dueDate: "dueDate" in body ? body.dueDate : task.dueDate,
      order: body.order ?? task.order,
    },
  });

  return NextResponse.json({ task: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.userId !== userId)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
