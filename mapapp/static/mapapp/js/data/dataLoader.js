/**
 * dataLoader.js
 * Handles fetching shop data from Django (embedded JSON) and Overpass API.
 */

import { DataStore } from './dataStore.js'; // Import DataStore to pass it around

export { DataStore }; // Export DataStore so main.js can use it

/**
 * Retrieves initial Django shops data from the HTML script tag.
 * @returns {Array<Object>} An array of Django shop objects.
 */
export function getDjangoShopsData() {
    const djangoShopsDataElement = document.getElementById('coffeeShopsData');
    let djangoShops = [];
    if (djangoShopsDataElement) {
        djangoShops = JSON.parse(djangoShopsDataElement.textContent);
        // Add a 'type' property to Django shops for unified handling
        return djangoShops.map(shop => ({ ...shop, type: 'django' }));
    } else {
        console.error("Error: 'coffeeShopsData' element not found. Check if json_script tag is correctly rendered in map.html.");
        return [];
    }
}

/**
 * Fetches coffee shop data from the Overpass API.
 * @param {Array<string>} localShopNames - Names of local shops to avoid duplicates.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of OSM shop objects.
 */
export async function fetchOverpassCafes(localShopNames) {
    const geoLat = 33.778090545553816; // Georgia Tech area
    const geoLon = -84.39796380370487;
    const geoRadius = 20000; // 20 kilometers

    const query = `
    [out:json][timeout:25];
    (
    node["amenity"="cafe"](around:${geoRadius},${geoLat},${geoLon});
    );
    out body;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const overpassCafes = [];
        data.elements.forEach(el => {
            if (el.lat && el.lon && el.tags?.name) {
                const name = el.tags.name;
                const isDuplicate = localShopNames.includes(name.toLowerCase().trim());

                if (!isDuplicate) {
                    overpassCafes.push({
                        name: name,
                        tags: el.tags,
                        latitude: el.lat,
                        longitude: el.lon,
                        type: 'osm'
                    });
                }
            }
        });
        return overpassCafes;
    } catch (err) {
        console.error("Overpass API error:", err);
        return [];
    }
}