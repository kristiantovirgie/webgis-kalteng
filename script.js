var map = L.map("map").setView([-1.5, 113.5], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
}).addTo(map);

var populasi = {
    "Kota Palangka Raya": 303500,
    "Kabupaten Kotawaringin Barat": 321200,
    "Kabupaten Kotawaringin Timur": 428900,
    "Kabupaten Kapuas": 410400,
    "Kabupaten Barito Selatan": 154800,
    "Kabupaten Barito Utara": 163100,
    "Kabupaten Sukamara": 66000,
    "Kabupaten Lamandau": 89000,
    "Kabupaten Seruyan": 140000,
    "Kabupaten Katingan": 165500,
    "Kabupaten Pulang Pisau": 126700,
    "Kabupaten Gunung Mas": 141500,
    "Kabupaten Barito Timur": 113600,
    "Kabupaten Murung Raya": 127000
};

var geojsonURL = "https://raw.githubusercontent.com/tegarw010/geojson-indonesia/main/kalimantan_tengah.geojson";

function getColor(pop) {
    return pop > 400000 ? "#800026" :
           pop > 250000 ? "#BD0026" :
           pop > 150000 ? "#E31A1C" :
           pop > 80000  ? "#FC4E2A" :
           "#FD8D3C";
}

function style(feature) {
    var nama = feature.properties.NAME_2;
    var pop = populasi[nama] || 0;

    return {
        fillColor: getColor(pop),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7
    };
}

fetch(geojsonURL)
    .then(response => response.json())
    .then(data => {
        L.geoJson(data, {
            style: style,
            onEachFeature: function (feature, layer) {
                var nama = feature.properties.NAME_2;
                var pop = populasi[nama] || "Data tidak tersedia";

                layer.bindPopup(
                    "<b>" + nama + "</b><br>" +
                    "Populasi: " + pop.toLocaleString()
                );
            }
        }).addTo(map);
    });
