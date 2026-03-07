"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { TripStopForm, type TripStopData } from "./trip-stop-form";
import { TransportSegmentForm, type TransportSegmentData } from "./transport-segment-form";
import { toast } from "sonner";
import type { TripWithRelations } from "@/types";

interface TripFormProps {
    trip?: TripWithRelations;
}

const emptyStop: TripStopData = {
    locationId: "",
    locationName: "",
    arrivalDate: "",
    departureDate: "",
    hasOvernightStay: false,
    notes: "",
};

const emptySegment: TransportSegmentData = {
    departureAirportId: "",
    departureAirportLabel: "",
    arrivalAirportId: "",
    arrivalAirportLabel: "",
    departureDate: "",
    arrivalDate: "",
    airline: "",
    flightNumber: "",
    notes: "",
};

function toDateInputValue(d: string | Date | null | undefined): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toISOString().split("T")[0];
}

function addDaysStr(dateStr: string, days: number): string {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const result = addDays(date, days);
    const y = result.getFullYear();
    const m = String(result.getMonth() + 1).padStart(2, "0");
    const d = String(result.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function toDate(value: string): Date | undefined {
    if (!value) return undefined;
    return new Date(value + "T00:00:00");
}

export function TripForm({ trip }: TripFormProps) {
    const router = useRouter();
    const isEditing = !!trip;

    const [title, setTitle] = useState(trip?.title || "");
    const [description, setDescription] = useState(trip?.description || "");
    const [startDate, setStartDate] = useState(toDateInputValue(trip?.startDate));
    const [endDate, setEndDate] = useState(toDateInputValue(trip?.endDate));
    const [companionInput, setCompanionInput] = useState("");
    const [companions, setCompanions] = useState<string[]>(trip?.companions || []);
    const [stops, setStops] = useState<TripStopData[]>(
        trip?.stops.map((s) => ({
            locationId: s.locationId,
            locationName: s.location.name,
            arrivalDate: toDateInputValue(s.arrivalDate),
            departureDate: toDateInputValue(s.departureDate),
            hasOvernightStay: s.hasOvernightStay,
            notes: s.notes || "",
        })) || [],
    );
    const [segments, setSegments] = useState<TransportSegmentData[]>(
        trip?.transport.map((t) => ({
            departureAirportId: t.departureAirportId || "",
            departureAirportLabel: t.departureAirport
                ? `${t.departureAirport.iataCode} - ${t.departureAirport.name}`
                : "",
            arrivalAirportId: t.arrivalAirportId || "",
            arrivalAirportLabel: t.arrivalAirport
                ? `${t.arrivalAirport.iataCode} - ${t.arrivalAirport.name}`
                : "",
            departureDate: toDateInputValue(t.departureDate),
            arrivalDate: toDateInputValue(t.arrivalDate),
            airline: t.airline || "",
            flightNumber: t.flightNumber || "",
            notes: t.notes || "",
        })) || [],
    );
    const [saving, setSaving] = useState(false);

    function handleStartDateChange(newStart: string) {
        setStartDate(newStart);
        if (newStart && (!endDate || endDate < newStart)) {
            setEndDate(addDaysStr(newStart, 1));
        }
    }

    function handleEndDateChange(newEnd: string) {
        setEndDate(newEnd);
    }

    function addCompanion() {
        const name = companionInput.trim();
        if (name && !companions.includes(name)) {
            setCompanions([...companions, name]);
            setCompanionInput("");
        }
    }

    function removeCompanion(name: string) {
        setCompanions(companions.filter((c) => c !== name));
    }

    function addStop() {
        const prevStop = stops[stops.length - 1];
        const arrival = prevStop?.departureDate || startDate || "";
        const departure = endDate || (arrival ? addDaysStr(arrival, 1) : "");
        setStops([...stops, { ...emptyStop, arrivalDate: arrival, departureDate: departure }]);
    }

    function updateStop(index: number, data: TripStopData) {
        const prev = stops[index];
        const next = [...stops];

        if (data.arrivalDate !== prev.arrivalDate && data.arrivalDate) {
            const smartDeparture = endDate || addDaysStr(data.arrivalDate, 1);
            if (!data.departureDate || data.departureDate < data.arrivalDate) {
                data = { ...data, departureDate: smartDeparture };
            }
        }

        next[index] = data;
        setStops(next);
    }

    function addFlight() {
        const n = segments.length;
        let depDate = startDate || "";
        let arrDate = startDate || "";

        if (n > 0) {
            depDate = segments[n - 1].departureDate || depDate;
            arrDate = segments[n - 1].arrivalDate || arrDate;
        }

        setSegments([
            ...segments,
            { ...emptySegment, departureDate: depDate, arrivalDate: arrDate },
        ]);
    }

    function updateSegment(index: number, data: TransportSegmentData) {
        const prev = segments[index];
        const next = [...segments];

        if (index > 0) {
            const prevFlight = segments[index - 1];
            const airportsChanged =
                data.departureAirportId !== prev.departureAirportId ||
                data.arrivalAirportId !== prev.arrivalAirportId;

            if (airportsChanged) {
                const isReturn =
                    !!data.departureAirportId &&
                    !!data.arrivalAirportId &&
                    data.departureAirportId === prevFlight.arrivalAirportId &&
                    data.arrivalAirportId === prevFlight.departureAirportId;

                if (isReturn && endDate) {
                    const matchesPrev =
                        data.departureDate === prevFlight.departureDate &&
                        data.arrivalDate === prevFlight.arrivalDate;
                    if (matchesPrev) {
                        data = { ...data, departureDate: endDate, arrivalDate: endDate };
                    }
                } else if (!isReturn) {
                    const matchesEnd =
                        endDate && data.departureDate === endDate && data.arrivalDate === endDate;
                    if (matchesEnd) {
                        data = {
                            ...data,
                            departureDate: prevFlight.departureDate,
                            arrivalDate: prevFlight.arrivalDate,
                        };
                    }
                }
            }
        }

        next[index] = data;
        setSegments(next);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Trip title is required");
            return;
        }

        const validStops = stops.filter((s) => s.locationId);

        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                startDate: startDate || null,
                endDate: endDate || null,
                companions,
                stops: validStops.map((s) => ({
                    locationId: s.locationId,
                    arrivalDate: s.arrivalDate || null,
                    departureDate: s.departureDate || null,
                    hasOvernightStay: s.hasOvernightStay,
                    notes: s.notes || null,
                })),
                transport: segments
                    .filter((s) => s.departureAirportId || s.arrivalAirportId)
                    .map((s) => ({
                        type: "FLIGHT",
                        departureAirportId: s.departureAirportId || null,
                        arrivalAirportId: s.arrivalAirportId || null,
                        departureDate: s.departureDate || null,
                        arrivalDate: s.arrivalDate || null,
                        airline: s.airline || null,
                        flightNumber: s.flightNumber || null,
                        notes: s.notes || null,
                    })),
            };

            const url = isEditing ? `/api/trips/${trip.id}` : "/api/trips";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save trip");
            }

            const saved = await res.json();
            toast.success(isEditing ? "Trip updated" : "Trip created");
            router.push(`/dashboard/trips/${saved.id}`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save trip");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Summer in Europe"
                            required
                        />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Date</Label>
                            <DatePicker
                                value={startDate}
                                onChange={handleStartDateChange}
                                placeholder="Start date"
                            />
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <DatePicker
                                value={endDate}
                                onChange={handleEndDateChange}
                                placeholder="End date"
                                defaultMonth={
                                    startDate ? toDate(addDaysStr(startDate, 1)) : undefined
                                }
                            />
                            {startDate && endDate && endDate < startDate && (
                                <p className="text-xs text-destructive mt-1">
                                    End date is before start date
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label>Companions</Label>
                        <div className="flex gap-2">
                            <Input
                                value={companionInput}
                                onChange={(e) => setCompanionInput(e.target.value)}
                                placeholder="Add a companion..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCompanion();
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={addCompanion}>
                                Add
                            </Button>
                        </div>
                        {companions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {companions.map((c) => (
                                    <Badge key={c} variant="secondary" className="gap-1 pr-1">
                                        {c}
                                        <button
                                            type="button"
                                            onClick={() => removeCompanion(c)}
                                            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Stops</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addStop}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stop
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {stops.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No stops added yet. Click &quot;Add Stop&quot; to add your first
                            destination.
                        </p>
                    )}
                    {stops.map((stop, i) => (
                        <TripStopForm
                            key={i}
                            index={i}
                            data={stop}
                            onChange={updateStop}
                            onRemove={(idx) => setStops(stops.filter((_, j) => j !== idx))}
                            tripStartDate={startDate}
                            tripEndDate={endDate}
                        />
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Flights</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addFlight}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Flight
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {segments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No flights added. Transportation is entirely optional.
                        </p>
                    )}
                    {segments.map((seg, i) => (
                        <TransportSegmentForm
                            key={i}
                            index={i}
                            data={seg}
                            onChange={updateSegment}
                            onRemove={(idx) => setSegments(segments.filter((_, j) => j !== idx))}
                            tripStartDate={startDate}
                            tripEndDate={endDate}
                        />
                    ))}
                </CardContent>
            </Card>

            <Separator />

            <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isEditing ? "Update Trip" : "Create Trip"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
