import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type");

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const locations = await prisma.location.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      ...(type && { type: type as "COUNTRY" | "STATE" | "CITY" }),
    },
    include: {
      country: { select: { id: true, name: true } },
      state: { select: { id: true, name: true } },
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(locations);
}
