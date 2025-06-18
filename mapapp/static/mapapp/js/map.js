// Initialize the Leaflet map centered on Georgia Tech area
const map = L.map('map').setView([33.778090545553816, -84.39796380370487], 14);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Load Django-passed coffee shops
const djangoShops = JSON.parse(document.getElementById('coffeeShopsData').textContent);
const localShopNames = djangoShops.map(shop => shop.name.toLowerCase().trim());

// Yellow pin icon for database coffee shops
const localIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Helper: Render info in sidebar
function showInfoPanel(content) {
    const panel = document.getElementById('shop-details');
    if (panel) {
        panel.innerHTML = content;
    }
}

// Plot db coffee shops with click → info panel
djangoShops.forEach(shop => {
    if (shop.latitude && shop.longitude) {
        const marker = L.marker([shop.latitude, shop.longitude], { icon: localIcon }).addTo(map);
        marker.on('click', () => {
            const html = `
                <h5>${shop.name}</h5>
                ${shop.image ? `<img src="/media/${shop.image}" alt="${shop.name}" style="width: 100%; max-width: 300px; height: auto; margin-bottom: 10px; border-radius: 8px;">` : ""}
                <p><i>From Our Database</i></p>
                <p>📍 ${shop.address}</p>
                ${shop.amenities ? `<p><strong>Amenities:</strong> ${shop.amenities}</p>` : ""}
                ${shop.hours ? `<p>🕒 <strong>Hours:</strong> ${shop.hours}</p>` : ""}
            `;
            showInfoPanel(html);
        });
    }
});

// Overpass API query to find nearby cafés (radius: 20km)
const lat = 33.778090545553816;
const lon = -84.39796380370487;
const radius = 20000;

const query = `
[out:json][timeout:25];
(
node["amenity"="cafe"](around:${radius},${lat},${lon});
);
out body;
`;

// Fetch and display Overpass cafés (click → info panel)
fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
})
.then(res => res.json())
.then(data => {
    data.elements.forEach(el => {
        if (el.lat && el.lon) {
            const name = el.tags?.name || "Unnamed Cafe";
            const isDuplicate = localShopNames.includes(name.toLowerCase().trim());

            if (!isDuplicate) {
                const tags = el.tags || {};
                const html = `
                    <h5>${name}</h5>
                    <p><i>From OpenStreetMap</i></p>
                    ${tags["addr:street"] ? `📍 ${tags["addr:street"]} ${tags["addr:housenumber"] || ""}<br>` : ""}
                    ${tags["opening_hours"] ? `🕒 <strong>Hours:</strong> ${tags["opening_hours"]}<br>` : ""}
                    ${tags["internet_access"] ? `📶 <strong>Wi-Fi:</strong> ${tags["internet_access"]}<br>` : ""}
                    ${tags["wheelchair"] ? `♿ <strong>Wheelchair Access:</strong> ${tags["wheelchair"]}<br>` : ""}
                    ${tags["website"] ? `🔗 <a href="${tags["website"]}" target="_blank">Website</a><br>` : ""}
                    ${tags["phone"] ? `📞 <strong>${tags["phone"]}</strong><br>` : ""}
                `;
                const marker = L.marker([el.lat, el.lon]).addTo(map);
                marker.on('click', () => showInfoPanel(html));
            }
        }
    });
})
.catch(err => console.error("Overpass API error:", err));
