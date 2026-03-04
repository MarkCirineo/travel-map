import type {
  Trip,
  TripStop,
  TransportationSegment,
  Location,
  Airport,
  BucketListItem,
} from "@/generated/prisma/client";
import { LocationType, TransportType } from "@/generated/prisma/client";

export type {
  Trip,
  TripStop,
  TransportationSegment,
  Location,
  Airport,
  BucketListItem,
};
export { LocationType, TransportType };

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export type TripWithRelations = Trip & {
  stops: (TripStop & { location: Location })[];
  transport: (TransportationSegment & {
    departureAirport: Airport | null;
    arrivalAirport: Airport | null;
  })[];
};

export interface OverviewStats {
  countriesVisited: number;
  statesVisited: number;
  citiesVisited: number;
  totalTrips: number;
  totalTravelDays: number;
  totalOvernightStays: number;
}

export interface FrequencyStats {
  mostVisitedCity: { name: string; count: number } | null;
  mostVisitedState: { name: string; count: number } | null;
  mostVisitedCountry: { name: string; count: number } | null;
  averageTripLength: number;
  longestTrip: { title: string; days: number } | null;
  shortestTrip: { title: string; days: number } | null;
  tripsPerYear: { year: number; count: number }[];
  mostActiveYear: { year: number; count: number } | null;
  mostActiveMonth: { month: number; count: number } | null;
}

export interface TimeStats {
  travelDaysPerYear: { year: number; days: number }[];
  heatmapData: { date: string; count: number }[];
  longestStreak: number;
  longestGap: number;
}

export interface GeoStats {
  worldPercentage: number;
  domesticTrips: number;
  internationalTrips: number;
  daysPerCountry: { name: string; days: number }[];
}

export interface FlightStats {
  totalFlights: number;
  totalSegments: number;
  airportsVisited: number;
  mostUsedDepartureAirport: {
    name: string;
    iata: string;
    count: number;
  } | null;
  mostUsedArrivalAirport: {
    name: string;
    iata: string;
    count: number;
  } | null;
  mostCommonRoute: { from: string; to: string; count: number } | null;
  totalDistance: number;
  longestFlight: { from: string; to: string; distance: number } | null;
  airlineBreakdown: { airline: string; count: number }[];
}

export interface AnalyticsData {
  overview: OverviewStats;
  frequency: FrequencyStats;
  time: TimeStats;
  geo: GeoStats;
  flights: FlightStats;
}
