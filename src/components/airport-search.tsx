"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plane, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AirportResult {
    id: string;
    name: string;
    iataCode: string;
    icaoCode?: string | null;
    city?: { name: string; country?: { name: string } | null } | null;
}

interface AirportSearchProps {
    value?: string;
    displayValue?: string;
    onSelect: (airport: AirportResult) => void;
    placeholder?: string;
}

export function AirportSearch({
    value,
    displayValue,
    onSelect,
    placeholder = "Search airports...",
}: AirportSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AirportResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    setResults(await res.json());
                }
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                    )}
                >
                    <span className="truncate">{displayValue || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type airport name or IATA code..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!loading && query.length >= 2 && results.length === 0 && (
                            <CommandEmpty>No airports found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {results.map((airport) => (
                                <CommandItem
                                    key={airport.id}
                                    value={airport.id}
                                    onSelect={() => {
                                        onSelect(airport);
                                        setOpen(false);
                                        setQuery("");
                                    }}
                                >
                                    <Plane className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-medium">
                                                {airport.iataCode}
                                            </span>
                                            <span className="truncate">{airport.name}</span>
                                        </div>
                                        {airport.city && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {airport.city.name}
                                                {airport.city.country
                                                    ? `, ${airport.city.country.name}`
                                                    : ""}
                                            </p>
                                        )}
                                    </div>
                                    {value === airport.id && (
                                        <Check className="ml-2 h-4 w-4 shrink-0" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
