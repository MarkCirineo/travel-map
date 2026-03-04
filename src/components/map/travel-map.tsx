"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Feature } from "geojson";
import type { Layer, PathOptions } from "leaflet";

interface VisitedData {
  countries: Record<string, { count: number; name: string }>;
  states: Record<string, { count: number; name: string }>;
  cities: { id: string; name: string; lat: number; lng: number; count: number }[];
  airports: { id: string; name: string; iata: string; lat: number; lng: number; count: number }[];
}

interface TravelMapProps {
  visitedData: VisitedData;
  onFeatureClick?: (info: { name: string; count: number; type: string }) => void;
}

function FitBoundsOnLoad() {
  const map = useMap();
  useEffect(() => {
    map.setView([20, 0], 2);
  }, [map]);
  return null;
}

export function TravelMap({ visitedData, onFeatureClick }: TravelMapProps) {
  const [countriesGeo, setCountriesGeo] = useState<FeatureCollection | null>(null);
  const [statesGeo, setStatesGeo] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/geo/countries.geojson")
      .then((r) => r.json())
      .then(setCountriesGeo);
    fetch("/geo/us-states.geojson")
      .then((r) => r.json())
      .then(setStatesGeo);
  }, []);

  const countryStyle = useCallback(
    (feature?: Feature): PathOptions => {
      const iso = feature?.properties?.ISO_A2 || feature?.properties?.ISO_A3;
      const isVisited = iso && visitedData.countries[iso];
      return {
        fillColor: isVisited ? "#2563eb" : "#e5e7eb",
        weight: 1,
        opacity: 0.7,
        color: "#9ca3af",
        fillOpacity: isVisited ? 0.5 : 0.1,
      };
    },
    [visitedData.countries]
  );

  const stateStyle = useCallback(
    (feature?: Feature): PathOptions => {
      const name = feature?.properties?.name;
      const isVisited = name && visitedData.states[name];
      return {
        fillColor: isVisited ? "#7c3aed" : "transparent",
        weight: 1,
        opacity: 0.5,
        color: "#9ca3af",
        fillOpacity: isVisited ? 0.4 : 0,
      };
    },
    [visitedData.states]
  );

  const onEachCountry = useCallback(
    (feature: Feature, layer: Layer) => {
      const name =
        feature.properties?.NAME ||
        feature.properties?.ADMIN ||
        "Unknown";
      const iso = feature.properties?.ISO_A2;
      const data = iso && visitedData.countries[iso];
      const count = data ? data.count : 0;

      layer.bindTooltip(`${name}${count ? ` (${count} visit${count > 1 ? "s" : ""})` : ""}`, {
        sticky: true,
      });

      layer.on("click", () => {
        onFeatureClick?.({ name, count, type: "country" });
      });
    },
    [visitedData.countries, onFeatureClick]
  );

  const onEachState = useCallback(
    (feature: Feature, layer: Layer) => {
      const name = feature.properties?.name || "Unknown";
      const data = visitedData.states[name];
      const count = data ? data.count : 0;

      layer.bindTooltip(`${name}${count ? ` (${count} visit${count > 1 ? "s" : ""})` : ""}`, {
        sticky: true,
      });

      layer.on("click", () => {
        onFeatureClick?.({ name, count, type: "state" });
      });
    },
    [visitedData.states, onFeatureClick]
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full"
      minZoom={2}
      maxZoom={18}
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsOnLoad />

      {countriesGeo && (
        <GeoJSON
          key="countries"
          data={countriesGeo}
          style={countryStyle}
          onEachFeature={onEachCountry}
        />
      )}

      {statesGeo && (
        <GeoJSON
          key="states"
          data={statesGeo}
          style={stateStyle}
          onEachFeature={onEachState}
        />
      )}

      {visitedData.cities.map((city) => (
        <CircleMarker
          key={city.id}
          center={[city.lat, city.lng]}
          radius={Math.min(4 + city.count * 2, 12)}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.8,
            weight: 2,
          }}
          eventHandlers={{
            click: () =>
              onFeatureClick?.({
                name: city.name,
                count: city.count,
                type: "city",
              }),
          }}
        >
          <Tooltip>
            {city.name} ({city.count} visit{city.count > 1 ? "s" : ""})
          </Tooltip>
        </CircleMarker>
      ))}

      {visitedData.airports.map((airport) => (
        <CircleMarker
          key={airport.id}
          center={[airport.lat, airport.lng]}
          radius={5}
          pathOptions={{
            color: "#f59e0b",
            fillColor: "#fbbf24",
            fillOpacity: 0.9,
            weight: 2,
          }}
          eventHandlers={{
            click: () =>
              onFeatureClick?.({
                name: `${airport.iata} - ${airport.name}`,
                count: airport.count,
                type: "airport",
              }),
          }}
        >
          <Tooltip>
            {airport.iata} - {airport.name} ({airport.count} flight
            {airport.count > 1 ? "s" : ""})
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
