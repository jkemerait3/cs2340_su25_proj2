const map = L.map('map').setView([33.778090545553816, -84.39796380370487], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Build and run Overpass query
const lat = 33.778090545553816;
const lon = -84.39796380370487;
const radius = 1000; // meters

const query = `
[out:json];
node["amenity"="cafe"](around:${radius},${lat},${lon});
out;
`;

fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
})
.then(res => res.json())
.then(data => {
    data.elements.forEach(el => {
        if (el.lat && el.lon) {
            const name = el.tags && el.tags.name ? el.tags.name : "Unnamed Cafe";
            L.marker([el.lat, el.lon])
             .addTo(map)
             .bindPopup(`<b>${name}</b>`);
        }
    });
})
.catch(err => console.error('Overpass API error:', err));
