# US GIS Data Landscape — Research Notes

**Goal:** Map out where GIS/geospatial data in the US actually lives — federal, state, and county layers — and which sources are stable enough to build tooling against (documented APIs, versioned, unlikely to disappear) vs. which are one-off portals meant for humans clicking a map.

Companion to `research/topo-map-tooling.md` (elevation/contour specific). This doc is broader: parcels, boundaries, imagery, hydrography, land cover, etc.

## The general pattern

US geospatial data is federated, not centralized:
- **Federal agencies** publish national-coverage datasets (elevation, hydrography, land cover, transportation, boundaries) through a handful of long-lived, documented REST APIs.
- **States** aggregate some of this plus state-specific layers (wildlife, forestry, geology) through their own clearinghouses — quality and API-friendliness varies a lot state to state.
- **Counties** own the data that actually matters for a specific address — parcels, zoning, tax assessment, building footprints. This layer is the least standardized: some counties run modern ArcGIS REST servers, most route through a third-party vendor portal (Schneider Geospatial's qPublic/Beacon) built for browser use, not APIs.

So "is there a stable API" depends heavily on *which* layer you need.

## Federal sources (most stable — long-term programs, documented, versioned)

| Source | Data | API | Notes |
|---|---|---|---|
| **USGS National Map** | Elevation (3DEP), orthoimagery, hydrography (NHD), boundaries, transportation, structures, geographic names | REST (ArcGIS ImageServer/MapServer), bulk download | The backbone federal geospatial program. Same 3DEP elevation service used in the topo-map doc. |
| **USGS Earth Explorer** | Satellite/aerial imagery archives (Landsat, etc.) | Search/download API, requires free account | Good for historical imagery, less for current basemaps. |
| **Census Bureau — TIGER/Line** | Administrative & statistical boundaries (states, counties, tracts, blocks, roads, water) | TIGERweb GeoServices REST API + bulk shapefile/geodatabase downloads | Free, no key required for TIGERweb. Updated annually. Very stable — this is the standard source for US boundary data. |
| **Census Geocoding Services API** | Address → lat/lon, address → Census geography | REST, free, no key required, supports batch | Good fit for turning a street address into coordinates before hitting elevation/parcel APIs. |
| **NOAA Digital Coast** | Coastal elevation, hazards, land cover, imagery | Data access API + bulk download | Strong for coastal/climate use cases, less relevant for inland SC sites. |
| **USDA Geospatial Data Gateway** | Soils, cadastral reference, land use/cover, imagery, climate — per county | Bulk download, some web services | USDA NRCS Web Soil Survey has its own REST API (SDA) if soil composition matters later (e.g., for foundation/print-base realism). |
| **EPA (various)** | Environmental hazard layers, watershed boundaries | REST services, mixed quality | Useful if the eventual model wants environmental overlays. |
| **FEMA** | Flood zones (National Flood Hazard Layer) | REST (ArcGIS MapServer) | Free, well documented, commonly used. |

**Takeaway:** federal layers are the most reliable long-term foundation — decades-old programs, REST APIs with real docs, free, mostly no auth. Build the elevation/hydrography/boundary parts of any pipeline on these.

## State-level (South Carolina specifically)

- **SCDNR GIS Data Clearinghouse** (`scdata.dnr.sc.gov`) — statewide layers: boundaries, imagery, wildlife/natural-resource data. This is bulk-download oriented, not really a modern REST API for programmatic querying.
- South Carolina does **not** run a centralized statewide parcel API. Cadastral (property/parcel) data is managed county by county — there's no single "SC parcels" endpoint to hit.

**Takeaway:** state layer is useful for natural-resource/boundary context but not the source for parcel-level detail near the target address.

## County level (Pickens County, where Cleveland SC sits)

- **Pickens County GIS Dept** runs an ArcGIS Online presence and an official **open data site**: `pcgis-pickenscosc.opendata.arcgis.com`. Open Data sites built on ArcGIS Hub typically *do* expose real REST/GeoJSON endpoints per layer (parcels, roads, addresses, etc.) — this is the most promising lead for structured, scriptable local data.
- Public-facing parcel viewer also exists via **qPublic/Schneider Geospatial** (`qpublic.schneidercorp.com`) — this is a browser portal for looking up individual parcels, not a documented API. Some counties nationally expose ArcGIS FeatureServer endpoints behind these portals, but that's inconsistent and undocumented — treat as scrapeable-at-best, not stable.

**Takeaway:** for Pickens County specifically, the ArcGIS Open Data Hub site is the one to actually try programmatically — it's the same technology stack (ArcGIS REST + GeoJSON export) as the more "designed for developers" federal services, so it should behave predictably. The qPublic portal is a fallback for manual lookup only.

## Community / commercial alternatives (for context, not primary)

- **OpenStreetMap / Overpass API** — crowd-sourced but genuinely stable and well-documented; good for roads, buildings, points of interest, land use. Doesn't have parcel boundaries or authoritative elevation, but pairs well as a basemap layer.
- **Esri Living Atlas** — huge curated catalog of REST-accessible layers (imagery, demographics, environment); free tier exists, some layers require ArcGIS org account.
- **Google Maps Platform (Elevation API, Maps API)** — reliable and simple, but paid/keyed and not open data — worth knowing exists as a fallback, not a first choice for an open pipeline.

## Stability assessment (for planning purposes)

**Build on these (durable, documented, free):**
- USGS 3DEP / National Map (elevation) — already the pick in the topo-map doc
- Census TIGER/TIGERweb (boundaries) + Census Geocoder (address → coordinates)
- FEMA NFHL (flood context, if wanted)
- Pickens County ArcGIS Open Data (parcels/local detail) — worth a direct test call before relying on it

**Use cautiously / as fallback (less standardized, portal-first):**
- SCDNR clearinghouse (bulk downloads, not really an API)
- qPublic/Schneider county portals (manual lookup, no public API contract)

## Suggested next step

Do a direct test: hit the Census Geocoder with the target address to get lat/lon, then query the Pickens County ArcGIS Open Data parcels layer for that point, to confirm both are actually programmatically reachable before we build anything real on top of them.
