var map = L.map("map").setView([-1.5, 113.5], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
}).addTo(map);

// ==================== DATA POPULASI ====================
var populasi = {
    "Kotawaringin Barat": 297240,
    "Kotawaringin Timur": 443033,
    "Kapuas": 416300,
    "Barito Selatan": 136860,
    "Barito Utara": 162600,
    "Sukamara": 66118,
    "Lamandau": 112441,
    "Seruyan": 174300,
    "Katingan": 181960,
    "Pulang Pisau": 142900,
    "Gunung Mas": 138400,
    "Barito Timur": 118021,
    "Murung Raya": 118400,
    "Palangka Raya": 303500
};

// ==========================================
var geojsonURL = "kalimantan_tengah_clean.geojson";

// ----- Fungsi warna -----
function getColor(pop) {
    return pop > 400000 ? "#800026" :
           pop > 250000 ? "#BD0026" :
           pop > 150000 ? "#E31A1C" :
           pop > 80000  ? "#FC4E2A" :
                          "#FD8D3C";
}

// ----- Style per polygon -----
function style(feature) {
    let raw = feature.properties.NAMA_KAB;     // contoh: "Kab. Kapuas"
    let nama = raw.replace("Kab. ", "").trim(); // jadi "Kapuas"

    let pop = populasi[nama] || 0;

    return {
        fillColor: getColor(pop),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7
    };
}

// ----- Load GeoJSON -----
fetch(geojsonURL)
    .then(res => res.json())
    .then(data => {
        L.geoJson(data, {
            style: style,
            onEachFeature: function (feature, layer) {
                let raw = feature.properties.NAMA_KAB;
                let nama = raw.replace("Kab. ", "").trim();
                let pop = populasi[nama] || "Tidak tersedia";

                layer.bindPopup(
                    "<b>" + nama + "</b><br>" +
                    "Populasi: " + pop.toLocaleString()
                );
            }
        }).addTo(map);
    });
