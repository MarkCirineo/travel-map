"use client";

import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, getWeek } from "date-fns";

interface HeatmapProps {
    data: { date: string; count: number }[];
    year?: number;
}

export function Heatmap({ data, year }: HeatmapProps) {
    const targetYear = year || new Date().getFullYear();

    const { grid, maxCount } = useMemo(() => {
        const dataMap = new Map(data.map((d) => [d.date, d.count]));

        const start = startOfYear(new Date(targetYear, 0, 1));
        const end = endOfYear(new Date(targetYear, 0, 1));
        const days = eachDayOfInterval({ start, end });

        let maxCount = 0;
        const grid: {
            date: Date;
            dateStr: string;
            count: number;
            dayOfWeek: number;
            week: number;
        }[] = [];

        for (const day of days) {
            const dateStr = format(day, "yyyy-MM-dd");
            const count = dataMap.get(dateStr) || 0;
            if (count > maxCount) maxCount = count;
            grid.push({
                date: day,
                dateStr,
                count,
                dayOfWeek: getDay(day),
                week: getWeek(day, { weekStartsOn: 0 }),
            });
        }

        return { grid, maxCount };
    }, [data, targetYear]);

    function getColor(count: number): string {
        if (count === 0) return "var(--color-muted)";
        const intensity = maxCount > 0 ? count / maxCount : 0;
        if (intensity <= 0.25) return "hsl(217 91% 80%)";
        if (intensity <= 0.5) return "hsl(217 91% 65%)";
        if (intensity <= 0.75) return "hsl(217 91% 50%)";
        return "hsl(217 91% 40%)";
    }

    const weeks: Map<number, typeof grid> = new Map();
    for (const cell of grid) {
        const weekNum = Math.floor(
            (cell.date.getTime() - new Date(targetYear, 0, 1).getTime()) /
                (7 * 24 * 60 * 60 * 1000),
        );
        if (!weeks.has(weekNum)) weeks.set(weekNum, []);
        weeks.get(weekNum)!.push(cell);
    }

    return (
        <div className="overflow-x-auto">
            <div className="text-sm font-medium mb-2">{targetYear}</div>
            <TooltipProvider delayDuration={100}>
                <div className="flex gap-[3px]">
                    {[...weeks.entries()].map(([weekNum, cells]) => (
                        <div key={weekNum} className="flex flex-col gap-[3px]">
                            {Array.from({ length: 7 }, (_, dayIdx) => {
                                const cell = cells.find((c) => getDay(c.date) === dayIdx);
                                if (!cell) {
                                    return <div key={dayIdx} className="h-3 w-3 rounded-[2px]" />;
                                }
                                return (
                                    <Tooltip key={dayIdx}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="h-3 w-3 rounded-[2px] border border-transparent hover:border-foreground/30 transition-colors"
                                                style={{ backgroundColor: getColor(cell.count) }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            <p>{format(cell.date, "MMM d, yyyy")}</p>
                                            <p>
                                                {cell.count === 0
                                                    ? "No travel"
                                                    : `${cell.count} trip${cell.count > 1 ? "s" : ""}`}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </TooltipProvider>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                    <div
                        key={i}
                        className="h-3 w-3 rounded-[2px]"
                        style={{
                            backgroundColor:
                                intensity === 0
                                    ? "var(--color-muted)"
                                    : `hsl(217 91% ${80 - intensity * 40}%)`,
                        }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
