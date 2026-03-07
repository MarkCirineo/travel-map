"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/analytics/stat-card";
import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Globe,
    MapPin,
    Building2,
    Plane as PlaneIcon,
    Calendar,
    Moon,
    ArrowRight,
    Plus,
    Loader2,
} from "lucide-react";
import type { AnalyticsData, TripWithRelations } from "@/types";

export default function DashboardPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [trips, setTrips] = useState<TripWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/analytics").then((r) => r.json()),
            fetch("/api/trips").then((r) => r.json()),
        ])
            .then(([a, t]) => {
                setAnalytics(a);
                setTrips(t);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const stats = analytics?.overview;
    const recentTrips = trips.slice(0, 4);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Your travel overview at a glance</p>
                </div>
                <Link href="/dashboard/trips/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Trip
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Countries Visited"
                    value={stats?.countriesVisited ?? 0}
                    icon={Globe}
                    description={
                        analytics ? `${analytics.geo.worldPercentage}% of the world` : undefined
                    }
                />
                <StatCard label="States Visited" value={stats?.statesVisited ?? 0} icon={MapPin} />
                <StatCard
                    label="Cities Visited"
                    value={stats?.citiesVisited ?? 0}
                    icon={Building2}
                />
                <StatCard label="Total Trips" value={stats?.totalTrips ?? 0} icon={PlaneIcon} />
                <StatCard label="Travel Days" value={stats?.totalTravelDays ?? 0} icon={Calendar} />
                <StatCard
                    label="Overnight Stays"
                    value={stats?.totalOvernightStays ?? 0}
                    icon={Moon}
                />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Trips</CardTitle>
                    <Link href="/dashboard/trips">
                        <Button variant="ghost" size="sm">
                            View all
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentTrips.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-3">
                                No trips yet. Start logging your travels!
                            </p>
                            <Link href="/dashboard/trips/new">
                                <Button variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create your first trip
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {recentTrips.map((trip) => (
                                <TripCard key={trip.id} trip={trip} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
