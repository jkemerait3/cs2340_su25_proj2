/**
 * main.js
 * This script initializes the Leaflet map and orchestrates the loading
 * and display of coffee shop data from various sources (Django, Overpass API).
 * It acts as the central hub, importing and calling functions from other modules.
 */

import { initializeMap, localIcon } from './map/mapInitializer.js';
import { getDjangoShopsData, fetchOverpassCafes, DataStore } from './data/dataLoader.js'; // DataStore is for managing shared data
import { debounce } from './utils/debounce.js';
import { PanelManager } from './ui/panelManager.js';
import { TabManager } from './ui/tabManager.js';
import { CardRenderer } from './ui/cardRenderer.js';
import { markerHandler } from './map/markerHandler.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the map
    const map = initializeMap();

    // Initialize global data store (this will hold djangoShops, overpassCafes, allSearchableShops)
    const dataStore = new DataStore();
    
    // Get DOM elements
    const bookmarkSearchBar = document.getElementById('bookmarkSearchBar');
    const backToActiveTabFromSearchBtn = document.getElementById('backToActiveTabFromSearchBtn');
    const allShopsTabBtn = document.getElementById('all-shops-tab');
    const allShopsTabPane = document.getElementById('all-shops-pane');

    // Initialize UI components
    const panelManager = new PanelManager(); // Handles showing/hiding main panels
    const cardRenderer = new CardRenderer(dataStore, panelManager); // Renders shop cards
    const tabManager = new TabManager(panelManager, cardRenderer, dataStore); // Manages tabs and their content

    // --- Data Loading ---
    // Load Django shops (these are your bookmarked shops)
    const initialDjangoShops = getDjangoShopsData();
    dataStore.setDjangoShops(initialDjangoShops);

    // Get Django shop names for duplicate checking
    const localShopNames = initialDjangoShops.map(shop => shop.name.toLowerCase().trim());

    // Fetch Overpass cafes
    const overpassData = await fetchOverpassCafes(localShopNames);
    dataStore.setOverpassCafes(overpassData);

    // Combine all data for general searching and "All Shops" tab
    dataStore.setAllSearchableShops([...dataStore.djangoShops, ...dataStore.overpassCafes]);

    // --- Plotting Markers on Map ---
    markerHandler.plotDjangoMarkers(map, dataStore.djangoShops, localIcon, panelManager, dataStore);
    markerHandler.plotOverpassMarkers(map, dataStore.overpassCafes, panelManager, dataStore);

    // --- Initial Map Fit ---
    if (dataStore.djangoShops.length > 0) {
        const bounds = new L.LatLngBounds(dataStore.djangoShops.map(shop => [shop.latitude, shop.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    // --- Event Listeners ---

    // Initial load for "All Shops" tab
    tabManager.displayAllShopsTab();

    // Debounced search input handler
    const debouncedFilter = debounce((value) => {
        tabManager.filterAllShops(value);
    }, 300);

    if (bookmarkSearchBar) {
        bookmarkSearchBar.addEventListener('input', (event) => {
            debouncedFilter(event.target.value);
        });
    }

    // Infinite scroll for 'All Shops' tab
    if (allShopsTabPane) {
        allShopsTabPane.addEventListener('scroll', debounce(() => {
            const { scrollTop, scrollHeight, clientHeight } = allShopsTabPane;
            if (scrollTop + clientHeight >= scrollHeight - 50) { // 50px threshold from bottom
                tabManager.loadMoreAllShops();
            }
        }, 100));
    }

    // Tab button click listeners (delegated to TabManager)
    if (allShopsTabBtn) {
        allShopsTabBtn.addEventListener('click', () => tabManager.displayAllShopsTab());
    }
    if (document.getElementById('bookmarked-shops-tab')) {
        document.getElementById('bookmarked-shops-tab').addEventListener('click', () => tabManager.displayBookmarkedShopsTab());
    }

    // Back button from search results
    if (backToActiveTabFromSearchBtn) {
        backToActiveTabFromSearchBtn.addEventListener('click', function() {
            if (bookmarkSearchBar) bookmarkSearchBar.value = ''; // Clear search bar
            tabManager.filterAllShops(''); // This will reset to showing the active tab
        });
    }
});