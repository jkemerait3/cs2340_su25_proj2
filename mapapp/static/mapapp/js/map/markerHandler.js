/**
 * markerHandler.js
 * Handles plotting shop markers on the Leaflet map and attaching click events.
 */

import { localIcon } from './mapInitializer.js'; // Assuming localIcon is still needed here
// No direct import of DataStore or PanelManager; they are passed as arguments to keep this module focused.

const markers = []; // To keep track of all markers if needed for later removal/management

/**
 * Plots Django (database) shop markers on the map.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {Array<Object>} shops - Array of Django shop data.
 * @param {L.Icon} icon - The custom icon for Django shops.
 * @param {PanelManager} panelManager - Instance of PanelManager to display shop details.
 * @param {DataStore} dataStore - Instance of DataStore to get shop data for details.
 */
export const markerHandler = {
    plotDjangoMarkers: function(map, shops, icon, panelManager, dataStore) {
        shops.forEach(shop => {
            const marker = L.marker([shop.latitude, shop.longitude], { icon: icon }).addTo(map);
            marker.bindPopup(`<b>${shop.name}</b><br>${shop.address}`);
            marker.on('click', () => {
                panelManager.displayShopDetails(shop, 'django', map, dataStore);
                map.panTo([shop.latitude, shop.longitude]);
            });
            markers.push(marker);
        });
    },

    /**
     * Plots Overpass (OSM) shop markers on the map.
     * @param {L.Map} map - The Leaflet map instance.
     * @param {Array<Object>} cafes - Array of Overpass cafe data.
     * @param {PanelManager} panelManager - Instance of PanelManager to display shop details.
     * @param {DataStore} dataStore - Instance of DataStore to get shop data for details.
     */
    plotOverpassMarkers: function(map, cafes, panelManager, dataStore) {
        cafes.forEach(cafe => {
            const marker = L.marker([cafe.latitude, cafe.longitude]).addTo(map); // Default marker for OSM
            marker.bindPopup(`<b>${cafe.name}</b><br><i>(OpenStreetMap)</i>`);
            marker.on('click', () => {
                panelManager.displayShopDetails(cafe, 'osm', map, dataStore);
                map.panTo([cafe.latitude, cafe.longitude]);
            });
            markers.push(marker);
        });
    },

    // You could add functions here to clear markers, update markers, etc.
};