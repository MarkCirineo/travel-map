"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface TransportSegmentFormProps {
  index: number;
  data: TransportSegmentData;
  onChange: (index: number, data: TransportSegmentData) => void;
  onRemove: (index: number) => void;
}

export function TransportSegmentForm({
  index,
  data,
  onChange,
  onRemove,
}: TransportSegmentFormProps) {
  function update(partial: Partial<TransportSegmentData>) {
    onChange(index, { ...data, ...partial });
  }

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
          <Input
            type="date"
            value={data.departureDate}
            onChange={(e) => update({ departureDate: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Arrival Date</Label>
          <Input
            type="date"
            value={data.arrivalDate}
            onChange={(e) => update({ arrivalDate: e.target.value })}
          />
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
