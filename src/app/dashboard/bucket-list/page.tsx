"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationSearch } from "@/components/location-search";
import { Heart, Trash2, Plus, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface BucketListItem {
  id: string;
  locationId: string;
  notes: string | null;
  priority: number | null;
  createdAt: string;
  location: {
    id: string;
    name: string;
    type: string;
    country?: { name: string } | null;
  };
}

export default function BucketListPage() {
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const res = await fetch("/api/bucket-list");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/bucket-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          notes: notes || null,
          priority: priority ? parseInt(priority) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }

      toast.success("Added to bucket list");
      setSelectedLocationId("");
      setSelectedLocationName("");
      setNotes("");
      setPriority("");
      await loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      const res = await fetch(`/api/bucket-list?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Removed from bucket list");
        setItems(items.filter((i) => i.id !== id));
      }
    } catch {
      toast.error("Failed to remove");
    }
  }

  const priorityLabel = (p: number | null) => {
    if (p === 1) return "High";
    if (p === 2) return "Medium";
    if (p === 3) return "Low";
    return null;
  };

  const priorityColor = (p: number | null) => {
    if (p === 1) return "destructive" as const;
    if (p === 2) return "default" as const;
    if (p === 3) return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bucket List</h1>
        <p className="text-muted-foreground">
          Places you dream of visiting
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a Destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Location</Label>
            <LocationSearch
              value={selectedLocationId}
              displayValue={selectedLocationName}
              onSelect={(loc) => {
                setSelectedLocationId(loc.id);
                setSelectedLocationName(loc.name);
              }}
              placeholder="Search for a destination..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this place?"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={adding || !selectedLocationId}>
            {adding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add to Bucket List
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Your bucket list is empty. Add places you want to visit!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium truncate">
                        {item.location.name}
                      </span>
                    </div>
                    {item.location.country && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {item.location.country.name}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-2 ml-6">
                        {item.notes}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 ml-6">
                      <Badge variant="outline" className="text-[10px]">
                        {item.location.type}
                      </Badge>
                      {item.priority && (
                        <Badge
                          variant={priorityColor(item.priority)}
                          className="text-[10px]"
                        >
                          {priorityLabel(item.priority)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
