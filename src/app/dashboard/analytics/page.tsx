"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { Heatmap } from "@/components/analytics/heatmap";
import {
    TripsPerYearChart,
    DaysPerCountryChart,
    AirlineBreakdownChart,
    TravelDaysPerYearChart,
} from "@/components/analytics/analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Globe,
    MapPin,
    Building2,
    Plane,
    Calendar,
    Moon,
    TrendingUp,
    BarChart3,
    Loader2,
} from "lucide-react";
import type { AnalyticsData } from "@/types";

const MONTH_NAMES = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics")
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    const { overview, frequency, time, geo, flights } = data;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">Deep dive into your travel statistics</p>
            </div>

            {/* Core Metrics */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Core Metrics</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Countries Visited"
                        value={overview.countriesVisited}
                        icon={Globe}
                        description={`${geo.worldPercentage}% of the world`}
                    />
                    <StatCard label="States Visited" value={overview.statesVisited} icon={MapPin} />
                    <StatCard
                        label="Cities Visited"
                        value={overview.citiesVisited}
                        icon={Building2}
                    />
                    <StatCard label="Total Trips" value={overview.totalTrips} icon={Plane} />
                    <StatCard
                        label="Travel Days"
                        value={overview.totalTravelDays}
                        icon={Calendar}
                    />
                    <StatCard
                        label="Overnight Stays"
                        value={overview.totalOvernightStays}
                        icon={Moon}
                    />
                </div>
            </section>

            <Separator />

            {/* Frequency Metrics */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Frequency</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {frequency.mostVisitedCity && (
                        <StatCard
                            label="Most Visited City"
                            value={frequency.mostVisitedCity.name}
                            icon={Building2}
                            description={`${frequency.mostVisitedCity.count} visits`}
                        />
                    )}
                    {frequency.mostVisitedCountry && (
                        <StatCard
                            label="Most Visited Country"
                            value={frequency.mostVisitedCountry.name}
                            icon={Globe}
                            description={`${frequency.mostVisitedCountry.count} visits`}
                        />
                    )}
                    <StatCard
                        label="Average Trip Length"
                        value={`${frequency.averageTripLength} days`}
                        icon={Calendar}
                    />
                    {frequency.longestTrip && (
                        <StatCard
                            label="Longest Trip"
                            value={`${frequency.longestTrip.days} days`}
                            icon={TrendingUp}
                            description={frequency.longestTrip.title}
                        />
                    )}
                    {frequency.mostActiveYear && (
                        <StatCard
                            label="Most Active Year"
                            value={frequency.mostActiveYear.year}
                            icon={BarChart3}
                            description={`${frequency.mostActiveYear.count} trips`}
                        />
                    )}
                    {frequency.mostActiveMonth && (
                        <StatCard
                            label="Most Active Month"
                            value={MONTH_NAMES[frequency.mostActiveMonth.month]}
                            icon={Calendar}
                            description={`${frequency.mostActiveMonth.count} trips`}
                        />
                    )}
                </div>
            </section>

            <Separator />

            {/* Charts */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Charts</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                    <TripsPerYearChart data={frequency.tripsPerYear} />
                    <TravelDaysPerYearChart data={time.travelDaysPerYear} />
                    <DaysPerCountryChart data={geo.daysPerCountry} />
                    <AirlineBreakdownChart data={flights.airlineBreakdown} />
                </div>
            </section>

            <Separator />

            {/* Heatmap */}
            {time.heatmapData.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Travel Heatmap</h2>
                    <Card>
                        <CardContent className="pt-6 overflow-x-auto">
                            <Heatmap data={time.heatmapData} />
                        </CardContent>
                    </Card>
                </section>
            )}

            <Separator />

            {/* Time Stats */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Time-Based</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Longest Travel Streak"
                        value={`${time.longestStreak} days`}
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Longest Gap Between Trips"
                        value={`${time.longestGap} days`}
                        icon={Calendar}
                    />
                    <StatCard
                        label="Domestic vs International"
                        value={`${geo.domesticTrips} / ${geo.internationalTrips}`}
                        icon={Globe}
                        description="Domestic / International"
                    />
                </div>
            </section>

            <Separator />

            {/* Flight Stats */}
            {flights.totalFlights > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Flight Analytics</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard label="Total Flights" value={flights.totalFlights} icon={Plane} />
                        <StatCard
                            label="Airports Visited"
                            value={flights.airportsVisited}
                            icon={Plane}
                        />
                        <StatCard
                            label="Total Flight Distance"
                            value={`${Math.round(flights.totalDistance).toLocaleString()} km`}
                            icon={Globe}
                        />
                        {flights.mostUsedDepartureAirport && (
                            <StatCard
                                label="Most Used Departure"
                                value={flights.mostUsedDepartureAirport.iata}
                                icon={Plane}
                                description={`${flights.mostUsedDepartureAirport.name} (${flights.mostUsedDepartureAirport.count}x)`}
                            />
                        )}
                        {flights.mostCommonRoute && (
                            <StatCard
                                label="Most Common Route"
                                value={`${flights.mostCommonRoute.from} → ${flights.mostCommonRoute.to}`}
                                icon={Plane}
                                description={`${flights.mostCommonRoute.count} times`}
                            />
                        )}
                        {flights.longestFlight && (
                            <StatCard
                                label="Longest Flight"
                                value={`${flights.longestFlight.from} → ${flights.longestFlight.to}`}
                                icon={Plane}
                                description={`${flights.longestFlight.distance.toLocaleString()} km`}
                            />
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
