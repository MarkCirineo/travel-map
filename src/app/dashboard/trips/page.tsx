"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripCard } from "@/components/trips/trip-card";
import { Plus, Search, Loader2 } from "lucide-react";
import type { TripWithRelations } from "@/types";

export default function TripsPage() {
    const [trips, setTrips] = useState<TripWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/trips")
            .then((r) => r.json())
            .then(setTrips)
            .finally(() => setLoading(false));
    }, []);

    const filtered = trips.filter(
        (t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.stops.some((s) => s.location.name.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Trips</h1>
                    <p className="text-muted-foreground">Manage your travel history</p>
                </div>
                <Link href="/dashboard/trips/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Trip
                    </Button>
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search trips..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {trips.length === 0
                            ? "No trips yet. Create your first trip!"
                            : "No trips match your search."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                    ))}
                </div>
            )}
        </div>
    );
}
