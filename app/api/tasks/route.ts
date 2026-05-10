import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { title, priority, status, dueDate } = await req.json();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const count = await prisma.task.count({ where: { userId, dueDate: dueDate ?? null } });
  const task = await prisma.task.create({
    data: {
      userId,
      title,
      priority: priority ?? "medium",
      status: status ?? "todo",
      dueDate: dueDate ?? null,
      order: count,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
