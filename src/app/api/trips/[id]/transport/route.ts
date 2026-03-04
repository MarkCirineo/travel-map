import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyTripOwnership(tripId: string, userId: string) {
  return prisma.trip.findFirst({ where: { id: tripId, userId } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;
  const trip = await verifyTripOwnership(tripId, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    type,
    departureAirportId,
    arrivalAirportId,
    departureDate,
    arrivalDate,
    airline,
    flightNumber,
    notes,
  } = body;

  const maxOrder = await prisma.transportationSegment.aggregate({
    where: { tripId },
    _max: { orderIndex: true },
  });

  const segment = await prisma.transportationSegment.create({
    data: {
      tripId,
      type: type || "FLIGHT",
      departureAirportId: departureAirportId || null,
      arrivalAirportId: arrivalAirportId || null,
      departureDate: departureDate ? new Date(departureDate) : null,
      arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
      airline: airline || null,
      flightNumber: flightNumber || null,
      notes: notes || null,
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
    },
    include: {
      departureAirport: true,
      arrivalAirport: true,
    },
  });

  return NextResponse.json(segment, { status: 201 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;
  const trip = await verifyTripOwnership(tripId, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const body = await request.json();
  const { segmentId, ...data } = body;

  if (!segmentId) {
    return NextResponse.json(
      { error: "segmentId is required" },
      { status: 400 }
    );
  }

  const segment = await prisma.transportationSegment.update({
    where: { id: segmentId },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.departureAirportId !== undefined && {
        departureAirportId: data.departureAirportId || null,
      }),
      ...(data.arrivalAirportId !== undefined && {
        arrivalAirportId: data.arrivalAirportId || null,
      }),
      ...(data.departureDate !== undefined && {
        departureDate: data.departureDate
          ? new Date(data.departureDate)
          : null,
      }),
      ...(data.arrivalDate !== undefined && {
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      }),
      ...(data.airline !== undefined && { airline: data.airline || null }),
      ...(data.flightNumber !== undefined && {
        flightNumber: data.flightNumber || null,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
    },
    include: {
      departureAirport: true,
      arrivalAirport: true,
    },
  });

  return NextResponse.json(segment);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;
  const trip = await verifyTripOwnership(tripId, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const segmentId = searchParams.get("segmentId");

  if (!segmentId) {
    return NextResponse.json(
      { error: "segmentId query param is required" },
      { status: 400 }
    );
  }

  await prisma.transportationSegment.delete({ where: { id: segmentId } });
  return NextResponse.json({ success: true });
}
