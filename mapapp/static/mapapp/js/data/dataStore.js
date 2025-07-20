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
    /**
     * Filters shops based on provided criteria (amenities, hours, etc).
     * @param {Object} filters - Object with boolean flags and time info
     * @returns {Array} - Array of shops that match all selected filters
     */
    filterShops(filters) {
        const normalizeAmenities = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value.map(v => v.toLowerCase().trim());
            if (typeof value === 'string') {
                return value
                    .split(/[,;]/)
                    .map(str => str.toLowerCase().trim())
                    .filter(Boolean);
            }
            return [];
        };

        const matchesAmenities = (shop) => {
            const amenities = normalizeAmenities(shop.amenities);
            if (filters.wifi && !amenities?.includes('wifi')) return false;
            if (filters.outlets && !amenities?.includes('outlets')) return false;
            if (filters.parking && !amenities?.includes('parking')) return false;
            if (filters.long_hours && !this._hasLongHours(shop)) return false;
            return true;
        };

        const matchesTime = (shop) => {
            if (!filters.openNow && !filters.time) return true;

            const now = new Date();
            const hour = filters.openNow ? now.getHours() : this._convertTo24Hour(filters.time);
            const minute = filters.openNow ? now.getMinutes() : parseInt(filters.time.minute, 10);
            const timeToCheck = hour * 60 + minute;

            const openMinutes = this._parseOpeningHours(shop.hours);
            return openMinutes && openMinutes.open <= timeToCheck && openMinutes.close >= timeToCheck;
        };

        return [...this._djangoShops, ...this._overpassCafes].filter(shop =>
            matchesAmenities(shop) && matchesTime(shop)
        );
    }

    _hasLongHours(shop) {
        const hours = this._parseOpeningHours(shop.hours);
        if (!hours) return false;
        const close = hours.close;
        return close >= 20 * 60; // after 8 PM
    }

    _convertTo24Hour(time) {
        let hour = parseInt(time.hour, 10);
        if (time.ampm === 'PM' && hour !== 12) hour += 12;
        if (time.ampm === 'AM' && hour === 12) hour = 0;
        return hour;
    }

    _parseOpeningHours(hoursString) {
        if (!hoursString) return null;

        // Format: "7am-10pm"
        const match12 = hoursString.match(/(\d{1,2})(am|pm)\s*[-–]\s*(\d{1,2})(am|pm)/i);

        if (match12) {
            const [ , startH, startP, endH, endP ] = match12;
            const start = this._to24Hour(parseInt(startH), startP.toUpperCase());
            const end = this._to24Hour(parseInt(endH), endP.toUpperCase());
            return { open: start * 60, close: end * 60 };
        }

        // Format: "08:00-17:00"
        const match24 = hoursString.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
        if (match24) {
            const [ , h1, m1, h2, m2 ] = match24.map(Number);
            return { open: h1 * 60 + m1, close: h2 * 60 + m2 };
        }

        // Fallback: extract first time range from OSM-style "Mo-Th 08:00-17:00; Fr 08:00-18:00"
        const firstRange = hoursString.split(';')[0];
        const matchOsm = firstRange.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
        if (matchOsm) {
            const [ , h1, m1, h2, m2 ] = matchOsm.map(Number);
            return { open: h1 * 60 + m1, close: h2 * 60 + m2 };
        }

        return null;
    }
    _to24Hour(hour, ampm) {
        if (ampm === 'PM' && hour !== 12) return hour + 12;
        if (ampm === 'AM' && hour === 12) return 0;
        return hour;
    }
}