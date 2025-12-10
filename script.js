// ===========================
// 1. INISIALISASI PETA
// ===========================
var map = L.map("map").setView([-1.5, 113.5], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
}).addTo(map);

// ===========================
// 2. DATA POPULASI
// ===========================
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
    "Barito Timur": 113600,
    "Murung Raya": 118400,
    "Palangka Raya": 299000
};

// ===========================
// 3. DATA KEPADATAN (CONTOH)
// ===========================
var kepadatan = {
    "Kotawaringin Barat": 45,
    "Kotawaringin Timur": 70,
    "Kapuas": 55,
    "Barito Selatan": 30,
    "Barito Utara": 28,
    "Sukamara": 12,
    "Lamandau": 15,
    "Seruyan": 18,
    "Katingan": 20,
    "Pulang Pisau": 25,
    "Gunung Mas": 22,
    "Barito Timur": 17,
    "Murung Raya": 10,
    "Palangka Raya": 50
};

// ===========================
// 4. FUNGSI WARNA POPULASI
// ===========================
function warnaPop(x) {
    return x > 400000 ? "#800026" :
           x > 250000 ? "#BD0026" :
           x > 150000 ? "#E31A1C" :
           x > 80000  ? "#FC4E2A" :
           "#FD8D3C";
}

// ===========================
// 5. FUNGSI WARNA KEPADATAN
// ===========================
function warnaDens(x) {
    return x > 60 ? "#084081" :
           x > 40 ? "#0868ac" :
           x > 20 ? "#2b8cbe" :
           x > 10 ? "#4eb3d3" :
           "#7bccc4";
}

// ===========================
// 6. LEGEND (AKAN DIGANTI DI SETIAP MODE)
// ===========================
var legend = L.control({ position: "bottomright" });

function setLegendPop() {
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Populasi</h4>";
        div.innerHTML += '<i style="background:#800026"></i> 400,000+<br>';
        div.innerHTML += '<i style="background:#BD0026"></i> 250,000+<br>';
        div.innerHTML += '<i style="background:#E31A1C"></i> 150,000+<br>';
        div.innerHTML += '<i style="background:#FC4E2A"></i> 80,000+<br>';
        div.innerHTML += '<i style="background:#FD8D3C"></i> <80,000<br>';
        return div;
    };
}

function setLegendDens() {
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Kepadatan</h4>";
        div.innerHTML += '<i style="background:#084081"></i> 60+<br>';
        div.innerHTML += '<i style="background:#0868ac"></i> 40+<br>';
        div.innerHTML += '<i style="background:#2b8cbe"></i> 20+<br>';
        div.innerHTML += '<i style="background:#4eb3d3"></i> 10+<br>';
        div.innerHTML += '<i style="background:#7bccc4"></i> <10<br>';
        return div;
    };
}

// ===========================
// 7. AMBIL GEOJSON
// ===========================
var geoURL = "https://raw.githubusercontent.com/kristiantovirgie/webgis-kalteng/main/kalimantan_tengah_clean.geojson";

var layerPop, layerDens;

fetch(geoURL)
    .then(res => res.json())
    .then(data => {

        // --------------------------
        // A. LAYER POPULASI
        // --------------------------
        layerPop = L.geoJSON(data, {
            style: function (feature) {
                let raw = feature.properties.NAMA_KAB;

                // NORMALISASI
                let nama = raw
                    .replace("Kab. ", "")
                    .replace("Kota ", "")
                    .trim();

                if (raw.includes("Palangka Raya")) nama = "Palangka Raya";

                let value = populasi[nama] || 0;

                return {
                    fillColor: warnaPop(value),
                    weight: 1,
                    color: "white",
                    fillOpacity: 0.7
                };
            },

            onEachFeature: function (feature, layer) {
                let raw = feature.properties.NAMA_KAB;

                let nama = raw
                    .replace("Kab. ", "")
                    .replace("Kota ", "")
                    .trim();

                if (raw.includes("Palangka Raya")) nama = "Palangka Raya";

                let value = populasi[nama] || "Tidak tersedia";

                layer.bindPopup(
                    "<b>" + raw + "</b><br>" +
                    "Populasi: " + value.toLocaleString()
                );
            }
        });

        // --------------------------
        // B. LAYER KEPADATAN
        // --------------------------
        layerDens = L.geoJSON(data, {
            style: function (feature) {
                let raw = feature.properties.NAMA_KAB;

                let nama = raw
                    .replace("Kab. ", "")
                    .replace("Kota ", "")
                    .trim();

                if (raw.includes("Palangka Raya")) nama = "Palangka Raya";

                let value = kepadatan[nama] || 0;

                return {
                    fillColor: warnaDens(value),
                    weight: 1,
                    color: "white",
                    fillOpacity: 0.7
                };
            },

            onEachFeature: function (feature, layer) {
                let raw = feature.properties.NAMA_KAB;

                let nama = raw
                    .replace("Kab. ", "")
                    .replace("Kota ", "")
                    .trim();

                if (raw.includes("Palangka Raya")) nama = "Palangka Raya";

                let value = kepadatan[nama] || "Tidak tersedia";

                layer.bindPopup(
                    "<b>" + raw + "</b><br>" +
                    "Kepadatan: " + value + " jiwa/km²"
                );
            }
        });

        // Tambahkan layer populasi default
        layerPop.addTo(map);
        setLegendPop();
        legend.addTo(map);
    });

// ===========================
// 8. TOMBOL UNTUK GANTI LAYER
// ===========================
document.getElementById("btnPop").onclick = function () {
    map.removeLayer(layerDens);
    map.addLayer(layerPop);
    legend.remove();
    setLegendPop();
    legend.addTo(map);
};

document.getElementById("btnDens").onclick = function () {
    map.removeLayer(layerPop);
    map.addLayer(layerDens);
    legend.remove();
    setLegendDens();
    legend.addTo(map);
};
