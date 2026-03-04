import "dotenv/config";
import { PrismaClient, LocationType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { countries } from "./data/countries";
import { states } from "./data/states";
import * as fs from "fs";
import * as path from "path";

function makePrismaClient() {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith("prisma+postgres") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url });
  }
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = makePrismaClient();

// Parse tab-separated GeoNames cities15000.txt
// Columns: geonameid, name, asciiname, alternatenames, latitude, longitude, 
// feature_class, feature_code, country_code, cc2, admin1_code, admin2_code,
// admin3_code, admin4_code, population, elevation, dem, timezone, modification_date
function parseCities(filePath: string): Array<{
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  admin1Code: string;
  population: number;
}> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const cols = line.split("\t");
    return {
      name: cols[1],
      latitude: parseFloat(cols[4]),
      longitude: parseFloat(cols[5]),
      countryCode: cols[8],
      admin1Code: cols[10],
      population: parseInt(cols[14]) || 0,
    };
  });
}

// Parse OurAirports CSV
function parseAirports(filePath: string): Array<{
  name: string;
  iataCode: string;
  icaoCode: string;
  latitude: number;
  longitude: number;
  type: string;
  iso_country: string;
  iso_region: string;
}> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const header = parseCSVLine(lines[0]);
  const nameIdx = header.indexOf("name");
  const iataIdx = header.indexOf("iata_code");
  const icaoIdx = header.indexOf("ident");
  const latIdx = header.indexOf("latitude_deg");
  const lngIdx = header.indexOf("longitude_deg");
  const typeIdx = header.indexOf("type");
  const countryIdx = header.indexOf("iso_country");
  const regionIdx = header.indexOf("iso_region");

  const results: Array<{
    name: string;
    iataCode: string;
    icaoCode: string;
    latitude: number;
    longitude: number;
    type: string;
    iso_country: string;
    iso_region: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCSVLine(lines[i]);
    const type = cols[typeIdx];
    const iata = cols[iataIdx];

    // Only include large and medium airports with valid IATA codes
    if (
      (type === "large_airport" || type === "medium_airport") &&
      iata &&
      iata.length === 3 &&
      iata !== "0"
    ) {
      results.push({
        name: cols[nameIdx],
        iataCode: iata,
        icaoCode: cols[icaoIdx] || "",
        latitude: parseFloat(cols[latIdx]),
        longitude: parseFloat(cols[lngIdx]),
        type,
        iso_country: cols[countryIdx],
        iso_region: cols[regionIdx],
      });
    }
  }
  return results;
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function generateSlug(name: string, countryCode: string, admin1?: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const suffix = admin1 ? `${countryCode}-${admin1}` : countryCode;
  return `${base}-${suffix}`.toLowerCase();
}

// US state FIPS codes used by GeoNames admin1_code
const usFipsToState: Record<string, string> = {
  AL: "US-AL", AK: "US-AK", AZ: "US-AZ", AR: "US-AR", CA: "US-CA",
  CO: "US-CO", CT: "US-CT", DE: "US-DE", FL: "US-FL", GA: "US-GA",
  HI: "US-HI", ID: "US-ID", IL: "US-IL", IN: "US-IN", IA: "US-IA",
  KS: "US-KS", KY: "US-KY", LA: "US-LA", ME: "US-ME", MD: "US-MD",
  MA: "US-MA", MI: "US-MI", MN: "US-MN", MS: "US-MS", MO: "US-MO",
  MT: "US-MT", NE: "US-NE", NV: "US-NV", NH: "US-NH", NJ: "US-NJ",
  NM: "US-NM", NY: "US-NY", NC: "US-NC", ND: "US-ND", OH: "US-OH",
  OK: "US-OK", OR: "US-OR", PA: "US-PA", RI: "US-RI", SC: "US-SC",
  SD: "US-SD", TN: "US-TN", TX: "US-TX", UT: "US-UT", VT: "US-VT",
  VA: "US-VA", WA: "US-WA", WV: "US-WV", WI: "US-WI", WY: "US-WY",
  DC: "US-DC", PR: "US-PR", GU: "US-GU", VI: "US-VI", AS: "US-AS",
};

// Canadian province codes
const caProvinceToState: Record<string, string> = {
  "01": "CA-AB", "02": "CA-BC", "03": "CA-MB", "04": "CA-NB",
  "05": "CA-NL", "07": "CA-NS", "08": "CA-ON", "09": "CA-PE",
  10: "CA-QC", 11: "CA-SK", 12: "CA-YT", 13: "CA-NT", 14: "CA-NU",
};

async function main() {
  console.log("🌍 Starting seed...\n");

  // 1. Seed Countries
  console.log("📍 Seeding countries...");
  const countryMap = new Map<string, string>(); // iso2 -> id
  
  for (const [name, slug, iso2, iso3, lat, lng] of countries) {
    const loc = await prisma.location.upsert({
      where: { slug },
      update: { name, latitude: lat, longitude: lng, iso2, iso3 },
      create: {
        name,
        slug,
        type: LocationType.COUNTRY,
        latitude: lat,
        longitude: lng,
        iso2,
        iso3,
      },
    });
    countryMap.set(iso2, loc.id);
  }
  console.log(`  ✅ ${countries.length} countries seeded\n`);

  // 2. Seed States/Provinces
  console.log("📍 Seeding states/provinces...");
  const stateMap = new Map<string, string>(); // iso code -> id

  for (const [name, slug, isoCode, countryIso2, lat, lng] of states) {
    const countryId = countryMap.get(countryIso2);
    const loc = await prisma.location.upsert({
      where: { slug },
      update: { name, latitude: lat, longitude: lng, countryId, iso2: isoCode },
      create: {
        name,
        slug,
        type: LocationType.STATE,
        latitude: lat,
        longitude: lng,
        countryId,
        iso2: isoCode,
      },
    });
    stateMap.set(isoCode, loc.id);
  }
  console.log(`  ✅ ${states.length} states/provinces seeded\n`);

  // 3. Seed Cities from GeoNames
  console.log("🏙️  Seeding cities from GeoNames...");
  const citiesPath = path.join(__dirname, "data", "cities15000.txt");
  
  if (!fs.existsSync(citiesPath)) {
    console.log("  ⚠️  cities15000.txt not found. Skipping cities.");
  } else {
    const citiesData = parseCities(citiesPath);
    console.log(`  📊 Parsed ${citiesData.length} cities from GeoNames`);

    // Track used slugs to avoid duplicates
    const usedSlugs = new Set<string>();
    
    // Get existing city slugs
    const existingCities = await prisma.location.findMany({
      where: { type: LocationType.CITY },
      select: { slug: true },
    });
    existingCities.forEach((c) => usedSlugs.add(c.slug));

    // Batch insert cities
    const batchSize = 500;
    let cityCount = 0;
    const citySlugToId = new Map<string, string>();

    for (let i = 0; i < citiesData.length; i += batchSize) {
      const batch = citiesData.slice(i, i + batchSize);
      const cityRecords = [];

      for (const city of batch) {
        const countryId = countryMap.get(city.countryCode);
        if (!countryId) continue;

        // Try to find state
        let stateId: string | undefined;
        if (city.countryCode === "US") {
          const stateIso = usFipsToState[city.admin1Code];
          if (stateIso) stateId = stateMap.get(stateIso);
        } else if (city.countryCode === "CA") {
          const stateIso = caProvinceToState[city.admin1Code];
          if (stateIso) stateId = stateMap.get(stateIso);
        }

        let slug = generateSlug(city.name, city.countryCode, city.admin1Code);
        // Deduplicate slugs
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${Math.round(city.latitude * 100)}`;
          if (usedSlugs.has(slug)) {
            slug = `${slug}-${Math.round(city.longitude * 100)}`;
          }
        }
        if (usedSlugs.has(slug)) continue;
        usedSlugs.add(slug);

        cityRecords.push({
          name: city.name,
          slug,
          type: LocationType.CITY as LocationType,
          latitude: city.latitude,
          longitude: city.longitude,
          countryId,
          stateId: stateId || null,
          iso2: city.countryCode,
        });
      }

      if (cityRecords.length > 0) {
        await prisma.location.createMany({
          data: cityRecords,
          skipDuplicates: true,
        });
        cityCount += cityRecords.length;
      }

      if ((i / batchSize) % 10 === 0) {
        console.log(`  📊 Progress: ${Math.min(i + batchSize, citiesData.length)}/${citiesData.length} processed...`);
      }
    }

    // Build city lookup for airport matching
    const allCities = await prisma.location.findMany({
      where: { type: LocationType.CITY },
      select: { id: true, slug: true, latitude: true, longitude: true, countryId: true },
    });
    allCities.forEach((c) => citySlugToId.set(c.slug, c.id));

    console.log(`  ✅ ${cityCount} cities seeded\n`);

    // 4. Seed Airports from OurAirports  
    console.log("✈️  Seeding airports from OurAirports...");
    const airportsPath = path.join(__dirname, "data", "airports.csv");

    if (!fs.existsSync(airportsPath)) {
      console.log("  ⚠️  airports.csv not found. Skipping airports.");
    } else {
      const airportsData = parseAirports(airportsPath);
      console.log(`  📊 Parsed ${airportsData.length} commercial airports`);

      const usedIata = new Set<string>();
      let airportCount = 0;

      // Find nearest city for each airport using simple distance
      function findNearestCity(lat: number, lng: number, countryCode: string): string | null {
        let nearestId: string | null = null;
        let nearestDist = Infinity;
        const countryId = countryMap.get(countryCode);

        for (const city of allCities) {
          // Prefer same country
          if (city.countryId !== countryId) continue;
          const dlat = city.latitude - lat;
          const dlng = city.longitude - lng;
          const dist = dlat * dlat + dlng * dlng;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = city.id;
          }
        }

        // If no city in same country within reasonable range, try all cities
        if (!nearestId || nearestDist > 25) {
          for (const city of allCities) {
            const dlat = city.latitude - lat;
            const dlng = city.longitude - lng;
            const dist = dlat * dlat + dlng * dlng;
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestId = city.id;
            }
          }
        }

        return nearestId;
      }

      for (let i = 0; i < airportsData.length; i += batchSize) {
        const batch = airportsData.slice(i, i + batchSize);
        const airportRecords = [];

        for (const airport of batch) {
          if (usedIata.has(airport.iataCode)) continue;
          usedIata.add(airport.iataCode);

          const cityId = findNearestCity(
            airport.latitude,
            airport.longitude,
            airport.iso_country
          );

          airportRecords.push({
            name: airport.name,
            iataCode: airport.iataCode,
            icaoCode: airport.icaoCode || null,
            latitude: airport.latitude,
            longitude: airport.longitude,
            cityId,
          });
        }

        if (airportRecords.length > 0) {
          await prisma.airport.createMany({
            data: airportRecords,
            skipDuplicates: true,
          });
          airportCount += airportRecords.length;
        }

        if ((i / batchSize) % 5 === 0) {
          console.log(`  📊 Progress: ${Math.min(i + batchSize, airportsData.length)}/${airportsData.length} processed...`);
        }
      }

      console.log(`  ✅ ${airportCount} airports seeded\n`);
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
