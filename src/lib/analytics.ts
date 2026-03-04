import { prisma } from "./prisma";
import { LocationType } from "@/generated/prisma/client";
import { haversineDistance } from "./geo-utils";
import { differenceInDays, eachDayOfInterval, format, getYear, getMonth } from "date-fns";
import type {
  OverviewStats,
  FrequencyStats,
  TimeStats,
  GeoStats,
  FlightStats,
} from "@/types";

export async function getOverviewStats(userId: string): Promise<OverviewStats> {
  const stops = await prisma.tripStop.findMany({
    where: { trip: { userId } },
    include: { location: true },
  });

  const countries = new Set<string>();
  const states = new Set<string>();
  const cities = new Set<string>();

  for (const stop of stops) {
    const loc = stop.location;
    switch (loc.type) {
      case LocationType.COUNTRY:
        countries.add(loc.id);
        break;
      case LocationType.STATE:
        states.add(loc.id);
        if (loc.countryId) countries.add(loc.countryId);
        break;
      case LocationType.CITY:
        cities.add(loc.id);
        if (loc.stateId) states.add(loc.stateId);
        if (loc.countryId) countries.add(loc.countryId);
        break;
    }
  }

  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { startDate: true, endDate: true },
  });

  let totalTravelDays = 0;
  for (const trip of trips) {
    if (trip.startDate && trip.endDate) {
      totalTravelDays += differenceInDays(trip.endDate, trip.startDate) + 1;
    }
  }

  const totalOvernightStays = stops.filter((s) => s.hasOvernightStay).length;

  return {
    countriesVisited: countries.size,
    statesVisited: states.size,
    citiesVisited: cities.size,
    totalTrips: trips.length,
    totalTravelDays,
    totalOvernightStays,
  };
}

export async function getFrequencyStats(
  userId: string
): Promise<FrequencyStats> {
  const stops = await prisma.tripStop.findMany({
    where: { trip: { userId } },
    include: { location: true },
  });

  const locationCounts = new Map<
    string,
    { name: string; type: string; count: number }
  >();
  for (const stop of stops) {
    const key = stop.locationId;
    const entry = locationCounts.get(key) || {
      name: stop.location.name,
      type: stop.location.type,
      count: 0,
    };
    entry.count++;
    locationCounts.set(key, entry);
  }

  const byType = (type: string) =>
    [...locationCounts.values()]
      .filter((e) => e.type === type)
      .sort((a, b) => b.count - a.count)[0] || null;

  const mostVisitedCity = byType(LocationType.CITY);
  const mostVisitedState = byType(LocationType.STATE);
  const mostVisitedCountry = byType(LocationType.COUNTRY);

  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { title: true, startDate: true, endDate: true },
  });

  const tripLengths = trips
    .filter((t) => t.startDate && t.endDate)
    .map((t) => ({
      title: t.title,
      days: differenceInDays(t.endDate!, t.startDate!) + 1,
    }));

  const averageTripLength =
    tripLengths.length > 0
      ? Math.round(
          tripLengths.reduce((sum, t) => sum + t.days, 0) / tripLengths.length
        )
      : 0;

  const sorted = [...tripLengths].sort((a, b) => b.days - a.days);
  const longestTrip = sorted[0] || null;
  const shortestTrip = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const yearCounts = new Map<number, number>();
  const monthCounts = new Map<number, number>();
  for (const trip of trips) {
    if (trip.startDate) {
      const year = getYear(trip.startDate);
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      const month = getMonth(trip.startDate) + 1;
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }
  }

  const tripsPerYear = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const mostActiveYear =
    tripsPerYear.length > 0
      ? [...tripsPerYear].sort((a, b) => b.count - a.count)[0]
      : null;

  const mostActiveMonth =
    monthCounts.size > 0
      ? [...monthCounts.entries()]
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => b.count - a.count)[0]
      : null;

  return {
    mostVisitedCity: mostVisitedCity
      ? { name: mostVisitedCity.name, count: mostVisitedCity.count }
      : null,
    mostVisitedState: mostVisitedState
      ? { name: mostVisitedState.name, count: mostVisitedState.count }
      : null,
    mostVisitedCountry: mostVisitedCountry
      ? { name: mostVisitedCountry.name, count: mostVisitedCountry.count }
      : null,
    averageTripLength,
    longestTrip,
    shortestTrip,
    tripsPerYear,
    mostActiveYear,
    mostActiveMonth,
  };
}

export async function getTimeStats(userId: string): Promise<TimeStats> {
  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });

  const travelDaysSet = new Set<string>();
  const yearDays = new Map<number, Set<string>>();

  for (const trip of trips) {
    if (trip.startDate && trip.endDate) {
      const days = eachDayOfInterval({
        start: trip.startDate,
        end: trip.endDate,
      });
      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        travelDaysSet.add(dateStr);
        const year = getYear(day);
        if (!yearDays.has(year)) yearDays.set(year, new Set());
        yearDays.get(year)!.add(dateStr);
      }
    }
  }

  const travelDaysPerYear = [...yearDays.entries()]
    .map(([year, days]) => ({ year, days: days.size }))
    .sort((a, b) => a.year - b.year);

  const dateCounts = new Map<string, number>();
  for (const trip of trips) {
    if (trip.startDate && trip.endDate) {
      const days = eachDayOfInterval({
        start: trip.startDate,
        end: trip.endDate,
      });
      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
      }
    }
  }

  const heatmapData = [...dateCounts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sortedDates = [...travelDaysSet].sort();
  let longestStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = differenceInDays(curr, prev);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  if (sortedDates.length === 0) longestStreak = 0;

  const datedTrips = trips
    .filter((t) => t.startDate && t.endDate)
    .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime());

  let longestGap = 0;
  for (let i = 1; i < datedTrips.length; i++) {
    const gap = differenceInDays(
      datedTrips[i].startDate!,
      datedTrips[i - 1].endDate!
    );
    longestGap = Math.max(longestGap, gap);
  }

  return { travelDaysPerYear, heatmapData, longestStreak, longestGap };
}

export async function getGeoStats(userId: string): Promise<GeoStats> {
  const stops = await prisma.tripStop.findMany({
    where: { trip: { userId } },
    include: {
      location: true,
      trip: { select: { id: true } },
    },
  });

  const visitedCountryIds = new Set<string>();
  for (const stop of stops) {
    if (stop.location.type === LocationType.COUNTRY) {
      visitedCountryIds.add(stop.location.id);
    } else if (stop.location.countryId) {
      visitedCountryIds.add(stop.location.countryId);
    }
  }

  const totalCountries = await prisma.location.count({
    where: { type: LocationType.COUNTRY },
  });
  const worldPercentage =
    totalCountries > 0
      ? Math.round((visitedCountryIds.size / totalCountries) * 1000) / 10
      : 0;

  const tripCountries = new Map<string, Set<string>>();
  for (const stop of stops) {
    const countryId =
      stop.location.type === LocationType.COUNTRY
        ? stop.location.id
        : stop.location.countryId;
    if (!countryId) continue;
    if (!tripCountries.has(stop.tripId))
      tripCountries.set(stop.tripId, new Set());
    tripCountries.get(stop.tripId)!.add(countryId);
  }

  let domesticTrips = 0;
  let internationalTrips = 0;
  for (const countries of tripCountries.values()) {
    if (countries.size <= 1) domesticTrips++;
    else internationalTrips++;
  }

  const countryDays = new Map<string, number>();
  const tripsWithDates = await prisma.trip.findMany({
    where: { userId, startDate: { not: null }, endDate: { not: null } },
    include: {
      stops: { include: { location: true } },
    },
  });

  for (const trip of tripsWithDates) {
    if (!trip.startDate || !trip.endDate) continue;
    const totalDays = differenceInDays(trip.endDate, trip.startDate) + 1;
    const tripCountryIds = new Set<string>();
    for (const stop of trip.stops) {
      const cId =
        stop.location.type === LocationType.COUNTRY
          ? stop.location.id
          : stop.location.countryId;
      if (cId) tripCountryIds.add(cId);
    }
    const perCountry =
      tripCountryIds.size > 0
        ? Math.round(totalDays / tripCountryIds.size)
        : 0;
    for (const cId of tripCountryIds) {
      countryDays.set(cId, (countryDays.get(cId) || 0) + perCountry);
    }
  }

  const countryNames = await prisma.location.findMany({
    where: { id: { in: [...countryDays.keys()] } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(countryNames.map((c) => [c.id, c.name]));

  const daysPerCountry = [...countryDays.entries()]
    .map(([id, days]) => ({ name: nameMap.get(id) || "Unknown", days }))
    .sort((a, b) => b.days - a.days);

  return { worldPercentage, domesticTrips, internationalTrips, daysPerCountry };
}

export async function getFlightStats(userId: string): Promise<FlightStats> {
  const segments = await prisma.transportationSegment.findMany({
    where: { trip: { userId }, type: "FLIGHT" },
    include: { departureAirport: true, arrivalAirport: true },
  });

  const totalSegments = segments.length;
  const totalFlights = segments.length;

  const airportIds = new Set<string>();
  const departureCounts = new Map<
    string,
    { name: string; iata: string; count: number }
  >();
  const arrivalCounts = new Map<
    string,
    { name: string; iata: string; count: number }
  >();
  const routeCounts = new Map<string, { from: string; to: string; count: number }>();
  const airlines = new Map<string, number>();
  let totalDistance = 0;
  let longestFlight: { from: string; to: string; distance: number } | null =
    null;

  for (const seg of segments) {
    if (seg.departureAirport) {
      airportIds.add(seg.departureAirportId!);
      const key = seg.departureAirportId!;
      const entry = departureCounts.get(key) || {
        name: seg.departureAirport.name,
        iata: seg.departureAirport.iataCode,
        count: 0,
      };
      entry.count++;
      departureCounts.set(key, entry);
    }
    if (seg.arrivalAirport) {
      airportIds.add(seg.arrivalAirportId!);
      const key = seg.arrivalAirportId!;
      const entry = arrivalCounts.get(key) || {
        name: seg.arrivalAirport.name,
        iata: seg.arrivalAirport.iataCode,
        count: 0,
      };
      entry.count++;
      arrivalCounts.set(key, entry);
    }
    if (seg.departureAirport && seg.arrivalAirport) {
      const dist = haversineDistance(
        seg.departureAirport.latitude,
        seg.departureAirport.longitude,
        seg.arrivalAirport.latitude,
        seg.arrivalAirport.longitude
      );
      totalDistance += dist;
      const fromLabel = seg.departureAirport.iataCode;
      const toLabel = seg.arrivalAirport.iataCode;

      if (!longestFlight || dist > longestFlight.distance) {
        longestFlight = { from: fromLabel, to: toLabel, distance: Math.round(dist) };
      }

      const routeKey = `${fromLabel}-${toLabel}`;
      const route = routeCounts.get(routeKey) || {
        from: fromLabel,
        to: toLabel,
        count: 0,
      };
      route.count++;
      routeCounts.set(routeKey, route);
    }
    if (seg.airline) {
      airlines.set(seg.airline, (airlines.get(seg.airline) || 0) + 1);
    }
  }

  const mostUsedDepartureAirport =
    [...departureCounts.values()].sort((a, b) => b.count - a.count)[0] || null;
  const mostUsedArrivalAirport =
    [...arrivalCounts.values()].sort((a, b) => b.count - a.count)[0] || null;
  const mostCommonRoute =
    [...routeCounts.values()].sort((a, b) => b.count - a.count)[0] || null;

  const airlineBreakdown = [...airlines.entries()]
    .map(([airline, count]) => ({ airline, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalFlights,
    totalSegments,
    airportsVisited: airportIds.size,
    mostUsedDepartureAirport,
    mostUsedArrivalAirport,
    mostCommonRoute,
    totalDistance: Math.round(totalDistance),
    longestFlight,
    airlineBreakdown,
  };
}

export async function getAllAnalytics(userId: string) {
  const [overview, frequency, time, geo, flights] = await Promise.all([
    getOverviewStats(userId),
    getFrequencyStats(userId),
    getTimeStats(userId),
    getGeoStats(userId),
    getFlightStats(userId),
  ]);

  return { overview, frequency, time, geo, flights };
}
