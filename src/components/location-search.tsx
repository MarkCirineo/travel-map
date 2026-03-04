"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationResult {
  id: string;
  name: string;
  type: "COUNTRY" | "STATE" | "CITY";
  country?: { id: string; name: string } | null;
  state?: { id: string; name: string } | null;
}

interface LocationSearchProps {
  value?: string;
  displayValue?: string;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
  type?: "COUNTRY" | "STATE" | "CITY";
}

export function LocationSearch({
  value,
  displayValue,
  onSelect,
  placeholder = "Search locations...",
  type,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (type) params.set("type", type);
        const res = await fetch(`/api/locations/search?${params}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  function subtitle(loc: LocationResult) {
    const parts: string[] = [];
    if (loc.state?.name) parts.push(loc.state.name);
    if (loc.country?.name) parts.push(loc.country.name);
    return parts.join(", ");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search..."
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
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            <CommandGroup>
              {results.map((loc) => (
                <CommandItem
                  key={loc.id}
                  value={loc.id}
                  onSelect={() => {
                    onSelect(loc);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{loc.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {loc.type}
                      </Badge>
                    </div>
                    {subtitle(loc) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {subtitle(loc)}
                      </p>
                    )}
                  </div>
                  {value === loc.id && (
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
