"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    MapPin,
    Plane,
    Calendar,
    Users,
    Moon,
    Pencil,
    Trash2,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { TripForm } from "@/components/trips/trip-form";
import { toast } from "sonner";
import type { TripWithRelations } from "@/types";

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [trip, setTrip] = useState<TripWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetch(`/api/trips/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error("Not found");
                return r.json();
            })
            .then(setTrip)
            .catch(() => router.push("/dashboard/trips"))
            .finally(() => setLoading(false));
    }, [id, router]);

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Trip deleted");
                router.push("/dashboard/trips");
            } else {
                toast.error("Failed to delete trip");
            }
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!trip) return null;

    if (editing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Trip</h1>
                </div>
                <TripForm trip={trip} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/trips")}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Trips
                </Button>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{trip.title}</h1>
                    {trip.description && (
                        <p className="text-muted-foreground mt-1">{trip.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete trip?</DialogTitle>
                                <DialogDescription>
                                    This will permanently delete &quot;{trip.title}&quot; and all
                                    its stops and flights. This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {trip.startDate && (
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(trip.startDate), "MMM d, yyyy")}
                        {trip.endDate && ` - ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
                    </span>
                )}
                {trip.companions.length > 0 && (
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {trip.companions.join(", ")}
                    </span>
                )}
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Stops ({trip.stops.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {trip.stops.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No stops recorded.</p>
                    ) : (
                        <div className="space-y-3">
                            {trip.stops.map((stop, i) => (
                                <div
                                    key={stop.id}
                                    className="flex items-start gap-3 rounded-lg border p-3"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{stop.location.name}</p>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                            {stop.arrivalDate && (
                                                <span>
                                                    Arr:{" "}
                                                    {format(
                                                        new Date(stop.arrivalDate),
                                                        "MMM d, yyyy",
                                                    )}
                                                </span>
                                            )}
                                            {stop.departureDate && (
                                                <span>
                                                    Dep:{" "}
                                                    {format(
                                                        new Date(stop.departureDate),
                                                        "MMM d, yyyy",
                                                    )}
                                                </span>
                                            )}
                                            {stop.hasOvernightStay && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] gap-1"
                                                >
                                                    <Moon className="h-3 w-3" />
                                                    Overnight
                                                </Badge>
                                            )}
                                        </div>
                                        {stop.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {stop.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {trip.transport.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plane className="h-5 w-5" />
                            Flights ({trip.transport.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trip.transport.map((seg) => (
                                <div
                                    key={seg.id}
                                    className="flex items-center gap-3 rounded-lg border p-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-medium">
                                                {seg.departureAirport?.iataCode || "???"}
                                            </span>
                                            <span className="text-muted-foreground">&rarr;</span>
                                            <span className="font-mono text-sm font-medium">
                                                {seg.arrivalAirport?.iataCode || "???"}
                                            </span>
                                            {seg.flightNumber && (
                                                <Badge variant="outline" className="text-xs">
                                                    {seg.flightNumber}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                            {seg.airline && <span>{seg.airline}</span>}
                                            {seg.departureDate && (
                                                <span>
                                                    {format(
                                                        new Date(seg.departureDate),
                                                        "MMM d, yyyy",
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
