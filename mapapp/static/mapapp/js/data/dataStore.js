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

    /**
     * Updates the bookmark status of a Django shop.
     * @param {number} shopId - The ID of the shop to update.
     * @param {boolean} isBookmarked - True if bookmarked, false if unbookmarked.
     * @param {Object} shopData - The full shop data if adding (toggling to true)
     */
    updateBookmarkStatus(shopId, isBookmarked, shopData = null) {
        if (isBookmarked) {
            // Add to djangoShops if not already present
            if (!this._djangoShops.some(s => s.id === shopId)) {
                const shopToAdd = shopData || this._allSearchableShops.find(s => s.type === 'django' && s.id === shopId);
                if (shopToAdd) {
                    this._djangoShops.push(shopToAdd);
                }
            }
        } else {
            // Remove from djangoShops
            this._djangoShops = this._djangoShops.filter(s => s.id !== shopId);
        }
    }
}