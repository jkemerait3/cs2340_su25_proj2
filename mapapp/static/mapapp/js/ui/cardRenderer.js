/**
 * cardRenderer.js
 * Manages rendering shop cards and handling their click events, including bookmark toggling.
 */

import { getCookie } from '../utils/csrf.js'; // For bookmark form submission

export class CardRenderer {
    constructor(dataStore, panelManager) {
        this.dataStore = dataStore; // Inject DataStore to access shop data and update bookmarks
        this.panelManager = panelManager; // Inject PanelManager to display shop details
    }

    /**
     * Renders an initial batch of shop cards into a specified HTML container, clearing previous content.
     * @param {Array<Object>} shops - An array of shop data objects (Django or OSM).
     * @param {HTMLElement} container - The HTML element where the cards should be rendered.
     */
    renderInitialShopCards(shops, container) {
        container.innerHTML = ''; // Clear previous content
        this.appendShopCards(shops, container);
    }

    /**
     * Appends shop cards to a specified HTML container without clearing existing content.
     * @param {Array<Object>} shopsToAppend - An array of shop data objects to append.
     * @param {HTMLElement} container - The HTML element where the cards should be appended.
     */
    appendShopCards(shopsToAppend, container) {
        if (shopsToAppend.length === 0 && container.children.length === 0) {
            container.innerHTML = `<p class="text-muted p-3 text-center">No shops found.</p>`;
            return;
        }

        shopsToAppend.forEach(shop => {
            let cardHtml = '';
            const isBookmarked = shop.type === 'django' && this.dataStore.djangoShops.some(bShop => bShop.id === shop.id);

            if (shop.type === 'django') {
                cardHtml = `
                    <a href="#" class="text-decoration-none" data-shop-type="django" data-shop-id="${shop.id}" style="color: inherit;">
                        <div class="card mb-4 hover-scale" style="background-color: #B7A684; color: #2B1D14; height: 200px;">
                            <div class="row g-0 h-100">
                                <div class="col-auto d-flex align-items-center justify-content-center" style="padding: 10px;">
                                    ${shop.image ? `<img src="/media/${shop.image}" alt="${shop.name}" class="rounded" style="width: 160px; height: 160px; object-fit: contain;">` : '<div style="width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; background-color: #A09070; color: #2B1D14; font-size: 1.5rem; border-radius: 8px;">☕</div>'}
                                </div>
                                <div class="col d-flex">
                                    <div class="card-body d-flex flex-column justify-content-center w-100">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h5 class="card-title mb-0">${shop.name}</h5>
                                            ${shop.type === 'django' ? `
                                                <form method="post" action="/toggle_favorite/${shop.id}/" class="d-inline-block bookmark-form">
                                                    <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                                                    <button type="submit" style="border: none; background: none; padding: 0;">
                                                        <i class="bi bi-bookmark${isBookmarked ? '-fill' : ''}" style="font-size: 1.3rem; color: #ffc107;"></i>
                                                    </button>
                                                </form>
                                            ` : ''}
                                        </div>
                                        <p class="card-text mb-2"><small>${shop.address}</small></p>
                                        <div class="text-center">
                                            <span class="btn btn-sm btn-outline-dark me-2 hover-scale">View Shop</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            } else if (shop.type === 'osm') {
                const tags = shop.tags || {};
                const osmAddress = tags["addr:street"] ? `${tags["addr:street"]} ${tags["addr:housenumber"] || ""}` : "Address not available";
                cardHtml = `
                    <a href="#" class="text-decoration-none" data-shop-type="osm" data-shop-lat="${shop.latitude}" data-shop-lon="${shop.longitude}" style="color: inherit;">
                        <div class="card mb-4 hover-scale" style="background-color: #B7A684; color: #2B1D14; height: 200px;">
                            <div class="row g-0 h-100">
                                <div class="col-auto d-flex align-items-center justify-content-center" style="padding: 10px;">
                                    <div style="width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; background-color: #A09070; color: #2B1D14; font-size: 1.5rem; border-radius: 8px;">🌍</div>
                                </div>
                                <div class="col d-flex">
                                    <div class="card-body d-flex flex-column justify-content-center w-100">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h5 class="card-title mb-0">${shop.name}</h5>
                                        </div>
                                        <p class="card-text mb-2"><small>${osmAddress}</small></p>
                                        <div class="text-center">
                                            <span class="btn btn-sm btn-outline-dark me-2 hover-scale">View Shop</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        // Attach click listeners to the newly rendered shop cards (delegation)
        // Ensure only one listener is active per container
        container.removeEventListener('click', this.boundHandleShopCardClickDelegation);
        this.boundHandleShopCardClickDelegation = this.handleShopCardClickDelegation.bind(this);
        container.addEventListener('click', this.boundHandleShopCardClickDelegation);
    }

    /**
     * Event delegation handler for shop card clicks.
     * @param {Event} e - The click event.
     */
    handleShopCardClickDelegation(e) {
        // Handle shop details click
        const anchor = e.target.closest('a[data-shop-type]');
        if (anchor) {
            e.preventDefault();
            const shopType = anchor.dataset.shopType;
            let clickedShopData = null;

            if (shopType === 'django') {
                const shopId = parseInt(anchor.dataset.shopId);
                clickedShopData = this.dataStore.djangoShops.find(s => s.id === shopId) ||
                                  this.dataStore.allSearchableShops.find(s => s.type === 'django' && s.id === shopId);
            } else if (shopType === 'osm') {
                const lat = parseFloat(anchor.dataset.shopLat);
                const lon = parseFloat(anchor.dataset.shopLon);
                clickedShopData = this.dataStore.overpassCafes.find(s => s.latitude === lat && s.longitude === lon);
            }

            if (clickedShopData) {
                this.panelManager.displayShopDetails(clickedShopData, shopType);
                // Map panning is handled by markerHandler or main.js, so not needed here
            }
        }

        // Handle bookmark form submission
        const bookmarkForm = e.target.closest('.bookmark-form');
        if (bookmarkForm) {
            e.preventDefault();
            const form = bookmarkForm;
            const shopId = parseInt(form.action.split('/').slice(-2, -1)[0]);

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update the DataStore's djangoShops array
                    const isBookmarked = data.action === 'bookmarked';
                    const shopData = this.dataStore.allSearchableShops.find(s => s.type === 'django' && s.id === shopId);
                    this.dataStore.updateBookmarkStatus(shopId, isBookmarked, shopData);

                    // Re-render the affected lists to update bookmark icons
                    const allShopsTabPane = document.getElementById('all-shops-pane');
                    const bookmarkedShopsTabPane = document.getElementById('bookmarked-shops-pane');

                    if (allShopsTabPane.classList.contains('active') || document.getElementById('search-results-panel').style.display === 'block') {
                        // Re-filter and re-render the current view if 'All Shops' is active or search results are shown
                        // This implies the need for TabManager to handle re-rendering based on current search/tab
                        const currentQuery = document.getElementById('bookmarkSearchBar').value.trim();
                        // This creates a circular dependency if TabManager imports CardRenderer and vice-versa.
                        // The best way to break this is to have main.js coordinate the re-rendering,
                        // or pass a reference to the main app logic to CardRenderer/TabManager.
                        // For now, we will call a method on the TabManager if it exists.
                        if (this.panelManager.currentActiveTabId === 'all-shops-pane' && typeof this.tabManager?.filterAllShops === 'function') {
                            this.tabManager.filterAllShops(currentQuery); // Re-render 'All Shops' with updated bookmark status
                        } else if (typeof this.tabManager?.displayAllShopsTab === 'function') {
                             this.tabManager.displayAllShopsTab(); // Fallback if search isn't active
                        }
                    }
                    if (bookmarkedShopsTabPane.classList.contains('active') && typeof this.tabManager?.displayBookmarkedShopsTab === 'function') {
                        this.tabManager.displayBookmarkedShopsTab();
                    }
                } else {
                    console.error('Failed to toggle bookmark:', data.message);
                }
            })
            .catch(error => console.error('Error toggling bookmark:', error));
        }
    }

    // A setter method to inject TabManager into CardRenderer after both are instantiated in main.js
    setTabManager(tabManagerInstance) {
        this.tabManager = tabManagerInstance;
    }
}