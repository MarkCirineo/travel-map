import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTripOrFail(id: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: {
      stops: {
        include: { location: true },
        orderBy: { orderIndex: "asc" },
      },
      transport: {
        include: { departureAirport: true, arrivalAirport: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  return trip;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const trip = await getTripOrFail(id, session.user.id);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json(trip);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, startDate, endDate, companions } = body;

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      description: description !== undefined ? description : existing.description,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
      companions: companions ?? existing.companions,
    },
    include: {
      stops: {
        include: { location: true },
        orderBy: { orderIndex: "asc" },
      },
      transport: {
        include: { departureAirport: true, arrivalAirport: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return NextResponse.json(trip);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
