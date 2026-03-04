import { TripForm } from "@/components/trips/trip-form";

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Trip</h1>
        <p className="text-muted-foreground">Log a new trip</p>
      </div>
      <TripForm />
    </div>
  );
}
