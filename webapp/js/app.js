// Crear el mapa centrado en Colombia
const map = L.map('map').setView([4.5709, -74.2973], 6);

// URL del servicio WMS de GeoServer
const geoserverUrl = 'http://localhost:8080/geoserver/taller/wms';

// Capas WMS de GeoServer
const departamentosWMS = L.tileLayer.wms(geoserverUrl, {
    layers: 'taller:departamentos',
    format: 'image/png',
    transparent: true,
    attribution: 'IGAC'
});

const municipiosWMS = L.tileLayer.wms(geoserverUrl, {
    layers: 'taller:municipios',
    format: 'image/png',
    transparent: true,
    attribution: 'IGAC'
});

// Capas base
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }),
    "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    })
};

// Capas superpuestas
const overlayMaps = {
    "Departamentos": departamentosWMS,
    "Municipios": municipiosWMS
};

// Agregar control de capas
L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(map);

// Agregar capa base por defecto
baseMaps["OpenStreetMap"].addTo(map);
departamentosWMS.addTo(map);