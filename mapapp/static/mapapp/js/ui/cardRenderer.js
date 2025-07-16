import { getCookie } from '../utils/csrf.js';

export class CardRenderer {
    constructor(dataStore, panelManager, map, urlRouter) {
        this.dataStore = dataStore;
        this.panelManager = panelManager;
        this.map = map;
        this.urlRouter = urlRouter
    }

    renderInitialShopCards(shops, container) {
        container.innerHTML = '';
        this.appendShopCards(shops, container);
    }

    appendShopCards(shopsToAppend, container) {
        if (shopsToAppend.length === 0 && container.children.length === 0) {
            container.innerHTML = `<p class="text-muted p-3 text-center">No shops found.</p>`;
            return;
        }

        shopsToAppend.forEach(shop => {
            let cardHtml = '';
            const shopType = shop.type || (shop.tags ? 'osm' : 'django');

            const name = shop.name || (shop.tags?.name ?? 'Unnamed Cafe');
            const isBookmarked = shopType === 'django' && this.dataStore.djangoShops.some(b => b.id === shop.id);

            // Handle shop address fallbacks
            const address = shopType === 'django'
                ? (shop.address || 'Address not available')
                : (
                    shop.tags?.["addr:street"]
                        ? `${shop.tags["addr:street"]} ${shop.tags["addr:housenumber"] || ""}`.trim()
                        : "Address not available"
                );

            const imageHtml = shopType === 'django'
                ? (
                    shop.image
                        ? `<img src="/media/${shop.image}" alt="${name}" class="rounded" style="width: 160px; height: 160px; object-fit: contain;">`
                        : '<div style="width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; background-color: #A09070; color: #2B1D14; font-size: 1.5rem; border-radius: 8px;">☕</div>'
                )
                : '<div style="width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; background-color: #A09070; color: #2B1D14; font-size: 1.5rem; border-radius: 8px;">🌍</div>';

            const bookmarkHtml = shopType === 'django'
                ? `
                    <form method="post" action="/toggle_favorite/${shop.id}/" class="d-inline-block bookmark-form">
                        <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                        <button type="submit" style="border: none; background: none; padding: 0;">
                            <i class="bi bi-bookmark${isBookmarked ? '-fill' : ''}" style="font-size: 1.3rem; color: #ffc107;"></i>
                        </button>
                    </form>
                `
                : '';

            // Generate card HTML
            cardHtml = `
                <a href="#" class="text-decoration-none" data-shop-type="${shopType}"
                   ${shopType === 'django' ? `data-shop-id="${shop.id}"` : `data-shop-lat="${shop.latitude}" data-shop-lon="${shop.longitude}"`}
                   style="color: inherit;">
                    <div class="card mb-4 hover-scale" style="background-color: #B7A684; color: #2B1D14; height: 200px;">
                        <div class="row g-0 h-100">
                            <div class="col-auto d-flex align-items-center justify-content-center" style="padding: 10px;">
                                ${imageHtml}
                            </div>
                            <div class="col d-flex">
                                <div class="card-body d-flex flex-column justify-content-center w-100">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5 class="card-title mb-0">${name}</h5>
                                        ${bookmarkHtml}
                                    </div>
                                    <p class="card-text mb-2"><small>${address}</small></p>
                                    <div class="text-center">
                                        <span class="btn btn-sm btn-outline-dark me-2 hover-scale">View Shop</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            `;

            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        container.removeEventListener('click', this.boundHandleShopCardClickDelegation);
        this.boundHandleShopCardClickDelegation = this.handleShopCardClickDelegation.bind(this);
        container.addEventListener('click', this.boundHandleShopCardClickDelegation);
    }

    handleShopCardClickDelegation(e) {
        const anchor = e.target.closest('a[data-shop-type]');
        if (anchor) {
            e.preventDefault();
            const shopType = anchor.dataset.shopType;
            let shop = null;

            if (shopType === 'django') {
                const id = parseInt(anchor.dataset.shopId);
                shop = this.dataStore.djangoShops.find(s => s.id === id) || this.dataStore.allSearchableShops.find(s => s.id === id);
            } else if (shopType === 'osm') {
                const lat = parseFloat(anchor.dataset.shopLat);
                const lon = parseFloat(anchor.dataset.shopLon);
                shop = this.dataStore.overpassCafes.find(s => s.latitude === lat && s.longitude === lon);
            }

            if (shop) {
                this.panelManager.displayShopDetails(shop, shopType);
                this.urlRouter.navigateToShop(shop, 'hash');
                if (shop.latitude && shop.longitude) {
                    this.map.panTo([shop.latitude, shop.longitude]);
                }
                const marker = markerHandler.getMarkerForShop(shop);
                if (marker) {
                    marker.openPopup();
                } else {
                // Create a temporary popup directly at coordinates
                    L.popup()
                    .setLatLng([shop.latitude, shop.longitude])
                    .setContent(`<b>${shop.name}</b><br>${shop.address || '(no address)'}`)
                    .openOn(this.map);
                }

            }

        }

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
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const isBookmarked = data.action === 'bookmarked';
                    const shopData = this.dataStore.allSearchableShops.find(s => s.type === 'django' && s.id === shopId);
                    this.dataStore.updateBookmarkStatus(shopId, isBookmarked, shopData);

                    const query = document.getElementById('bookmarkSearchBar')?.value.trim();
                    const tabPane = document.getElementById('bookmarked-shops-pane');

                    if (this.panelManager.currentActiveTabId === 'all-shops-pane') {
                        this.tabManager?.filterAllShops?.(query || '');
                    }
                    if (tabPane?.classList.contains('active')) {
                        this.tabManager?.displayBookmarkedShopsTab?.();
                    }
                }
            })
            .catch(err => console.error('Bookmark error:', err));
        }
    }

    setTabManager(tabManager) {
        this.tabManager = tabManager;
    }
}
