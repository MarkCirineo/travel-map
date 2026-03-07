"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#16a34a",
    "#0891b2",
    "#4f46e5",
    "#c026d3",
];

interface TripsPerYearChartProps {
    data: { year: number; count: number }[];
}

export function TripsPerYearChart({ data }: TripsPerYearChartProps) {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Trips Per Year</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <XAxis dataKey="year" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface DaysPerCountryChartProps {
    data: { name: string; days: number }[];
}

export function DaysPerCountryChart({ data }: DaysPerCountryChartProps) {
    if (data.length === 0) return null;
    const top10 = data.slice(0, 10);
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Days Per Country</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={top10} layout="vertical">
                        <XAxis type="number" fontSize={12} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            fontSize={12}
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar dataKey="days" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface AirlineBreakdownChartProps {
    data: { airline: string; count: number }[];
}

export function AirlineBreakdownChart({ data }: AirlineBreakdownChartProps) {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Airlines</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="airline"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name} (${value})`}
                            labelLine={false}
                            fontSize={11}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface TravelDaysPerYearChartProps {
    data: { year: number; days: number }[];
}

export function TravelDaysPerYearChart({ data }: TravelDaysPerYearChartProps) {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Travel Days Per Year</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <XAxis dataKey="year" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="days" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
