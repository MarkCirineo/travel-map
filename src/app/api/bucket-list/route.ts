import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.bucketListItem.findMany({
    where: { userId: session.user.id },
    include: {
      location: {
        include: {
          country: { select: { name: true } },
        },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { locationId, notes, priority } = body;

  if (!locationId) {
    return NextResponse.json(
      { error: "locationId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.bucketListItem.findFirst({
    where: { userId: session.user.id, locationId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Location already in bucket list" },
      { status: 409 }
    );
  }

  const item = await prisma.bucketListItem.create({
    data: {
      userId: session.user.id,
      locationId,
      notes: notes || null,
      priority: priority ?? null,
    },
    include: {
      location: {
        include: {
          country: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id query param is required" },
      { status: 400 }
    );
  }

  const item = await prisma.bucketListItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.bucketListItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
