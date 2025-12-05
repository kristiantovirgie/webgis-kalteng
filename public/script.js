console.log("SCRIPT SUDAH JALAN");
// ============================
//   INISIALISASI PETA
// ============================
const map = L.map("map").setView([-1.8, 113.5], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// ============================
//   LOAD GEOJSON + CSV
// ============================
Promise.all([
    fetch("kalimantan_tengah_clean.geojson").then(res => res.json()),
    fetch("populasi_kalteng2.csv").then(res => res.text())
]).then(([geojson, csvText]) => {

    // --- PARSE CSV ---
    const rows = csvText.trim().split("\n");
    const header = rows[0].split(",").map(h => h.trim().toLowerCase());

    const dataMap = {};
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",");
        const name = cols[0].trim();
        const population = parseInt(cols[1].replace(/\D/g, "")) || 0;

        dataMap[name.toLowerCase()] = {
            population: population
        };
    }

    // ============================
    //   HITUNG DENSITAS
    // ============================
    geojson.features.forEach(f => {
        const name = f.properties.NAME_2.trim().toLowerCase();
        if (dataMap[name]) {
            f.properties.population = dataMap[name].population;

            const areaKm = turf.area(f) / 1_000_000; // area in km²
            f.properties.density = Math.round(f.properties.population / areaKm);
        }
    });

    // ============================
    //   WARNA CHOROPLETH
    // ============================
    function getColorPop(x) {
        return x > 400000 ? "#800026" :
               x > 200000 ? "#BD0026" :
               x > 100000 ? "#E31A1C" :
               x > 50000  ? "#FC4E2A" :
                            "#FFEDA0";
    }

    function getColorDensity(x) {
        return x > 200 ? "#08519c" :
               x > 150 ? "#3182bd" :
               x > 100 ? "#6baed6" :
               x > 50  ? "#bdd7e7" :
                         "#eff3ff";
    }

    // ============================
    //   LAYER 1: POPULASI
    // ============================
    const layerPopulasi = L.geoJSON(geojson, {
        style: f => ({
            fillColor: getColorPop(f.properties.population),
            color: "#555",
            weight: 1,
            fillOpacity: 0.7
        }),
        onEachFeature: (f, layer) => {
            layer.bindPopup(`
                <b>${f.properties.NAME_2}</b><br>
                Populasi: ${f.properties.population.toLocaleString("id-ID")}
            `);
        }
    });

    // ============================
    //   LAYER 2: KEPADATAN
    // ============================
    const layerDensity = L.geoJSON(geojson, {
        style: f => ({
            fillColor: getColorDensity(f.properties.density),
            color: "#333",
            weight: 1,
            fillOpacity: 0.7
        }),
        onEachFeature: (f, layer) => {
            layer.bindPopup(`
                <b>${f.properties.NAME_2}</b><br>
                Kepadatan: ${f.properties.density} jiwa/km²
            `);
        }
    });

    // Add default layer
    layerPopulasi.addTo(map);

    // ============================
    //   LAYER CONTROL
    // ============================
    L.control.layers(
        {
            "Peta Populasi": layerPopulasi,
            "Peta Kepadatan Penduduk": layerDensity
        },
        null,
        { collapsed: false }
    ).addTo(map);

});
