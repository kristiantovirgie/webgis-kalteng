// ===============================
// INISIALISASI PETA
// ===============================
const map = L.map("map").setView([-1.8, 113.5], 7);

// Basemap OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// ===============================
// FUNGSI BANTU
// ===============================

// Samakan format nama supaya CSV dan GeoJSON bisa ketemu
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/kabupaten/g, "kab")
    .replace(/kab\./g, "kab")
    .replace(/kab /g, "kab ")
    .replace(/kota /g, "kota ")
    .replace(/provinsi/g, "")
    .replace(/[^\w]/g, "") // buang tanda baca
    .replace(/\s+/g, ""); // buang spasi
}

// Format angka dengan titik ribuan
function formatNumber(x) {
  if (x === null || x === undefined) return "-";
  return x.toLocaleString("id-ID");
}

// ===============================
// LOAD GEOJSON + CSV BERSAMA-SAMA
// ===============================

Promise.all([
  // GeoJSON batas kab/kota
  fetch("kalimantan_tengah_clean.geojson").then((res) => res.json()),
  // CSV populasi
  fetch("populasi_kalteng2.csv").then((res) => res.text()),
])
  .then(([geojson, csvText]) => {
    // ========== PARSE CSV ==========
    const rows = csvText.trim().split("\n");
    const header = rows[0].split(",").map((h) => h.trim().toLowerCase());

    const idxName = header.indexOf("name");
    const idxPop = header.indexOf("population");

    const csvData = rows.slice(1).map((line) => {
      const cols = line.split(",");
      const name = (cols[idxName] || "").trim();
      const popStr = (cols[idxPop] || "").trim().replace(/[^0-9]/g, "");
      const population = parseInt(popStr, 10) || 0;

      return {
        name,
        key: normalizeName(name),
        population,
      };
    });

    // Bikin index by key supaya pencarian cepat
    const csvIndex = {};
    csvData.forEach((row) => {
      csvIndex[row.key] = row;
    });

    // ========== GABUNG CSV KE GEOJSON + HITUNG DENSITAS ==========
    geojson.features.forEach((f) => {
      const namaKab = f.properties.NAMA_KAB; // dari GeoJSON
      const key = normalizeName(namaKab);

      const csvRow = csvIndex[key];

      // isi properti populasi
      if (csvRow) {
        f.properties.population = csvRow.population;
      } else {
        f.properties.population = 0;
        console.warn("Nama tidak ketemu di CSV:", namaKab);
      }

      // Hitung luas (km²) pakai turf kalau ada
      let areaKm2 = 1; // default 1 biar tidak bagi 0
      try {
        if (typeof turf !== "undefined") {
          const areaM2 = turf.area(f);
          areaKm2 = areaM2 / 1_000_000; // m² ke km²
        }
      } catch (e) {
        console.warn("Gagal hitung luas untuk", namaKab, e);
      }

      f.properties.area_km2 = areaKm2;
      f.properties.density = f.properties.population / areaKm2; // jiwa per km²
    });

    // Setelah properti lengkap, buat layer-layernya
    buildLayers(geojson);
  })
  .catch((err) => {
    console.error("Gagal load data:", err);
    alert("Gagal memuat data peta. Coba reload halaman.");
  });

// ===============================
// FUNGSI WARNA CHOROPLETH
// ===============================

// Populasi absolut
function getColorPop(x) {
  return x > 400000
    ? "#800026"
    : x > 200000
    ? "#BD0026"
    : x > 100000
    ? "#E31A1C"
    : x > 50000
    ? "#FC4E2A"
    : x > 20000
    ? "#FD8D3C"
    : "#FFEDA0";
}

// Kepadatan jiwa/km2
function getColorDensity(x) {
  return x > 200
    ? "#084081"
    : x > 150
    ? "#0868AC"
    : x > 100
    ? "#2B8CBE"
    : x > 50
    ? "#4EB3D3"
    : x > 25
    ? "#7BCCC4"
    : "#E0F3F8";
}

// ===============================
// BANGUN LAYER, POPUP, LEGEND
// ===============================

let popLayer, densityLayer, legend;

function buildLayers(geojson) {
  // Popup untuk semua layer
  function onEachFeature(feature, layer) {
    const p = feature.properties;
    const nama = p.NAMA_KAB || "-";
    const pop = p.population || 0;
    const dens = p.density || 0;

    const html = `
      <b>${nama}</b><br/>
      Populasi: ${formatNumber(pop)} jiwa<br/>
      Kepadatan: ${formatNumber(dens.toFixed(1))} jiwa/km²
    `;
    layer.bindPopup(html);
  }

  // Layer choropleth Populasi
  popLayer = L.geoJSON(geojson, {
    style: (feature) => ({
      fillColor: getColorPop(feature.properties.population),
      weight: 1,
      opacity: 1,
      color: "#333",
      fillOpacity: 0.7,
    }),
    onEachFeature,
  }).addTo(map); // jadikan default

  // Layer choropleth Kepadatan
  densityLayer = L.geoJSON(geojson, {
    style: (feature) => ({
      fillColor: getColorDensity(feature.properties.density),
      weight: 1,
      opacity: 1,
      color: "#333",
      fillOpacity: 0.7,
    }),
    onEachFeature,
  });

  // Zoom ke batas Kalteng
  map.fitBounds(popLayer.getBounds());

  // ===========================
  // Layer Control
  // ===========================
  const overlays = {
    "Populasi (jiwa)": popLayer,
    "Kepadatan (jiwa/km²)": densityLayer,
  };

  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  // ===========================
  // LEGEND
  // ===========================
  legend = L.control({ position: "bottomright" });

  let currentLegendType = "pop"; // awalnya populasi

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    updateLegendContent(div, currentLegendType);
    return div;
  };

  legend.addTo(map);

  function updateLegendContent(div, type) {
    let grades, getColor, title;

    if (type === "density") {
      title = "Kepadatan (jiwa/km²)";
      grades = [0, 25, 50, 100, 150, 200];
      getColor = getColorDensity;
    } else {
      title = "Populasi (jiwa)";
      grades = [0, 20000, 50000, 100000, 200000, 400000];
      getColor = getColorPop;
    }

    let labels = [`<strong>${title}</strong>`];

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];

      labels.push(
        `<i style="background:${getColor(from + 1)}"></i> ${
          to ? `${formatNumber(from)} &ndash; ${formatNumber(to)}` : `> ${formatNumber(from)}`
        }`
      );
    }

    div.innerHTML = labels.join("<br>");
  }

  // Ubah legend kalau layer diganti
  map.on("overlayadd", function (e) {
    if (e.layer === popLayer) {
      currentLegendType = "pop";
    } else if (e.layer === densityLayer) {
      currentLegendType = "density";
    }
    updateLegendContent(legend.getContainer(), currentLegendType);
  });

  map.on("overlayremove", function (e) {
    // Kalau layer populasi di-remove dan density yang aktif → legend density
    if (!map.hasLayer(popLayer) && map.hasLayer(densityLayer)) {
      currentLegendType = "density";
    }
    // Kalau density di-remove dan populasi yang aktif → legend populasi
    if (!map.hasLayer(densityLayer) && map.hasLayer(popLayer)) {
      currentLegendType = "pop";
    }
    updateLegendContent(legend.getContainer(), currentLegendType);
  });
}
