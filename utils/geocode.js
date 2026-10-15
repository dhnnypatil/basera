/**
 * Turns a place name ("Calangute, Goa, India") into map coordinates.
 *
 * Uses OpenStreetMap's free Nominatim service - no API key needed (the original project used Mapbox,
 * which needs a paid/registered token). If the lookup fails or times out we return null and the
 * listing is simply saved without a map, instead of the whole request crashing.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const TIMEOUT_MS = 5000;

async function geocode(placeName) {
    try {
        const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(placeName)}`;
        const response = await fetch(url, {
            headers: { "User-Agent": "Basera-College-Project/2.0" }, // required by Nominatim's usage policy
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) return null;

        const results = await response.json();
        if (results.length === 0) return null;

        const { lon, lat } = results[0];
        return { type: "Point", coordinates: [Number(lon), Number(lat)] };
    } catch (err) {
        console.warn(`Geocoding failed for "${placeName}": ${err.message}`);
        return null;
    }
}

module.exports = geocode;
