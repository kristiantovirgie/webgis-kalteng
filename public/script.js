// Inisialisasi peta
const map = L.map("map").setView([-1.8, 113.5], 7);

// Basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// ====== BACA GEOJSON + CSV BERSAMA-SAMA ======
Promise.all([
  Promise.all([
  fetch("kalimantan_tengah_clean.geojson").then(res => res.json()),
  fetch("populasi_kalteng2.csv").then(res => res.text())
])


]).then(([geojson, csvText]) => {
  // ---- PARSE CSV ----
  const rows = csvText.trim().split("\n");
  const header = rows[0].split(",").map((h) => h.trim().toLowerCase());

  const nameIdx = header.findIndex(
    (h) => h.includes("kabupaten") || h.includes("kota") || h.includes("nama")
  );
  const popIdx = header.findIndex(
    (h) => h.includes("pop") || h.includes("penduduk")
  );
  const areaIdx = header.findIndex(
    (h) => h.includes("luas") || h.includes("km")
  );

  const dataMap = {};

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",");
    if (cols.length < 2) continue;

    const nama = cols[nameIdx].trim();
    const pop = parseFloat(
      cols[popIdx].replace(/\./g, "").replace(",", ".")
    );
    let area = null;
    if (areaIdx !== -1 && cols[areaIdx]) {
      area = parseFloat(
        cols[areaIdx].replace(/\./g, "").replace(",", ".")
      );
    }
    const dens = area ? pop / area : null;

    dataMap[nama.toLowerCase()] = {
      nama,
      pop,
      area,
      dens,
    };
  }

  // ---- TEMPEL DATA KE GEOJSON ----
  geojson.features.forEach((f) => {
    const p = f.properties;
    const nama =
      (p.NAMOBJ || p.NAME_2 || p.KABKOT || p.KAB_KOTA || "").trim();
    const key = nama.toLowerCase();

    if (dataMap[key]) {
      p.nama = dataMap[key].nama;
      p.populasi = dataMap[key].pop;
      p.luas = dataMap[key].area;
      p.kepadatan = dataMap[key].dens;
    } else {
      // Kalau namanya beda dikit, bisa dicek di console
      console.warn("Tidak ketemu di CSV:", nama);
      p.nama = nama;
    }
  });

  // ---- HITUNG MIN/MAX UNTUK SKALA WARNA ----
  const pops = geojson.features
    .map((f) => f.properties.populasi)
    .filter((v) => v);
  const dens = geojson.features
    .map((f) => f.properties.kepadatan)
    .filter((v) => v);

  const popMin = Math.min(...pops);
  const popMax = Math.max(...pops);
  const densMin = Math.min(...dens);
  const densMax = Math.max(...dens);

  // Fungsi warna (5 kelas)
  function getColor(v, min, max) {
    if (v == null) return "#cccccc";
    const step = (max - min) / 5;
    if (v <= min + step) return "#fee5d9";
    if (v <= min + 2 * step) return "#fcae91";
    if (v <= min + 3 * step) return "#fb6a4a";
    if (v <= min + 4 * step) return "#de2d26";
    return "#a50f15";
  }

  function stylePop(feature) {
    const v = feature.properties.populasi;
    return {
      fillColor: getColor(v, popMin, popMax),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.8,
    };
  }

  function styleDens(feature) {
    const v = feature.properties.kepadatan;
    return {
      fillColor: getColor(v, densMin, densMax),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.8,
    };
  }

  // Event hover & popup
  function onEachFeature(feature, layer) {
    const p = feature.properties;
    const nama = p.nama || "Tidak diketahui";
    const pop = p.populasi
      ? p.populasi.toLocaleString("id-ID")
      : "–";
    const luas = p.luas ? p.luas.toLocaleString("id-ID") + " km²" : "–";
    const dens = p.kepadatan
      ? Math.round(p.kepadatan).toLocaleString("id-ID") + " jiwa/km²"
      : "–";

    const html = `
      <b>${nama}</b><br/>
      Populasi: ${pop}<br/>
      Luas: ${luas}<br/>
      Kepadatan: ${dens}
    `;
    layer.bindPopup(html);

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2,
          color: "#666",
          dashArray: "",
          fillOpacity: 0.9,
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          l.bringToFront();
        }
      },
      mouseout: (e) => {
        popLayer.resetStyle(e.target);
        densLayer.resetStyle(e.target);
      },
    });
  }

  // Buat 2 layer
  const popLayer = L.geoJSON(geojson, {
    style: stylePop,
    onEachFeature,
  });

  const densLayer = L.geoJSON(geojson, {
    style: styleDens,
    onEachFeature,
  });

  // Default tampil layer populasi
  popLayer.addTo(map);

  // Zoom ke batas Kalteng
  map.fitBounds(popLayer.getBounds());

  // Control layer (2 overlay)
  const overlays = {
    "Populasi": popLayer,
    "Kepadatan Penduduk": densLayer,
  };

  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  // === LEGEND ===
  const legendDiv = document.getElementById("legend");

  function updateLegend(mode) {
    let min, max, title;
    if (mode === "dens") {
      min = densMin;
      max = densMax;
      title = "Kepadatan (jiwa/km²)";
    } else {
      min = popMin;
      max = popMax;
      title = "Populasi";
    }

    const step = (max - min) / 5;
    const grades = [
      min,
      min + step,
      min + 2 * step,
      min + 3 * step,
      min + 4 * step,
      max,
    ];

    let html = `<div class="legend-title">${title}</div>`;
    for (let i = 0; i < grades.length - 1; i++) {
      const from = Math.round(grades[i]);
      const to = Math.round(grades[i + 1]);
      const color = getColor(from + 0.1, min, max);
      html += `
        <div class="legend-item">
          <span class="legend-color" style="background:${color};"></span>
          <span>${from.toLocaleString("id-ID")} – ${to.toLocaleString("id-ID")}</span>
        </div>
      `;
    }

    legendDiv.innerHTML = html;
  }

  updateLegend("pop");

  map.on("overlayadd", (e) => {
    if (e.layer === densLayer) {
      updateLegend("dens");
    } else if (e.layer === popLayer) {
      updateLegend("pop");
    }
  });

  map.on("overlayremove", (e) => {
    // Kalau kedua layer di-uncheck, legend tetap terakhir aktif
  });
});
