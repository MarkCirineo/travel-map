import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapTooltipProps {
    info: {
        name: string;
        count: number;
        type: string;
    } | null;
    onClose: () => void;
}

export function MapTooltip({ info, onClose }: MapTooltipProps) {
    if (!info) return null;

    const icon =
        {
            country: Globe,
            state: MapPin,
            city: MapPin,
            airport: Plane,
        }[info.type] || MapPin;

    const Icon = icon;

    return (
        <Card className="absolute top-4 right-4 z-[1000] w-72 shadow-lg">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {info.name}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        {info.count} visit{info.count !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                        {info.type}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
