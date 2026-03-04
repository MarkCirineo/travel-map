import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const airports = await prisma.airport.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { iataCode: { contains: q, mode: "insensitive" } },
        { icaoCode: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      city: { select: { id: true, name: true, country: { select: { name: true } } } },
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(airports);
}
