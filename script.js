// Inisialisasi peta
var map = L.map("map").setView([-1.5, 113.5], 6);

// Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
}).addTo(map);

// Data Populasi
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

// Data luas wilayah untuk kepadatan (km2)
var luas = {
    "Kota Palangka Raya": 2667,
    "Kabupaten Kotawaringin Barat": 10760,
    "Kabupaten Kotawaringin Timur": 16796,
    "Kabupaten Kapuas": 14999,
    "Kabupaten Barito Selatan": 8850,
    "Kabupaten Barito Utara": 8300,
    "Kabupaten Sukamara": 3907,
    "Kabupaten Lamandau": 6188,
    "Kabupaten Seruyan": 16752,
    "Kabupaten Katingan": 20172,
    "Kabupaten Pulang Pisau": 8997,
    "Kabupaten Gunung Mas": 10805,
    "Kabupaten Barito Timur": 3834,
    "Kabupaten Murung Raya": 23350
};

// Warna Populasi
function getColorPop(x) {
    return x > 400000 ? "#800026" :
           x > 250000 ? "#BD0026" :
           x > 150000 ? "#E31A1C" :
           x > 80000  ? "#FC4E2A" :
                         "#FD8D3C";
}

// Warna Kepadatan
function getColorDens(x) {
    return x > 60 ? "#084594" :
           x > 40 ? "#2171B5" :
           x > 20 ? "#4292C6" :
           x > 10 ? "#6BAED6" :
                    "#9ECAE1";
}

// Style layer Populasi
function stylePop(feature) {
    var nama = feature.properties.NAME_2;
    var pop = populasi[nama] || 0;

    return {
        fillColor: getColorPop(pop),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.8
    };
}

// Style layer Kepadatan
function styleDens(feature) {
    var nama = feature.properties.NAME_2;
    var dens = (populasi[nama] / luas[nama]) || 0;

    return {
        fillColor: getColorDens(dens),
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.8
    };
}

var geojsonURL = "kalimantan_tengah_clean.geojson";

var layerPop, layerDens;

fetch(geojsonURL)
    .then(r => r.json())
    .then(data => {
        layerPop = L.geoJson(data, {
            style: stylePop,
            onEachFeature: function (feature, layer) {
                var nama = feature.properties.NAME_2;
                var pop = populasi[nama]?.toLocaleString() || "-";
                layer.bindPopup(`<b>${nama}</b><br>Populasi: ${pop}`);
            }
        });

        layerDens = L.geoJson(data, {
            style: styleDens,
            onEachFeature: function (feature, layer) {
                var nama = feature.properties.NAME_2;
                var dens = (populasi[nama] / luas[nama]).toFixed(1);
                layer.bindPopup(`<b>${nama}</b><br>Kepadatan: ${dens} jiwa/km²`);
            }
        });

        layerPop.addTo(map);
        addLegendPop();
    });

// Tombol Layer
document.getElementById("btnPop").onclick = function () {
    map.removeLayer(layerDens);
    layerPop.addTo(map);
    addLegendPop();
};

document.getElementById("btnDens").onclick = function () {
    map.removeLayer(layerPop);
    layerDens.addTo(map);
    addLegendDens();
};

// LEGEND
var legend = L.control({ position: "bottomright" });

function addLegendPop() {
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        var grades = [50000, 80000, 150000, 250000, 400000];
        div.innerHTML = "<b>Populasi</b><br>";
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                `<i style="background:${getColorPop(grades[i] + 1)}"></i> 
                 ${grades[i].toLocaleString()}+<br>`;
        }
        return div;
    };
    legend.addTo(map);
}

function addLegendDens() {
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        var grades = [10, 20, 40, 60];
        div.innerHTML = "<b>Kepadatan (jiwa/km²)</b><br>";
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                `<i style="background:${getColorDens(grades[i] + 1)}"></i> 
                 ${grades[i]}+<br>`;
        }
        return div;
    };
    legend.addTo(map);
}
