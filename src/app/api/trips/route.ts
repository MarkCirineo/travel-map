import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
        where: { userId: session.user.id },
        include: {
            stops: {
                include: { location: true },
                orderBy: { orderIndex: "asc" },
            },
            transport: {
                include: {
                    departureAirport: true,
                    arrivalAirport: true,
                },
                orderBy: { orderIndex: "asc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips);
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, companions, stops, transport } = body;

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const trip = await prisma.trip.create({
        data: {
            userId: session.user.id,
            title,
            description: description || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            companions: companions || [],
            stops: stops?.length
                ? {
                      create: stops.map((stop: Record<string, unknown>, i: number) => ({
                          locationId: stop.locationId as string,
                          arrivalDate: stop.arrivalDate
                              ? new Date(stop.arrivalDate as string)
                              : null,
                          departureDate: stop.departureDate
                              ? new Date(stop.departureDate as string)
                              : null,
                          hasOvernightStay: (stop.hasOvernightStay as boolean) || false,
                          notes: (stop.notes as string) || null,
                          orderIndex: i,
                      })),
                  }
                : undefined,
            transport: transport?.length
                ? {
                      create: transport.map((seg: Record<string, unknown>, i: number) => ({
                          type: (seg.type as string) || "FLIGHT",
                          departureAirportId: (seg.departureAirportId as string) || null,
                          arrivalAirportId: (seg.arrivalAirportId as string) || null,
                          departureDate: seg.departureDate
                              ? new Date(seg.departureDate as string)
                              : null,
                          arrivalDate: seg.arrivalDate ? new Date(seg.arrivalDate as string) : null,
                          airline: (seg.airline as string) || null,
                          flightNumber: (seg.flightNumber as string) || null,
                          notes: (seg.notes as string) || null,
                          orderIndex: i,
                      })),
                  }
                : undefined,
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

    return NextResponse.json(trip, { status: 201 });
}
