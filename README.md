# MapCore

**MapCore** is a reusable open‑source mapping microservice combining:

- **OSM data** stored in PostGIS  
- A **GeoJSON API** (Node/Express) under `map-api/index.js`  
- A **Leaflet** front‑end in `map-api/index.html`

Project Layout
MapCore/
├── osm-data/             # Raw OSM PBFs (import only)
└── map-api/
    ├── index.js          # Express GeoJSON API
    ├── index.html        # Leaflet front‑end
    ├── package.json
    └── package-lock.json
## Prerequisites

- PostgreSQL + PostGIS  
- `osm2pgsql`, `node`, `npm`

## Setup

1. **Import OSM**  
   ```bash
   cd osm-data
   sudo -u postgres osm2pgsql -d maps --slim --hstore --multi-geometry washington-latest.osm.pbf


2. **Install API deps**
   ```bash
   cd map-api
   npm install

3. **Run API**
   ```bash
   node index.js

4.  **View Map**
   ```bash
   Open your browser at http://localhost:3000/index.html


 
 




