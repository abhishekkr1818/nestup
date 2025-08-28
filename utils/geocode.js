// utils/geocode.js
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

async function geocodeLocation(location, country) {
  if (!location && !country) return null;

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: `${location}, ${country}`,
        limit: 1
      })
      .send();

    if (response.body.features.length === 0) {
      return null; // nothing found
    }

    return response.body.features[0].geometry;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return null;
  }
}

module.exports = geocodeLocation;
