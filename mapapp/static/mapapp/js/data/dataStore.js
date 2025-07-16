/**
 * dataStore.js
 * Manages the application's core data: Django shops, Overpass cafes, and combined searchable shops.
 * This class provides a centralized way to access and update data across modules.
 */

export class DataStore {
    constructor() {
        this._djangoShops = [];
        this._overpassCafes = [];
        this._allSearchableShops = [];
        this._bookmarkedShops = [];
    }

    get djangoShops() {
        return this._djangoShops;
    }

    setDjangoShops(shops) {
        this._djangoShops = shops;
    }

    get overpassCafes() {
        return this._overpassCafes;
    }

    setOverpassCafes(cafes) {
        this._overpassCafes = cafes;
    }

    get allSearchableShops() {
        return this._allSearchableShops;
    }

    setAllSearchableShops(shops) {
        this._allSearchableShops = shops;
    }

    get bookmarkedShops() {
        return this._bookmarkedShops;
    }

    setBookmarkedShops(shops) {
        this._bookmarkedShops = shops;
    }

    /**
     * Updates the bookmark status of a Django shop.
     * @param {number} shopId - The ID of the shop to update.
     * @param {boolean} isBookmarked - True if bookmarked, false if unbookmarked.
     * @param {Object} shopData - The full shop data if adding (toggling to true)
     */
    updateBookmarkStatus(shopId, isBookmarked, shopData = null) {
        if (isBookmarked) {
            // Add to djangoShops if not already present
            if (!this._bookmarkedShops.some(s => s.id === shopId)) {
                const shopToAdd = shopData || this._allSearchableShops.find(s => s.type === 'django' && s.id === shopId);
                if (shopToAdd) {
                    this._bookmarkedShops.push(shopToAdd);
                }
            }
        } else {
            // Remove from djangoShops
            this._bookmarkedShops = this._bookmarkedShops.filter(s => s.id !== shopId);
        }
    }
}