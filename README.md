# TravelMap

A travel analytics dashboard built with Next.js. Log trips, visualize visited locations on an interactive world map, and explore detailed statistics about your travel history.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: PostgreSQL via Prisma 7
- **Auth**: NextAuth v5 (email/password, JWT)
- **UI**: Tailwind CSS + shadcn/ui
- **Map**: Leaflet with GeoJSON overlays
- **Charts**: Recharts

## Features

- Trip logging with stops, dates, companions, and notes
- Flight/transportation segment tracking per trip
- Interactive world map colored by visited countries, states, and cities
- Analytics dashboard: countries/states/cities visited, travel days, streaks, heatmap, flight distance, airline breakdown
- Bucket list with priority levels
- Location and airport autocomplete from seeded internal database (~30k cities, ~9k airports)
- Dark mode
- Fully responsive (mobile sidebar drawer)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or remote)

## Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env
```

Edit `.env` with your database connection string and an auth secret:

```
DATABASE_URL="postgresql://user:password@localhost:5432/travel_map"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Database

```bash
# Run migrations to create all tables
npx prisma migrate dev --name init

# Seed locations, airports, and cities (~30k cities, ~9k airports)
# This takes a few minutes on the first run
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start logging trips.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Public landing page
│   ├── (auth)/                      # Sign in / sign up
│   ├── dashboard/                   # Protected dashboard routes
│   │   ├── page.tsx                 # Overview
│   │   ├── map/                     # Interactive map
│   │   ├── trips/                   # Trip CRUD
│   │   ├── bucket-list/             # Bucket list
│   │   └── analytics/               # Deep-dive analytics
│   └── api/                         # REST API routes
├── components/
│   ├── layout/                      # Sidebar, header, mobile nav
│   ├── trips/                       # Trip card, forms
│   ├── map/                         # Leaflet map, tooltips
│   ├── analytics/                   # Stat card, heatmap, charts
│   └── ui/                          # shadcn components
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── prisma.ts                    # Prisma client singleton
│   ├── analytics.ts                 # Query-based analytics engine
│   └── geo-utils.ts                 # Haversine distance
└── types/
    └── index.ts                     # Shared TypeScript types
prisma/
├── schema.prisma                    # Database schema
├── seed.ts                          # Seed script
└── data/                            # Countries, states, CSV data
public/
└── geo/                             # GeoJSON for map overlays
```

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed locations and airports |
| `npm run db:reset` | Reset database and re-run migrations |
| `npm run lint` | Run ESLint |

## Deployment (Hetzner / VPS)

1. Clone the repo and install dependencies on your server
2. Set up PostgreSQL and configure `DATABASE_URL` in `.env`
3. Generate a secure `AUTH_SECRET` (`openssl rand -base64 32`)
4. Run migrations and seed:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Build and start:
   ```bash
   npm run build
   npm start
   ```
6. Put behind a reverse proxy (nginx/Caddy) with HTTPS

## Seed Data Sources

- **Countries**: All 195 UN-recognized countries
- **States/Provinces**: US states + DC + territories, Canadian provinces
- **Cities**: ~30,000 cities from [GeoNames](https://www.geonames.org/) (population > 15k)
- **Airports**: ~9,000 commercial airports from [OurAirports](https://ourairports.com/data/) (large + medium with IATA codes)
- **GeoJSON**: Natural Earth 110m country boundaries, US state boundaries

## License

Private project. Not licensed for redistribution.
