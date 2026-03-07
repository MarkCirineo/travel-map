"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    defaultMonth?: Date;
}

function toDate(value: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value + "T00:00:00");
    return isValid(d) ? d : undefined;
}

function toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    disabled = false,
    className,
    defaultMonth,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [typedValue, setTypedValue] = React.useState("");
    const selectedDate = toDate(value);

    const calendarMonth = selectedDate ?? defaultMonth;

    React.useEffect(() => {
        if (open) {
            setTypedValue(selectedDate ? format(selectedDate, "MM/dd/yyyy") : "");
        }
    }, [open, selectedDate]);

    function handleSelect(date: Date | undefined) {
        if (date) {
            onChange(toDateString(date));
            setOpen(false);
        }
    }

    function handleTypedChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value;
        setTypedValue(raw);

        if (raw.length === 10) {
            const parsed = parse(raw, "MM/dd/yyyy", new Date());
            if (isValid(parsed) && parsed.getFullYear() >= 1900 && parsed.getFullYear() <= 2100) {
                onChange(toDateString(parsed));
                setOpen(false);
            }
        }
    }

    function handleTypedKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="size-4 shrink-0 opacity-60" />
                    {selectedDate ? (
                        <span>{format(selectedDate, "MMM d, yyyy")}</span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="border-b px-3 py-2">
                    <input
                        type="text"
                        value={typedValue}
                        onChange={handleTypedChange}
                        onKeyDown={handleTypedKeyDown}
                        placeholder="MM/DD/YYYY"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        autoFocus
                    />
                </div>
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    defaultMonth={calendarMonth}
                    fromYear={1900}
                    toYear={2100}
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };
