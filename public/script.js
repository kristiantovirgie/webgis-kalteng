var map = L.map("map").setView([-1.8, 113.5], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
}).addTo(map);

const coords = {
    "Kab. Kotawaringin Barat": [-2.679, 111.616],
    "Kab. Kotawaringin Timur": [-2.538, 112.956],
    "Kab. Kapuas": [-3.097, 114.390],
    "Kab. Barito Selatan": [-1.875, 114.810],
    "Kab. Barito Utara": [-0.957, 115.125],
    "Kab. Sukamara": [-2.626, 111.222],
    "Kab. Lamandau": [-2.235, 111.526],
    "Kab. Seruyan": [-3.000, 112.500],
    "Kab. Katingan": [-1.432, 113.400],
    "Kab. Pulang Pisau": [-2.684, 114.038],
    "Kab. Gunung Mas": [-1.141, 113.785],
    "Kab. Barito Timur": [-2.020, 115.169],
    "Kab. Murung Raya": [-0.720, 114.000],
    "Kota Palangka Raya": [-2.210, 113.920]
};

fetch("data/populasi_kalteng2.csv")
    .then(res => res.text())
    .then(csv => {
        let rows = csv.split("\n").slice(1);

        rows.forEach(row => {
            if (!row.trim()) return;

            let cols = row.split(",");
            let name = cols[0].trim();
            let population = cols[1].trim();

            if (coords[name]) {
                L.marker(coords[name])
                    .addTo(map)
                    .bindPopup(`<b>${name}</b><br>Populasi: ${population}`);
            }
        });
    });
