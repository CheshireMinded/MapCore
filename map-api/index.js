const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files (index.html, etc.) from this directory
app.use(express.static(path.join(__dirname)));

// Configure PostgreSQL connection via UNIX socket
const pool = new Pool({
  user: 'postgres',
  database: 'maps',
  host: '/var/run/postgresql'
});

// Generic GeoJSON overlay endpoint
app.get('/overlays/:layer', async (req, res) => {
  try {
    const { layer } = req.params;
    const { bbox } = req.query; // "minLon,minLat,maxLon,maxLat"
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);

    // Define SQL snippets for each overlay layer
    const layerMap = {
      roads: `
        SELECT osm_id, highway, name,
               ST_AsGeoJSON(way)::json AS geometry
          FROM planet_osm_line
         WHERE highway IS NOT NULL
      `,
      bridges: `
        SELECT osm_id, maxheight,
               ST_AsGeoJSON(way)::json AS geometry
          FROM planet_osm_line
         WHERE bridge = 'yes' AND maxheight IS NOT NULL
      `,
      weight_limits: `
        SELECT osm_id, maxweight,
               ST_AsGeoJSON(way)::json AS geometry
          FROM planet_osm_line
         WHERE maxweight IS NOT NULL
      `,
      weigh_stations: `
        -- Points tagged as weigh stations or lines tagged as weighbridges
        SELECT osm_id, COALESCE(name, 'Weigh Station') AS name,
               ST_AsGeoJSON(way)::json AS geometry
          FROM planet_osm_point
         WHERE amenity = 'weigh_station'
           OR highway = 'weighbridge'
        UNION
        SELECT osm_id, COALESCE(name, 'Weigh Station') AS name,
               ST_AsGeoJSON(way)::json AS geometry
          FROM planet_osm_line
         WHERE highway = 'weighbridge'
      `
    };

    if (!layerMap[layer]) {
      return res.status(404).json({ error: 'Unknown layer' });
    }

    const sql = `
      WITH data AS (${layerMap[layer]})
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', geometry,
            'properties', to_jsonb(data) - 'geometry'
          )
        )
      ) AS fc
      FROM data
      WHERE way && ST_MakeEnvelope($1, $2, $3, $4, 4326);
    `;

    const { rows } = await pool.query(sql, [minLon, minLat, maxLon, maxLat]);
    res.json(rows[0].fc);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`GeoJSON API listening on http://localhost:${PORT}`);
});
