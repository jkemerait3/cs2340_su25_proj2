/**
 * panelManager.js
 * Manages the visibility and content of the sidebar panels (shop details, search results, tab content).
 */

import { getCookie } from '../utils/csrf.js'; // For bookmark form submission
import { markerHandler } from '../map/markerHandler.js';

export class PanelManager {
    constructor() {
        this.shopTabContent = document.getElementById('shopTabContent');
        this.shopDetailsPanel = document.getElementById('shop-details');
        this.searchResultsPanel = document.getElementById('search-results-panel');
        this.bookmarkSearchBar = document.getElementById('bookmarkSearchBar');
        // This will be set by TabManager to know which tab to return to
        this.currentActiveTabId = 'all-shops-pane'; // Default

        this.backBtnListenerAttached = false; // Flag to prevent duplicate listeners
    }

    /**
     * Sets the currently active tab ID.
     * @param {string} tabId - The ID of the currently active tab pane.
     */
    setCurrentActiveTabId(tabId) {
        this.currentActiveTabId = tabId;
    }

    /**
     * Hides all main content panels.
     */
    hideAllPanels() {
        if (this.shopTabContent) this.shopTabContent.style.display = 'none';
        if (this.shopDetailsPanel) this.shopDetailsPanel.style.display = 'none';
        if (this.searchResultsPanel) this.searchResultsPanel.style.display = 'none';
    }

    /**
     * Displays the shop details panel with the given shop data.
     * @param {Object} shopData - The data of the shop to display.
     * @param {'django'|'osm'} source - The source of the shop data ('django' or 'osm').
     * @param {L.Map} map - The Leaflet map instance (needed for back button context).
     * @param {DataStore} dataStore - The DataStore instance (needed for back button context).
     */
    displayShopDetails(shopData, source, map, dataStore) {
        this.hideAllPanels();
        if (this.shopDetailsPanel) {
            this.shopDetailsPanel.style.display = 'block';

            let detailsContentHtml = '';
            if (source === 'django') {
                detailsContentHtml = `
                    <h5 class="text-warning">${shopData.name}</h5>
                    ${shopData.image ? `<img src="/media/${shopData.image}" alt="${shopData.name}" class="img-fluid mb-2 rounded" style="max-height: 180px; object-fit: cover;">` : ""}
                    
                    <p class="card-text mb-1">📍 ${shopData.address}</p>
                    ${shopData.amenities ? `<p class="card-text mb-1"><strong>Amenities:</strong> ${shopData.amenities}</p>` : ""}
                    ${shopData.hours ? `<p class="card-text mb-3">🕒 <strong>Hours:</strong> ${shopData.hours}</p>` : ""}
                    <div class="text-center">
                        <a href="/shops/${shopData.id}/" class="btn btn-sm btn-outline-light me-2 hover-scale" style="color: #EDE8D0; border-color: #EDE8D0;">View Shop Page</a>
                    </div>
                `;
            } else if (source === 'osm') {
                const tags = shopData.tags || {};
                detailsContentHtml = `
                    <h5 class="text-warning">${shopData.name}</h5>
                    
                    ${tags["addr:street"] ? `<p class="card-text mb-1">📍 ${tags["addr:street"]} ${tags["addr:housenumber"] || ""}</p>` : ""}
                    ${tags["opening_hours"] ? `<p class="card-text mb-1">🕒 <strong>Hours:</strong> ${tags["opening_hours"]}</p>` : ""}
                    ${tags["internet_access"] ? `<p class="card-text mb-1">📶 <strong>Wi-Fi:</strong> ${tags["internet_access"]}</p>` : ""}
                    ${tags["wheelchair"] ? `<p class="card-text mb-1">♿ <strong>Wheelchair Access:</strong> ${tags["wheelchair"]}</p>` : ""}
                    ${tags["website"] ? `<p class="card-text mb-1">🔗 <a href="${tags["website"]}" target="_blank">Website</a></p>` : ""}
                    ${tags["phone"] ? `<p class="card-text mb-3">📞 <strong>${tags["phone"]}</strong></p>` : ""}
                `;
            }

            detailsContentHtml += `
                <hr style="border-top: 1px solid rgba(255, 255, 255, 0.2);">
                <button id="backFromDetailsBtn" class="btn btn-sm btn-outline-light mt-2" style="color: #EDE8D0; border-color: #EDE8D0;">
                    <i class="bi bi-arrow-left"></i> Back
                </button>
            `;

            const fullCardHtml = `
                <div class="card mb-4 rounded" style="background-color: #B7A684; color: #2B1D14; padding: 20px;">
                    ${detailsContentHtml}
                </div>
            `;
            this.shopDetailsPanel.innerHTML = fullCardHtml;
            
            //Back button
            const backBtn = document.getElementById('backFromDetailsBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.hideShopDetails(map, dataStore); // Pass map and dataStore to the function
                    });
            }
        }
    }

    /**
     * Hides the shop details panel and returns to the appropriate view (search results or active tab).
     * @param {L.Map} map - The Leaflet map instance.
     * @param {DataStore} dataStore - The DataStore instance.
     */
    hideShopDetails(map, dataStore) {
        if (this.shopDetailsPanel) this.shopDetailsPanel.style.display = 'none';

        if (this.bookmarkSearchBar && this.bookmarkSearchBar.value.trim() !== '') {
            if (this.searchResultsPanel) this.searchResultsPanel.style.display = 'block';
        } else {
            if (this.shopTabContent) this.shopTabContent.style.display = 'block';
            // Ensure the correct tab pane is visible
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            const activePane = document.getElementById(this.currentActiveTabId);
            if (activePane) {
                activePane.classList.add('show', 'active');
            }
        }
    }

    /**
     * Displays the search results panel.
     */
    showSearchResultsPanel() {
        this.hideAllPanels();
        if (this.searchResultsPanel) {
            this.searchResultsPanel.style.display = 'block';
        }
    }

    /**
     * Displays the main tab content panel.
     */
    showTabContentPanel() {
        this.hideAllPanels();
        if (this.shopTabContent) {
            this.shopTabContent.style.display = 'block';
        }
    }
    /**
     * Displays a list of shops that match the selected filters in the search results panel.
     * @param {Array<Object>} filteredShops - The list of filtered shops to show.
     * @param {L.Map} map - The Leaflet map instance to update markers on.
     * @param {DataStore} dataStore - The shared DataStore instance.
     * @param {L.Icon} localIcon - The icon for Django shops.
     * @param {Object} urlRouter - The router for URL navigation (hash updates).
     */
    displayFilteredResults(filteredShops, map, dataStore, localIcon, urlRouter) {
        const panelManager = this;
        this.hideAllPanels();
        const resultsPanel = document.getElementById('search-results-panel');
        const resultsList = document.getElementById('search-results-list');
        if (!resultsPanel || !resultsList) return;
        
        markerHandler.clearAllMarkers(map);
        resultsList.innerHTML = '';
    
        // Clear existing results
        if (filteredShops.length === 0) {
            resultsList.innerHTML = '<p class="text-muted text-center">No shops match your selected filters.</p>';
        } else {
            filteredShops.forEach(shop => {
                const isDjango = shop.type === 'django';
                const card = document.createElement('div');
                card.className = 'card mb-3 hover-scale';
                card.style.backgroundColor = '#B7A684';
                card.style.color = '#2B1D14';
                let contentHtml = `
                    <div class="card-body">
                        <h5 class="card-title">${shop.name}</h5>
                        ${shop.address ? `<p class="card-text"><small>${shop.address}</small></p>` : ''}
                        ${shop.hours ? `<p class="card-text"><small><strong>Hours:</strong> ${shop.hours}</small></p>` : ''}
                        ${shop.amenities ? `<p class="card-text"><small><strong>Amenities:</strong> ${
                            Array.isArray(shop.amenities) ? shop.amenities.join(', ') : shop.amenities
                        }</small></p>` : ''}
                        <div class="text-center">
                            <button type="button" class="btn btn-sm btn-outline-dark mt-2 view-shop-details-btn" data-shop-id="${shop.id}" data-shop-source="${isDjango ? 'django' : 'osm'}">
                                View Shop Details
                            </button>
                        </div>
                    </div>
                `;
                card.innerHTML = contentHtml;
                resultsList.appendChild(card);
            });
            // Reattach event listeners for details buttons
            resultsList.querySelectorAll('.view-shop-details-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-shop-id');
                    const source = button.getAttribute('data-shop-source');
                    const targetShop = filteredShops.find(s => String(s.id) === id);
                    if (targetShop) {
                        this.displayShopDetails(targetShop, source, map, dataStore);
                    }
                    map.setView([targetShop.latitude, targetShop.longitude], 25);
                });
            });

            const djangoShops = filteredShops.filter(s => s.type === 'django');
            const osmShops = filteredShops.filter(s => s.type === 'osm');
            markerHandler.plotDjangoMarkers(map, djangoShops, panelManager, dataStore, urlRouter);
            markerHandler.plotOverpassMarkers(map, osmShops, panelManager, dataStore, urlRouter);
        }

        resultsPanel.style.display = 'block';
    }
    /**
     * Displays filtered results in the "All Shops" tab.
     */
    displayAllShops(filteredShops, map, dataStore, localIcon, urlRouter) {
        const list = document.getElementById('all-shops-list');
        if (!list) return;

        list.innerHTML = ''; // Clear existing

        filteredShops
            .filter(s => s.type === 'django')
            .forEach(shop => {
                const card = this._createShopCard(shop, 'django'); // helper method below
                list.appendChild(card);
            });

        markerHandler.clearAllMarkers(map);
        markerHandler.plotDjangoMarkers(map, filteredShops, this, dataStore, urlRouter);

        this.shopTabContent.style.display = 'block';
        document.getElementById('all-shops-pane').classList.add('show', 'active');
        document.getElementById('bookmarked-shops-pane').classList.remove('show', 'active');
    }

    /**
     * Displays filtered results in the "Bookmarked Shops" tab.
     */
    displayBookmarkedShops(filteredShops) {
        const list = document.getElementById('bookmarked-shops-list');
        if (!list) return;

        list.innerHTML = '';

        filteredShops.forEach(shop => {
            const card = this._createShopCard(shop, 'django');
            list.appendChild(card);
        });

        this.shopTabContent.style.display = 'block';
        document.getElementById('bookmarked-shops-pane').classList.add('show', 'active');
        document.getElementById('all-shops-pane').classList.remove('show', 'active');
    }

}