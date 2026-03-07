import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Calendar, Users } from "lucide-react";
import type { TripWithRelations } from "@/types";

interface TripCardProps {
    trip: TripWithRelations;
}

export function TripCard({ trip }: TripCardProps) {
    const dateRange = () => {
        if (trip.startDate && trip.endDate) {
            return `${format(new Date(trip.startDate), "MMM d, yyyy")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`;
        }
        if (trip.startDate) {
            return format(new Date(trip.startDate), "MMM d, yyyy");
        }
        return "No dates";
    };

    const uniqueLocations = new Set(trip.stops.map((s) => s.location.name));

    return (
        <Link href={`/dashboard/trips/${trip.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{trip.title}</CardTitle>
                    {trip.description && (
                        <CardDescription className="line-clamp-2">
                            {trip.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateRange()}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {trip.stops.length} stop{trip.stops.length !== 1 ? "s" : ""}
                        </span>
                        {trip.transport.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Plane className="h-3.5 w-3.5" />
                                {trip.transport.length} flight
                                {trip.transport.length !== 1 ? "s" : ""}
                            </span>
                        )}
                        {trip.companions.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {trip.companions.length}
                            </span>
                        )}
                    </div>
                    {uniqueLocations.size > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {[...uniqueLocations].slice(0, 5).map((name) => (
                                <Badge key={name} variant="secondary" className="text-xs">
                                    {name}
                                </Badge>
                            ))}
                            {uniqueLocations.size > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{uniqueLocations.size - 5} more
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
