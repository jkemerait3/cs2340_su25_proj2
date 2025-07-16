document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map').setView([33.778090545553816, -84.39796380370487], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
    }).addTo(map);

    const searchInput = document.getElementById('search-input');
    const filterBoxes = document.querySelectorAll('.filter-box');
    const shopList = document.getElementById('shop-list');

    const popupCard = document.getElementById('shop-popup-card');
    const popupContent = document.getElementById('popup-card-content');
    const closePopup = document.getElementById('close-popup-card');

    closePopup.addEventListener('click', () => {
        popupCard.classList.add('d-none');
    });

    document.addEventListener('click', (e) => {
        if (!popupCard.contains(e.target) && !e.target.closest('.leaflet-marker-icon') && !e.target.closest('#shop-list')) {
            popupCard.classList.add('d-none');
        }
    });

    const osmMarkers = [];
    let dbMarkers = [];

    const localIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    function normalize(text) {
        return (text || "").toLowerCase();
    }

    function matchesFilters(shop) {
        const active = Array.from(filterBoxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
        const amens = normalize(shop.amenities || shop.tags?.amenities || "");
        return active.every(tag => amens.includes(tag));
    }

    function matchesSearch(shop) {
        const query = normalize(searchInput.value);
        return normalize(shop.name).includes(query) || normalize(shop.address || shop.tags?.["addr:street"] || "").includes(query);
    }

    function showCustomPopup(html) {
        popupContent.innerHTML = html;
        popupCard.classList.remove('d-none');
    }

    function updateMarkers() {
        shopList.innerHTML = "";
        const allShops = [...osmMarkers, ...dbMarkers];
        allShops.forEach(({ marker, shop, html }) => {
            const visible = matchesSearch(shop) && matchesFilters(shop);
            if (visible) {
                marker.addTo(map);
                const listItem = document.createElement("div");
                listItem.innerHTML = `<strong>${shop.name}</strong><br><small>${shop.address || ""}</small><hr>`;
                listItem.classList.add("mb-2");
                listItem.style.cursor = "pointer";
                listItem.addEventListener("click", () => {
                    showCustomPopup(html);
                    if (marker?.getLatLng) {
                    map.setView(marker.getLatLng(), 16);
                    } else {
                        showCustomPopup(`<p>No additional information available.</p>`);
                        console.warn("Missing HTML for shop:", shop.name);
                    }
                });
                shopList.appendChild(listItem);
            } else {
                map.removeLayer(marker);
            }
        });
    }

    function applyFiltersFromSidebar() {
        const params = new URLSearchParams();

        if (document.querySelector('input[name="wifi"]')?.checked)
            params.append('wifi', 'true');
        if (document.querySelector('input[name="outlets"]')?.checked)
            params.append('outlets', 'true');
        if (document.querySelector('input[name="openNow"]')?.checked)
            params.append('openNow', 'true');

        const openAfter = document.querySelector('input[name="openAfter"]')?.value;
        const closeBefore = document.querySelector('input[name="closeBefore"]')?.value;
        if (openAfter) params.append('openAfter', openAfter);
        if (closeBefore) params.append('closeBefore', closeBefore);

        fetch(`/api/coffee_shops/?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                dbMarkers.forEach(({ marker }) => map.removeLayer(marker));
                dbMarkers = [];

                data.forEach(shop => {
                    if (shop.latitude && shop.longitude) {
                        const html = `
                            <h5>${shop.name}</h5>
                            ${shop.image ? `<img src="/media/${shop.image}" alt="${shop.name}" style="width: 100%; max-width: 300px; height: auto; margin-bottom: 10px; border-radius: 8px;">` : ""}
                            <p><i>From Our Database</i></p>
                            <p>📍 ${shop.address}</p>
                            ${shop.amenities ? `<p><strong>Amenities:</strong> ${shop.amenities}</p>` : ""}
                            ${shop.hours ? `<p>🕒 <strong>Hours:</strong> ${shop.hours}</p>` : ""}
                        `;
                        const marker = L.marker([shop.latitude, shop.longitude], { icon: localIcon });
                        marker.on("click", () => showCustomPopup(html));
                        dbMarkers.push({ marker, shop, html });
                    }
                });

                updateMarkers();
            })
            .catch(err => console.error("Error fetching filtered shops:", err));
    }

    // Load OSM cafés
    const lat = 33.778090545553816;
    const lon = -84.39796380370487;
    const radius = 20000;
    const query = `
    [out:json][timeout:25];
    (node["amenity"="cafe"](around:${radius},${lat},${lon}););
    out body;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
    })
        .then(res => res.json())
        .then(data => {
            data.elements.forEach(el => {
                if (el.lat && el.lon) {
                    const name = el.tags?.name || "Unnamed Cafe";
                    const tags = el.tags || {};
                    const html = `
                        <h5>${name}</h5>
                        ${tags["addr:street"] ? `📍 ${tags["addr:street"]} ${tags["addr:housenumber"] || ""}<br>` : ""}
                        ${tags["opening_hours"] ? `🕒 <strong>Hours:</strong> ${tags["opening_hours"]}<br>` : ""}
                        ${tags["internet_access"] ? `📶 <strong>Wi-Fi:</strong> ${tags["internet_access"]}<br>` : ""}
                        ${tags["wheelchair"] ? `♿ <strong>Wheelchair Access:</strong> ${tags["wheelchair"]}<br>` : ""}
                        ${tags["website"] ? `🔗 <a href="${tags["website"]}" target="_blank">Website</a><br>` : ""}
                        ${tags["phone"] ? `📞 <strong>${tags["phone"]}</strong><br>` : ""}
                    `;
                    const shopObj = {
                        name: name,
                        address: tags["addr:street"] || "",
                        amenities: (tags["internet_access"] ? "Wi-Fi " : "") +
                            (tags["quiet"] ? "Quiet " : "") +
                            (tags["opening_hours"]?.includes("22") ? "Open Late" : ""),
                        tags
                    };
                    const marker = L.marker([el.lat, el.lon]);
                    marker.on("click", () => showCustomPopup(html));
                    osmMarkers.push({ marker, shop: shopObj, html });
                }
            });
            updateMarkers();
        })
        .catch(err => console.error("Overpass API error:", err));

    resizeShopList();
    window.addEventListener('resize', resizeShopList);

    document.getElementById('applyFilters')?.addEventListener('click', applyFiltersFromSidebar);
    searchInput.addEventListener("input", updateMarkers);
    filterBoxes.forEach(cb => cb.addEventListener("change", updateMarkers));

    applyFiltersFromSidebar();
    updateMarkers();
});
