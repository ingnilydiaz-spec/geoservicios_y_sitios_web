// ==========================================
// ARCHIVO: webapp/js/app.js (Buscador Garantizado)
// ==========================================

const map = L.map('map').setView([4.5709, -74.2973], 6);

// Capas Base
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
});

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
});

osm.addTo(map);

// URL de GeoServer
const geoserverWmsUrl = 'http://localhost:8080/geoserver/geoservicios/wms';

// Capas WMS
const deptoWMS = L.tileLayer.wms(geoserverWmsUrl, {
    layers: 'geoservicios:departamentos',
    format: 'image/png',
    transparent: true,
    attribution: 'IGAC / DANE'
});

const mpioWMS = L.tileLayer.wms(geoserverWmsUrl, {
    layers: 'geoservicios:municipios',
    format: 'image/png',
    transparent: true,
    attribution: 'IGAC / DANE'
});

// Control de Capas
const baseMaps = {
    "OpenStreetMap": osm,
    "Satellite": satellite
};

const overlayMaps = {
    "Departamentos (WMS)": deptoWMS,
    "Municipios (WMS)": mpioWMS
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
deptoWMS.addTo(map);

// Control de Información (Esquina superior izquierda)
const infoControl = L.control({ position: 'topleft' });
infoControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info');
    div.innerHTML = `
        <h4>Colombia - Servicios Geográficos</h4>
        <p>Visualización de departamentos y municipios</p>
        <p>Datos: IGAC / DANE | Servidor: GeoServer</p>
        <p><em>Usa el buscador para ubicar un departamento</em></p>
    `;
    return div;
};
infoControl.addTo(map);

// Control de Leyenda (Esquina inferior derecha)
const legendControl = L.control({ position: 'bottomright' });
legendControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
        <strong>Leyenda</strong><br>
        <i style="background: #d4edda; border: 1px solid #000;"></i> Departamentos<br>
        <span style="display:inline-block; width:18px; text-align:center; color:#007bff; font-weight:bold;">📍</span> Capital
    `;
    return div;
};
legendControl.addTo(map);

// Base de coordenadas de los departamentos para el buscador
const departamentosCoordenadas = {
    "boyaca": [[4.65, -74.15], [7.05, -71.95]],
    "boyacá": [[4.65, -74.15], [7.05, -71.95]],
    "antioquia": [[5.41, -77.1], [8.88, -73.89]],
    "cundinamarca": [[3.73, -74.9], [5.83, -73.04]],
    "bogota": [[4.46, -74.25], [4.83, -74.00]],
    "bogotá": [[4.46, -74.25], [4.83, -74.00]],
    "valle del cauca": [[3.11, -77.56], [5.12, -75.76]],
    "santander": [[5.71, -74.52], [8.13, -72.46]],
    "atlantico": [[10.25, -75.34], [11.12, -74.43]],
    "atlántico": [[10.25, -75.34], [11.12, -74.43]],
    "bolivar": [[7.35, -75.56], [10.51, -73.79]],
    "bolívar": [[7.35, -75.56], [10.51, -73.79]],
    "tolima": [[2.76, -76.38], [5.37, -74.40]],
    "huila": [[1.55, -77.01], [3.51, -74.45]],
    "narino": [[0.35, -79.01], [2.71, -76.79]],
    "nariño": [[0.35, -79.01], [2.71, -76.79]],
    "cauca": [[0.97, -77.58], [3.31, -75.77]],
    "meta": [[1.59, -74.99], [4.94, -71.05]],
    "choco": [[4.22, -77.55], [8.70, -76.01]],
    "chocó": [[4.22, -77.55], [8.70, -76.01]],
    "casanare": [[4.17, -73.95], [6.33, -69.84]],
    "arauca": [[6.12, -72.35], [7.18, -69.82]],
    "vichada": [[2.69, -71.07], [6.28, -67.43]],
    "guainia": [[1.13, -70.43], [3.87, -66.85]],
    "guaviare": [[0.90, -74.42], [2.97, -71.23]],
    "caqueta": [[-1.71, -76.35], [2.22, -72.23]],
    "amazonas": [[-4.23, -74.12], [2.16, -69.65]],
    "putumayo": [[-0.64, -77.17], [1.39, -74.83]],
    "magdalena": [[9.22, -75.12], [11.35, -73.43]],
    "cesar": [[7.71, -74.13], [10.85, -72.85]],
    "la guajira": [[10.42, -73.65], [12.46, -71.12]],
    "sucre": [[8.24, -75.62], [9.84, -74.77]],
    "cordoba": [[7.35, -76.51], [9.43, -74.78]],
    "córdoba": [[7.35, -76.51], [9.43, -74.78]],
    "quindio": [[4.35, -75.92], [4.76, -75.47]],
    "risaralda": [[4.75, -76.30], [5.55, -75.56]],
    "caldas": [[4.82, -75.92], [5.60, -74.63]]
};

// Lógica de Búsqueda
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');

function realizarBusqueda() {
    const texto = searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!texto) return;

    let boundsEncontrados = null;
    for (let key in departamentosCoordenadas) {
        const keyLimpia = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (keyLimpia.includes(texto) || texto.includes(keyLimpia)) {
            boundsEncontrados = departamentosCoordenadas[key];
            break;
        }
    }

    if (boundsEncontrados) {
        map.fitBounds(boundsEncontrados, { padding: [50, 50] });
        L.popup()
            .setLatLng(map.getCenter())
            .setContent(`<strong>Departamento: ${searchInput.value.toUpperCase()}</strong>`)
            .openOn(map);
    } else {
        alert('Departamento no encontrado. Prueba escribiendo: boyaca, antioquia, cundinamarca...');
    }
}

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', realizarBusqueda);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') realizarBusqueda();
    });
}