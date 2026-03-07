import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, BarChart3, Plane, Heart, ArrowRight } from "lucide-react";

const features = [
    {
        icon: MapPin,
        title: "Trip Logging",
        description:
            "Log every trip with detailed stops, dates, companions, and notes. Support for day trips, multi-city adventures, and undated historical trips.",
    },
    {
        icon: Globe,
        title: "Interactive Map",
        description:
            "See your visited countries, states, and cities on a beautiful world map with GeoJSON overlays and click-to-explore detail panels.",
    },
    {
        icon: BarChart3,
        title: "Travel Analytics",
        description:
            "Deep-dive into your travel stats: countries visited, travel streaks, yearly heatmaps, trip frequency, and more -- all computed dynamically.",
    },
    {
        icon: Plane,
        title: "Flight Tracking",
        description:
            "Track your flights with airline, route, and distance data. See your most-used airports, longest flights, and airline breakdown.",
    },
    {
        icon: Heart,
        title: "Bucket List",
        description:
            "Keep a prioritized list of places you dream of visiting. Search from a database of 30,000+ cities worldwide.",
    },
    {
        icon: BarChart3,
        title: "GitHub-Style Heatmap",
        description:
            "Visualize your travel activity across the year with a beautiful contribution-style heatmap showing your busiest travel periods.",
    },
];

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <Globe className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">TravelMap</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/sign-in">
                            <Button variant="ghost">Sign in</Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="container mx-auto px-4 py-24 text-center">
                    <div className="mx-auto max-w-3xl">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            Your travel story,
                            <br />
                            <span className="text-primary">beautifully tracked</span>
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                            An obsessive travel analytics dashboard. Log trips, visualize your
                            journey on an interactive map, and explore every metric of your travel
                            life.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <Link href="/sign-up">
                                <Button size="lg" className="gap-2">
                                    Start Tracking
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/sign-in">
                                <Button variant="outline" size="lg">
                                    Sign in
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="border-t bg-muted/40 py-24">
                    <div className="container mx-auto px-4">
                        <h2 className="text-center text-3xl font-bold mb-4">
                            Everything you need to track your travels
                        </h2>
                        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
                            From logging your first trip to analyzing years of travel data,
                            TravelMap gives you the complete picture.
                        </p>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.title} className="rounded-lg border bg-card p-6">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-24">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-16">Built for data lovers</h2>
                        <div className="grid gap-8 md:grid-cols-4">
                            {[
                                { value: "195", label: "Countries in database" },
                                { value: "30k+", label: "Cities searchable" },
                                { value: "9k+", label: "Airports tracked" },
                                { value: "100%", label: "Free to use" },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="border-t bg-muted/40 py-24">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to map your world?</h2>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Create your account and start logging trips today. No subscription, no
                            ads.
                        </p>
                        <Link href="/sign-up">
                            <Button size="lg" className="gap-2">
                                Get Started Free
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t py-8">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>TravelMap &mdash; Travel analytics</p>
                </div>
            </footer>
        </div>
    );
}
