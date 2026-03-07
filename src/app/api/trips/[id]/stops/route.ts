import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyTripOwnership(tripId: string, userId: string) {
    return prisma.trip.findFirst({ where: { id: tripId, userId } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { locationId, arrivalDate, departureDate, hasOvernightStay, notes } = body;

    if (!locationId) {
        return NextResponse.json({ error: "locationId is required" }, { status: 400 });
    }

    const maxOrder = await prisma.tripStop.aggregate({
        where: { tripId },
        _max: { orderIndex: true },
    });

    const stop = await prisma.tripStop.create({
        data: {
            tripId,
            locationId,
            arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
            departureDate: departureDate ? new Date(departureDate) : null,
            hasOvernightStay: hasOvernightStay || false,
            notes: notes || null,
            orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        },
        include: { location: true },
    });

    return NextResponse.json(stop, { status: 201 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { stopId, locationId, arrivalDate, departureDate, hasOvernightStay, notes, orderIndex } =
        body;

    if (!stopId) {
        return NextResponse.json({ error: "stopId is required" }, { status: 400 });
    }

    const stop = await prisma.tripStop.update({
        where: { id: stopId },
        data: {
            ...(locationId && { locationId }),
            ...(arrivalDate !== undefined && {
                arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
            }),
            ...(departureDate !== undefined && {
                departureDate: departureDate ? new Date(departureDate) : null,
            }),
            ...(hasOvernightStay !== undefined && { hasOvernightStay }),
            ...(notes !== undefined && { notes: notes || null }),
            ...(orderIndex !== undefined && { orderIndex }),
        },
        include: { location: true },
    });

    return NextResponse.json(stop);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const stopId = searchParams.get("stopId");

    if (!stopId) {
        return NextResponse.json({ error: "stopId query param is required" }, { status: 400 });
    }

    await prisma.tripStop.delete({ where: { id: stopId } });
    return NextResponse.json({ success: true });
}
