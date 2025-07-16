/**
 * @file tabManager.js
 * @brief Manages the logic for switching between "All Shops" and "Bookmarked Shops" tabs,
 * handling content display (including infinite scrolling for "All Shops"),
 * and integrating with search functionality.
 */

import { debounce } from '../utils/debounce.js';

export class TabManager {
    /**
     * @brief Constructs a new TabManager instance.
     * @param {PanelManager} panelManager - An instance of PanelManager to control overall panel visibility.
     * @param {CardRenderer} cardRenderer - An instance of CardRenderer to render shop cards.
     * @param {DataStore} dataStore - An instance of DataStore containing shop data.
     */
    constructor(panelManager, cardRenderer, dataStore) {
        this.panelManager = panelManager;
        this.cardRenderer = cardRenderer;
        this.dataStore = dataStore;

        // DOM elements for tab panes and lists
        this.allShopsTabPane = document.getElementById('all-shops-pane');
        this.allShopsList = document.getElementById('all-shops-list');
        this.bookmarkedShopsTabPane = document.getElementById('bookmarked-shops-pane');
        this.bookmarkedShopsList = document.getElementById('bookmarked-shops-list');

        // DOM elements for tab buttons
        this.allShopsTabBtn = document.getElementById('all-shops-tab');
        this.bookmarkedShopsTabBtn = document.getElementById('bookmarked-shops-tab');

        // DOM elements for search and detail panels
        this.bookmarkSearchBar = document.getElementById('bookmarkSearchBar');
        this.searchResultsPanel = document.getElementById('search-results-panel');
        this.shopDetailsPanel = document.getElementById('shop-details');
        this.shopTabContent = document.getElementById('shopTabContent'); // Main wrapper for tab content

        // Pagination and filtering state for 'All Shops' tab
        this.shopsPerPage = 10;
        this.currentPage = 1;
        this.allShopsFilteredForScroll = [];

        // Initialize event listeners
        this._setupEventListeners();
    }

    /**
     * @brief Manages the 'active' class on tab buttons to control their visual state via CSS.
     * Removes 'active' from all tab buttons, then adds it to the specified button.
     * @param {HTMLElement | null} tabToActivate - The tab button to activate, or `null` to deactivate all.
     */
    _activateTabButton(tabToActivate) {
        // Deactivate all tab buttons first
        this.allShopsTabBtn.classList.remove('active');
        this.bookmarkedShopsTabBtn.classList.remove('active');

        // Activate the specified tab button if provided
        if (tabToActivate) {
            tabToActivate.classList.add('active');
        }
    }

    /**
     * @brief Sets up all necessary event listeners for tab switching, infinite scrolling,
     * and search bar input.
     */
    _setupEventListeners() {
        // Tab click listeners
        this.allShopsTabBtn.addEventListener('click', () => this.displayAllShopsTab());
        this.bookmarkedShopsTabBtn.addEventListener('click', () => this.displayBookmarkedShopsTab());

        // Infinite scroll listener for 'All Shops' tab pane
        // Uses debounce to limit how often the scroll event handler fires.
        this.allShopsTabPane.addEventListener('scroll', debounce(() => {
            // Check if the user has scrolled to the bottom (within 5 pixels tolerance)
            if (this.allShopsTabPane.scrollTop + this.allShopsTabPane.clientHeight >= this.allShopsTabPane.scrollHeight - 5) {
                this.loadMoreAllShops();
            }
        }, 100)); // Debounce for 100ms

        // Search bar input listener
        // Uses debounce to delay search execution until the user pauses typing.
        this.bookmarkSearchBar.addEventListener('input', debounce((e) => {
            this.filterAllShops(e.target.value);
        }, 300)); // Debounce for 300ms

        // Back button from search results/shop details to active tab
        const backButton = document.getElementById('backToActiveTabFromSearchBtn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                // Return to the last active tab based on what panelManager tracks
                if (this.panelManager.currentActiveTabId === 'bookmarked-shops-pane') {
                    this.displayBookmarkedShopsTab();
                } else {
                    this.displayAllShopsTab(); // Default to All Shops if currentActiveTabId is not set or is 'all-shops-pane'
                }
            });
        }
    }

    /**
     * @brief Displays the "All Shops" tab content.
     * Hides other panels, activates the 'All Shops' tab button, sorts shops,
     * renders the initial batch, and resets scroll position.
     */
    displayAllShopsTab() {
        this.panelManager.setCurrentActiveTabId('all-shops-pane');
        this.panelManager.showTabContentPanel(); // Use panelManager to show the main tab content wrapper

        // Ensure only the 'All Shops' tab pane is active for Bootstrap's tab logic
        this.allShopsTabPane.classList.add('show', 'active');
        this.bookmarkedShopsTabPane.classList.remove('show', 'active');

        // Update tab button visual state
        this._activateTabButton(this.allShopsTabBtn);

        // Sort all searchable shops alphabetically by name
        this.allShopsFilteredForScroll = [...this.dataStore.allSearchableShops].sort((a, b) => {
            const nameA = a.name || (a.tags ? a.tags.name : ''); // Handle cases where 'name' might be missing, use tags.name as fallback
            const nameB = b.name || (b.tags ? b.tags.name : '');
            return nameA.localeCompare(nameB);
        });

        this.currentPage = 1; // Reset pagination
        const initialBatch = this.allShopsFilteredForScroll.slice(0, this.shopsPerPage);
        this.cardRenderer.renderInitialShopCards(initialBatch, this.allShopsList);
        this.allShopsTabPane.scrollTop = 0; // Scroll to top of the pane

        // Hide loading message once content is loaded (if present)
        const loadingMessage = document.getElementById('all-shops-loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }

    /**
     * @brief Displays the "Bookmarked Shops" tab content.
     * Hides other panels, activates the 'Bookmarked Shops' tab button,
     * sorts bookmarked shops, and renders them.
     */
    displayBookmarkedShopsTab() {
    this.panelManager.setCurrentActiveTabId('bookmarked-shops-pane');
    this.panelManager.showTabContentPanel(); // Use panelManager to show the main tab content wrapper

    // Ensure only the 'Bookmarked Shops' tab pane is active for Bootstrap's tab logic
    this.bookmarkedShopsTabPane.classList.add('show', 'active');
    this.allShopsTabPane.classList.remove('show', 'active');

    // Update tab button visual state
    this._activateTabButton(this.bookmarkedShopsTabBtn);

    // ✅ Clear previous cards before re-rendering
    this.bookmarkedShopsList.innerHTML = '';

    // Sort bookmarked shops alphabetically by name
    const sortedBookmarks = [...this.dataStore.bookmarkedShops].sort((a, b) => {
        return a.name.localeCompare(b.name);
    });

    this.cardRenderer.renderInitialShopCards(sortedBookmarks, this.bookmarkedShopsList);
    this.bookmarkedShopsTabPane.scrollTop = 0; // Scroll to top of the pane
}

    /**
     * @brief Loads additional shops for infinite scrolling within the "All Shops" tab.
     * Appends the next batch of shops to the list.
     */
    loadMoreAllShops() {
        const startIndex = this.currentPage * this.shopsPerPage;
        const endIndex = startIndex + this.shopsPerPage;

        if (startIndex < this.allShopsFilteredForScroll.length) {
            const nextBatch = this.allShopsFilteredForScroll.slice(startIndex, endIndex);
            this.cardRenderer.appendShopCards(nextBatch, this.allShopsList);
            this.currentPage++;
        }
    }

    /**
     * @brief Filters all available shops based on the provided search query.
     * Displays results in the dedicated search results panel, hiding other tab content.
     * If the query is empty, it reverts to showing the last active tab.
     * @param {string} query - The search string entered by the user.
     */
    filterAllShops(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        const searchResultsList = document.getElementById('search-results-list');

        if (lowerCaseQuery === '') {
            // If the search query is empty, hide search results and shop details,
            // and display the last active tab content.
            this.panelManager.showTabContentPanel();

            // Explicitly ensure Bootstrap's tab visibility classes are correctly set
            // for the previously active tab pane.
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
            if (this.panelManager.currentActiveTabId === 'all-shops-pane') {
                document.getElementById('all-shops-pane').classList.add('show', 'active');
                this._activateTabButton(this.allShopsTabBtn);
            } else if (this.panelManager.currentActiveTabId === 'bookmarked-shops-pane') {
                document.getElementById('bookmarked-shops-pane').classList.add('show', 'active');
                this._activateTabButton(this.bookmarkedShopsTabBtn);
            } else {
                // Fallback: If no currentActiveTabId, default to All Shops
                document.getElementById('all-shops-pane').classList.add('show', 'active');
                this._activateTabButton(this.allShopsTabBtn);
                this.panelManager.setCurrentActiveTabId('all-shops-pane');
            }

        } else {
            // If there's a search query, show the search results panel and hide other content.
            this.panelManager.showSearchResultsPanel();

            // Deactivate both main tab buttons when search results are showing
            this._activateTabButton(null);

            // Filter shops based *only* on the shop's name
            const filtered = this.dataStore.allSearchableShops.filter(shop => {
                // Safely get the shop name, considering 'name' property first, then 'tags.name'
                const shopName = shop.name || (shop.tags ? shop.tags.name : '');
                return shopName.toLowerCase().includes(lowerCaseQuery);
            });

            // Sort filtered results alphabetically
            filtered.sort((a, b) => {
                const nameA = a.name || (a.tags ? a.tags.name : '');
                const nameB = b.name || (b.tags ? b.tags.name : '');
                return nameA.localeCompare(nameB);
            });

            this.cardRenderer.renderInitialShopCards(filtered, searchResultsList);
            this.searchResultsPanel.scrollTop = 0; // Scroll to top of search results panel
        }
    }
}