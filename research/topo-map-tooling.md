# Topographic Map Tooling — Research Notes

**Goal:** Get a real elevation/contour map for a specific site (125 Sourwood Lane, Cleveland, SC 29635), with an eye toward eventually exporting terrain as a 3D-printable model. This doc surveys what's available before we touch formats or rendering.

## Site context
- Location: Cleveland, SC — Blue Ridge foothills, near Table Rock State Park / Eastatoe Valley. Expect meaningful relief (steep slopes, stream cuts) rather than flat terrain, so DEM resolution will matter for a good print.

## What's available in this Claude environment

### MCP connectors (checked via registry search)
- **Felt Maps** — geospatial data mapping/analysis MCP. Not currently installed/connected. Tools include `create_map`, `get_map_layers`, `share_map`, etc. Good for interactive web maps and layering data, but not clearly built for raw elevation/contour export — would need to verify it can ingest a DEM or just visualizes vector layers.
- No other GIS/elevation-specific connector found in the registry search (results otherwise were unrelated: NPI registry, trademark search, ops/CRM tools).

### Skills / Plugins
- No GIS, topographic, elevation, or mapping skill exists in the current skill or plugin catalog. Nothing to enable here — this is a build-it-ourselves job using code + public data APIs.

### Conclusion
There's no packaged "get me a topo map" tool. The realistic path is: pull elevation data from a public API, process it with open-source geospatial libraries, and generate our own contours/mesh in code. This fits the "coding/agentic project" framing — we have full tooling for this already (Python/Node runtime, git, etc.), just need the right libraries and data source.

## Data sources (public, free, no auth needed for basic use)

| Source | What it gives you | Notes |
|---|---|---|
| **USGS 3DEP** (3D Elevation Program) | 1m, 1/3 arc-sec (~10m), 1 arc-sec (~30m) DEMs for the US | Authoritative source. Now available as Cloud-Optimized GeoTIFFs on AWS. |
| **USGS National Map — 3DEPElevation ImageServer** | REST API, includes server-side functions: Hillshade, Slope, Aspect, **Contour** (25 smoothed contours per AOI) | `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer` |
| **USGS TopoView** | Scanned historical + current USGS topo quad maps (image/PDF) | Good for quick visual reference, not for programmatic terrain data |
| **OpenTopography** | API access layered on top of USGS 3DEP + global datasets (SRTM, etc.), subsets rasters on-the-fly from AWS | Has a documented REST API + maintained Jupyter notebook workflows ([OT_3DEP_Workflows](https://github.com/OpenTopography/OT_3DEP_Workflows)) for DEM generation, canopy height models, etc. |
| **USGS National Map Viewer** | Interactive UI to preview/download DEM tiles for an AOI | Manual fallback if scripting stalls |

## Processing tooling (open source, would run locally in this repo/sandbox)

- **GDAL** — core raster I/O, reprojection, format conversion (GeoTIFF ↔ everything).
- **PDAL** — point cloud processing, needed if we go down to raw 1m lidar (`.laz`) rather than pre-baked DEM.
- **rasterio** (Python) — Pythonic wrapper over GDAL for reading/clipping DEM rasters to our AOI.
- **matplotlib / contourpy** — generate contour lines from a DEM array for a classic topo-map look.
- **numpy-stl / trimesh** — turn a heightmap into a triangulated mesh — this is the bridge to a 3D-printable format (STL/OBJ) once we get that far.
- **py3dep** (part of the HyRiver Python suite) — convenience wrapper specifically for pulling 3DEP data by bounding box.

## Suggested pipeline (for later, not yet executed)

1. Geocode the address → lat/lon (needs a geocoding source — Census geocoder is free/no-key, or Nominatim/OSM).
2. Define an AOI (bounding box) around the parcel/neighborhood at an appropriate radius.
3. Pull a DEM for that AOI from USGS 3DEP (via OpenTopography API or py3dep) at 1m or 1/3 arc-sec resolution.
4. Process with rasterio/GDAL: clip, reproject, fill voids if any.
5. Generate contours (matplotlib/contourpy or GDAL's `gdal_contour`) for a 2D topo map view.
6. If proceeding to a physical model: convert heightmap → mesh (numpy-stl/trimesh) → STL, scale to print bed, decide on vertical exaggeration.

## Open questions for next step
- Do we want Felt Maps connected for interactive visualization, or is this purely a "generate static outputs in-repo" project?
- What AOI size counts as "the neighborhood" — parcel only, walking-distance radius, or a fixed bounding box (e.g., 1km²)?
- Target output for the *next* step: a plotted contour image, a raw DEM file, or straight to mesh/STL?
