// =======================
// 1. INISIALISASI PETA
// =======================
var map = L.map("map").setView([-1.8, 113.5], 7);

// BASEMAP
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);


// ================================
// 2. DATA POPULASI (MANUAL)
// ================================
var dataPopulasi = {
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


// ================================
// 3. FUNGSI WARNA POPULASI
// ================================
function getColorPop(x) {
    return x > 400000 ? "#800026" :
           x > 250000 ? "#BD0026" :
           x > 150000 ? "#E31A1C" :
           x > 80000  ? "#FC4E2A" :
                        "#FEB24C";
}

// Style untuk layer populasi
function stylePop(feature) {
    let nama = feature.properties.WADMKK;
    let pop = dataPopulasi[nama] || 0;

    return {
        fillColor: getColorPop(pop),
        color: "#ffffff",
        weight: 1,
        fillOpacity: 0.7
    };
}


// ================================
// 4. HITUNG KEPADATAN (MANUAL ESTIMASI)
// ================================
var dataLuas = {
    "Kota Palangka Raya": 2678,
    "Kabupaten Kotawaringin Barat": 10760,
    "Kabupaten Kotawaringin Timur": 16796,
    "Kabupaten Kapuas": 14999,
    "Kabupaten Barito Selatan": 8670,
    "Kabupaten Barito Utara": 8300,
    "Kabupaten Sukamara": 3907,
    "Kabupaten Lamandau": 6474,
    "Kabupaten Seruyan": 13240,
    "Kabupaten Katingan": 20378,
    "Kabupaten Pulang Pisau": 8997,
    "Kabupaten Gunung Mas": 10933,
    "Kabupaten Barito Timur": 3824,
    "Kabupaten Murung Raya": 23400
};

let dataKepadatan = {};
Object.keys(dataPopulasi).forEach(k => {
    dataKepadatan[k] = Math.round(dataPopulasi[k] / dataLuas[k]);
});

function getColorDensity(x) {
    return x > 200 ? "#084081" :
           x > 120 ? "#0868ac" :
           x > 80  ? "#2b8cbe" :
           x > 40  ? "#4eb3d3" :
                     "#7bccc4";
}

function styleDensity(feature) {
    let nama = feature.properties.WADMKK;
    let dens = dataKepadatan[nama] || 0;
    return {
        fillColor: getColorDensity(dens),
        color: "#ffffff",
        weight: 1,
        fillOpacity: 0.7
    };
}


// ================================
// 5. LOAD GEOJSON (URL VALID)
// ================================
var geojsonURL =
"https://raw.githubusercontent.com/tegarw010/geojson-indonesia/main/kalimantan_tengah/kalimantan_tengah.geojson";

var layerPopulasi, layerKepadatan;

fetch(geojsonURL)
    .then(res => res.json())
    .then(data => {

        // LAYER POPULASI
        layerPopulasi = L.geoJson(data, {
            style: stylePop,
            onEachFeature: function (feature, layer) {
                let nama = feature.properties.WADMKK;
                let pop = dataPopulasi[nama] || 0;

                layer.bindPopup(`
                    <b>${nama}</b><br>
                    Populasi: ${pop.toLocaleString()}
                `);
            }
        });

        // LAYER KEPADATAN
        layerKepadatan = L.geoJson(data, {
            style: styleDensity,
            onEachFeature: function (feature, layer) {
                let nama = feature.properties.WADMKK;
                let dens = dataKepadatan[nama] || 0;

                layer.bindPopup(`
                    <b>${nama}</b><br>
                    Kepadatan: ${dens} jiwa/km²
                `);
            }
        });

        layerPopulasi.addTo(map);
    });


// ================================
// 6. LAYER CONTROL
// ================================
var overlays = {
    "Choropleth Populasi": () => {
        map.removeLayer(layerKepadatan);
        layerPopulasi.addTo(map);
    },
    "Choropleth Kepadatan": () => {
        map.removeLayer(layerPopulasi);
        layerKepadatan.addTo(map);
    }
};

// Tombol kontrol sederhana
var controlDiv = L.control({ position: "topright" });
controlDiv.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");
    div.innerHTML = `
        <button id="btnPop" style="margin:5px;padding:5px;">Populasi</button>
        <button id="btnDens" style="margin:5px;padding:5px;">Kepadatan</button>
    `;
    return div;
};
controlDiv.addTo(map);


// Event tombol
document.addEventListener("click", function (e) {
    if (e.target.id === "btnPop") {
        overlays["Choropleth Populasi"]();
    }
    if (e.target.id === "btnDens") {
        overlays["Choropleth Kepadatan"]();
    }
});


// ================================
// 7. LEGEND POPULASI
// ================================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend"),
        grades = [50000, 80000, 150000, 250000, 400000],
        labels = [];

    div.innerHTML = "<b>Populasi</b><br>";

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColorPop(grades[i] + 1) + '"></i> ' +
            grades[i].toLocaleString() +
            (grades[i + 1] ? " – " + grades[i + 1].toLocaleString() + "<br>" : "+");
    }

    return div;
};

legend.addTo(map);
