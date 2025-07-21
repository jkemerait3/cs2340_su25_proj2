/**
 * markerHandler.js
 * Handles plotting shop markers on the Leaflet map and attaching click events.
 */

import { localIcon } from './mapInitializer.js'; // Assuming localIcon is still needed here
// No direct import of DataStore or PanelManager; they are passed as arguments to keep this module focused.

const markers = []; // To keep track of all markers if needed for later removal/management
const markerMap = new Map(); // key: 'lat,lng'

/**
 * Plots Django (database) shop markers on the map.
 * @param {L.Map} map - The Leaflet map instance.
 * @param {Array<Object>} shops - Array of Django shop data.
 * @param {L.Icon} icon - The custom icon for Django shops.
 * @param {PanelManager} panelManager - Instance of PanelManager to display shop details.
 * @param {DataStore} dataStore - Instance of DataStore to get shop data for details.
 */
export const markerHandler = {
    plotDjangoMarkers: function(map, shops, panelManager, dataStore, urlRouter) {
        shops.forEach(shop => {
            if (!map) {
                console.warn("Map is undefined when plotting markers.");
            return;
            }

            const latLngKey = `${shop.latitude},${shop.longitude}`;
            const marker = L.marker([shop.latitude, shop.longitude], { icon: localIcon }).addTo(map);
            marker.bindPopup(`<b>${shop.name}</b><br>${shop.address}`);
            marker.on('click', () => {
                panelManager.displayShopDetails(shop, 'django', map, dataStore);
                map.panTo([shop.latitude, shop.longitude]);
                urlRouter.navigateToShop(shop, 'hash');
            });
            markerMap.set(latLngKey, marker);
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
    plotOverpassMarkers: function(map, cafes, panelManager, dataStore, urlRouter) {
    cafes.forEach(cafe => {
        const latLngKey = `${cafe.latitude},${cafe.longitude}`;
        const marker = L.marker([cafe.latitude, cafe.longitude], {icon: localIcon}).addTo(map);
        marker.bindPopup(`<b>${cafe.name}</b><br><i></i>`);
        marker.on('click', () => {
            panelManager.displayShopDetails(cafe, 'osm', map, dataStore);
            map.panTo([cafe.latitude, cafe.longitude]);
            urlRouter.navigateToShop(cafe, 'hash');
        });
        markerMap.set(latLngKey, marker);
        markers.push(marker);
        });
    },

    getMarkerForShop: function(shop) {
        if (shop.latitude != null && shop.longitude != null) {
            return markerMap.get(`${shop.latitude},${shop.longitude}`);
        }
        return null;
    },

    clearAllMarkers: function(map) {
        markers.forEach(marker => {
            if (map && marker) {
                map.removeLayer(marker);
            }
        });
        markers.length = 0;
        markerMap.clear();
    }

};