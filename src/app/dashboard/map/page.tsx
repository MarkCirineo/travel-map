"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapTooltip } from "@/components/map/map-tooltip";
import { Loader2 } from "lucide-react";

const TravelMap = dynamic(
  () => import("@/components/map/travel-map").then((m) => m.TravelMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface VisitedData {
  countries: Record<string, { count: number; name: string }>;
  states: Record<string, { count: number; name: string }>;
  cities: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    count: number;
  }[];
  airports: {
    id: string;
    name: string;
    iata: string;
    lat: number;
    lng: number;
    count: number;
  }[];
}

export default function MapPage() {
  const [visitedData, setVisitedData] = useState<VisitedData>({
    countries: {},
    states: {},
    cities: [],
    airports: [],
  });
  const [selectedInfo, setSelectedInfo] = useState<{
    name: string;
    count: number;
    type: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tripsRes, analyticsRes] = await Promise.all([
          fetch("/api/trips"),
          fetch("/api/analytics"),
        ]);
        const trips = await tripsRes.json();
        const analytics = await analyticsRes.json();

        const countries: Record<string, { count: number; name: string }> = {};
        const states: Record<string, { count: number; name: string }> = {};
        const cityMap = new Map<
          string,
          { name: string; lat: number; lng: number; count: number }
        >();
        const airportMap = new Map<
          string,
          { name: string; iata: string; lat: number; lng: number; count: number }
        >();

        for (const trip of trips) {
          for (const stop of trip.stops || []) {
            const loc = stop.location;
            if (loc.type === "COUNTRY") {
              const key = loc.iso2 || loc.id;
              countries[key] = countries[key] || { count: 0, name: loc.name };
              countries[key].count++;
            } else if (loc.type === "STATE") {
              states[loc.name] = states[loc.name] || {
                count: 0,
                name: loc.name,
              };
              states[loc.name].count++;
            } else if (loc.type === "CITY") {
              const existing = cityMap.get(loc.id);
              if (existing) {
                existing.count++;
              } else {
                cityMap.set(loc.id, {
                  name: loc.name,
                  lat: loc.latitude,
                  lng: loc.longitude,
                  count: 1,
                });
              }
            }
          }

          for (const seg of trip.transport || []) {
            if (seg.departureAirport) {
              const a = seg.departureAirport;
              const existing = airportMap.get(a.id);
              if (existing) {
                existing.count++;
              } else {
                airportMap.set(a.id, {
                  name: a.name,
                  iata: a.iataCode,
                  lat: a.latitude,
                  lng: a.longitude,
                  count: 1,
                });
              }
            }
            if (seg.arrivalAirport) {
              const a = seg.arrivalAirport;
              const existing = airportMap.get(a.id);
              if (existing) {
                existing.count++;
              } else {
                airportMap.set(a.id, {
                  name: a.name,
                  iata: a.iataCode,
                  lat: a.latitude,
                  lng: a.longitude,
                  count: 1,
                });
              }
            }
          }
        }

        // Also mark countries from analytics (from city-level stops)
        if (analytics?.geo?.daysPerCountry) {
          for (const c of analytics.geo.daysPerCountry) {
            if (!Object.values(countries).some((v) => v.name === c.name)) {
              const isoEntry = Object.entries(countries).find(
                ([, v]) => v.name === c.name
              );
              if (!isoEntry) {
                countries[c.name] = { count: 1, name: c.name };
              }
            }
          }
        }

        setVisitedData({
          countries,
          states,
          cities: [...cityMap.entries()].map(([id, v]) => ({ id, ...v })),
          airports: [...airportMap.entries()].map(([id, v]) => ({ id, ...v })),
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] -m-4 lg:-m-6">
      <TravelMap
        visitedData={visitedData}
        onFeatureClick={setSelectedInfo}
      />
      <MapTooltip
        info={selectedInfo}
        onClose={() => setSelectedInfo(null)}
      />
    </div>
  );
}
