"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AirportSearch } from "@/components/airport-search";
import { Trash2 } from "lucide-react";

export interface TransportSegmentData {
    departureAirportId: string;
    departureAirportLabel: string;
    arrivalAirportId: string;
    arrivalAirportLabel: string;
    departureDate: string;
    arrivalDate: string;
    airline: string;
    flightNumber: string;
    notes: string;
}

function toDate(value: string): Date | undefined {
    if (!value) return undefined;
    return new Date(value + "T00:00:00");
}

interface TransportSegmentFormProps {
    index: number;
    data: TransportSegmentData;
    onChange: (index: number, data: TransportSegmentData) => void;
    onRemove: (index: number) => void;
    tripStartDate?: string;
    tripEndDate?: string;
}

export function TransportSegmentForm({
    index,
    data,
    onChange,
    onRemove,
    tripStartDate,
    tripEndDate,
}: TransportSegmentFormProps) {
    function update(partial: Partial<TransportSegmentData>) {
        onChange(index, { ...data, ...partial });
    }

    const depDefaultMonth = toDate(data.departureDate) ?? toDate(tripStartDate ?? "");
    const arrDefaultMonth =
        toDate(data.arrivalDate) ?? toDate(data.departureDate) ?? toDate(tripStartDate ?? "");

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Flight {index + 1}</span>
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
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Departure Airport</Label>
                    <AirportSearch
                        value={data.departureAirportId}
                        displayValue={data.departureAirportLabel}
                        onSelect={(a) =>
                            update({
                                departureAirportId: a.id,
                                departureAirportLabel: `${a.iataCode} - ${a.name}`,
                            })
                        }
                        placeholder="From..."
                    />
                </div>
                <div>
                    <Label className="text-xs">Arrival Airport</Label>
                    <AirportSearch
                        value={data.arrivalAirportId}
                        displayValue={data.arrivalAirportLabel}
                        onSelect={(a) =>
                            update({
                                arrivalAirportId: a.id,
                                arrivalAirportLabel: `${a.iataCode} - ${a.name}`,
                            })
                        }
                        placeholder="To..."
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Departure Date</Label>
                    <DatePicker
                        value={data.departureDate}
                        onChange={(val) => update({ departureDate: val })}
                        placeholder="Departure date"
                        defaultMonth={depDefaultMonth}
                    />
                </div>
                <div>
                    <Label className="text-xs">Arrival Date</Label>
                    <DatePicker
                        value={data.arrivalDate}
                        onChange={(val) => update({ arrivalDate: val })}
                        placeholder="Arrival date"
                        defaultMonth={arrDefaultMonth}
                    />
                    {data.departureDate &&
                        data.arrivalDate &&
                        data.arrivalDate < data.departureDate && (
                            <p className="text-xs text-destructive mt-1">
                                Arrival is before departure
                            </p>
                        )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Airline</Label>
                    <Input
                        value={data.airline}
                        onChange={(e) => update({ airline: e.target.value })}
                        placeholder="e.g. United Airlines"
                    />
                </div>
                <div>
                    <Label className="text-xs">Flight Number</Label>
                    <Input
                        value={data.flightNumber}
                        onChange={(e) => update({ flightNumber: e.target.value })}
                        placeholder="e.g. UA123"
                    />
                </div>
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
