/**
 * @file urlRouter.js
 * @brief Handles routing logic using hash (#Name/@lat,lng) or query (?shop=Name/@lat,lng).
 */

export class UrlRouter {
    constructor() {
        this._listeners = {
            shopSelected: [],
        };
    }

    /**
     * Registers a callback to be run when a shop is selected via URL.
     * @param {(shop: { name: string, lat: number, lng: number }) => void} callback
     */
    onShopSelected(callback) {
        this._listeners.shopSelected.push(callback);
    }

    _emit(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(data));
        }
    }

    /**
     * Handle current hash or query string on page load.
     */
    handleInitialLoad() {
        const shopData = this._getShopDataFromUrl();
        if (shopData) this._emit('shopSelected', shopData);
    }

    /**
     * Listen to hash or popstate changes.
     */
    startListening() {
        window.addEventListener('hashchange', () => {
            const shopData = this._getShopDataFromUrl();
            if (shopData) this._emit('shopSelected', shopData);
        });

        window.addEventListener('popstate', () => {
            const shopData = this._getShopDataFromUrl();
            if (shopData) this._emit('shopSelected', shopData);
        });
    }

    /**
     * Change the URL to reflect selected shop.
     * @param {Object} shop - Shop object with name, latitude, longitude
     * @param {'hash'|'query'} format
     */
    navigateToShop(shop, format = 'hash') {
        const nameSlug = shop.name.trim().replace(/\s+/g, '+');
        const lat = parseFloat(shop.latitude).toFixed(5);
        const lng = parseFloat(shop.longitude).toFixed(5);

        const urlFragment = `${nameSlug}/@${lat},${lng}`;

        if (format === 'hash') {
            window.location.hash = urlFragment;
        } else {
            const url = new URL(window.location);
            url.searchParams.set('shop', urlFragment);
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Extract shop name and coordinates from the hash or query string.
     * @returns {{ name: string, lat: number, lng: number } | null}
     */
    _getShopDataFromUrl() {
        let raw = '';
        if (location.hash) {
            raw = decodeURIComponent(location.hash.slice(1));
        } else {
            const query = new URLSearchParams(location.search);
            raw = query.get('shop') || '';
        }

        // Expected format: Name+With+Spaces/@lat,lng
        const match = raw.match(/^(.+?)\/@([0-9.-]+),([0-9.-]+)$/);
        if (!match) return null;

        const name = match[1].replace(/\+/g, ' ').trim();
        const lat = parseFloat(match[2]);
        const lng = parseFloat(match[3]);

        if (isNaN(lat) || isNaN(lng)) return null;

        return { name, lat, lng };
    }
}
