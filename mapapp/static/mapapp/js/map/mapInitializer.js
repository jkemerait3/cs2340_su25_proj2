/**
 * mapInitializer.js
 * Initializes the Leaflet map and defines custom marker icons.
 */

// Custom Marker Icon
export const localIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

/**
 * Initializes the Leaflet map with a default view and CartoDB Voyager tile layer.
 * @returns {L.Map} The initialized Leaflet map instance.
 */
export function initializeMap() {
    const map = L.map('map').setView([33.778090545553816, -84.39796380370487], 15);

    // Changed from light_all to voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20 // Voyager supports up to zoom 20, slightly higher than some other CartoDB styles
    }).addTo(map);

    return map;
}