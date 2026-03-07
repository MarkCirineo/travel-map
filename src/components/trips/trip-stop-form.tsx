"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { LocationSearch } from "@/components/location-search";
import { Trash2 } from "lucide-react";

export interface TripStopData {
    locationId: string;
    locationName: string;
    arrivalDate: string;
    departureDate: string;
    hasOvernightStay: boolean;
    notes: string;
}

function toDate(value: string): Date | undefined {
    if (!value) return undefined;
    return new Date(value + "T00:00:00");
}

interface TripStopFormProps {
    index: number;
    data: TripStopData;
    onChange: (index: number, data: TripStopData) => void;
    onRemove: (index: number) => void;
    tripStartDate?: string;
    tripEndDate?: string;
}

export function TripStopForm({
    index,
    data,
    onChange,
    onRemove,
    tripStartDate,
    tripEndDate,
}: TripStopFormProps) {
    function update(partial: Partial<TripStopData>) {
        onChange(index, { ...data, ...partial });
    }

    const arrivalDefaultMonth = toDate(data.arrivalDate) ?? toDate(tripStartDate ?? "");
    const departureDefaultMonth =
        toDate(data.departureDate) ?? toDate(data.arrivalDate) ?? toDate(tripEndDate ?? "");

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stop {index + 1}</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div>
                <Label className="text-xs">Location</Label>
                <LocationSearch
                    value={data.locationId}
                    displayValue={data.locationName}
                    onSelect={(loc) => update({ locationId: loc.id, locationName: loc.name })}
                    placeholder="Search for a city, state, or country..."
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Arrival</Label>
                    <DatePicker
                        value={data.arrivalDate}
                        onChange={(val) => update({ arrivalDate: val })}
                        placeholder="Arrival date"
                        defaultMonth={arrivalDefaultMonth}
                    />
                </div>
                <div>
                    <Label className="text-xs">Departure</Label>
                    <DatePicker
                        value={data.departureDate}
                        onChange={(val) => update({ departureDate: val })}
                        placeholder="Departure date"
                        defaultMonth={departureDefaultMonth}
                    />
                    {data.arrivalDate &&
                        data.departureDate &&
                        data.departureDate < data.arrivalDate && (
                            <p className="text-xs text-destructive mt-1">
                                Departure is before arrival
                            </p>
                        )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id={`overnight-${index}`}
                    checked={data.hasOvernightStay}
                    onChange={(e) => update({ hasOvernightStay: e.target.checked })}
                    className="rounded border-input"
                />
                <Label htmlFor={`overnight-${index}`} className="text-xs font-normal">
                    Overnight stay
                </Label>
            </div>
            <div>
                <Label className="text-xs">Notes</Label>
                <Input
                    value={data.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    placeholder="Optional notes..."
                />
            </div>
        </div>
    );
}
