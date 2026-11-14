// Crear el mapa centrado en Colombia
const map = L.map('map').setView([4.5709, -74.2973], 6);

// URLs de los servicios de GeoServer
const geoserverWmsUrl = 'http://localhost:8080/geoserver/taller/wms';
const geoserverWfsUrl = 'http://localhost:8080/geoserver/taller/wfs';

// Capas WMS de GeoServer (Visualización)
const departamentosWMS = L.tileLayer.wms(geoserverWmsUrl, {
    layers: 'taller:departamentos',
    format: 'image/png',
    transparent: true,
    attribution: 'IGAC'
});

const municipiosWMS = L.tileLayer.wms(geoserverWmsUrl, {
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
    "Departamentos (WMS)": departamentosWMS,
    "Municipios": municipiosWMS
};

// Agregar control de capas
L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(map);

// Agregar capa base y WMS por defecto
baseMaps["OpenStreetMap"].addTo(map);
departamentosWMS.addTo(map);

// ==========================================
// CAPA WFS PARA INTERACTIVIDAD (Clic, Popup y Zoom)
// ==========================================
let geojsonLayer;
const departamentosData = [];

const wfsUrl = `${geoserverWfsUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=taller:departamentos&outputFormat=application/json`;

fetch(wfsUrl)
    .then(response => {
        if (!response.ok) throw new Error('Error al conectar con WFS');
        return response.json();
    })
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#3388ff',
                weight: 2,
                fillOpacity: 0.05
            },
            onEachFeature: function (feature, layer) {
                // Obtener el nombre del departamento (ajustar atributo según GeoServer)
                const nombreDepto = feature.properties.depto_cnmbr || feature.properties.NOMBRE_DPT || 'Departamento';
                
                // Guardar referencia para el buscador
                departamentosData.push({ name: nombreDepto.toLowerCase(), layer: layer });

                // Configurar Popup
                layer.bindPopup(`<strong>${nombreDepto}</strong>`);

                // Eventos de interacción al pasar el cursor y hacer clic
                layer.on({
                    mouseover: function (e) {
                        e.target.setStyle({ weight: 3, color: '#e63946', fillOpacity: 0.3 });
                    },
                    mouseout: function (e) {
                        geojsonLayer.resetStyle(e.target);
                    },
                    click: function (e) {
                        // Hace zoom automático al departamento seleccionado
                        map.fitBounds(e.target.getBounds(), { padding: [50, 50] });
                    }
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error cargando WFS:', error));

// ==========================================
// LÓGICA DE BÚSQUEDA
// ==========================================
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', realizarBusqueda);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') realizarBusqueda();
    });
}

function realizarBusqueda() {
    const textoBusqueda = searchInput.value.toLowerCase().trim();
    if (!textoBusqueda) return;

    const encontrado = departamentosData.find(item => item.name.includes(textoBusqueda));

    if (encontrado) {
        map.fitBounds(encontrado.layer.getBounds(), { padding: [50, 50] });
        encontrado.layer.openPopup();
    } else {
        alert('Departamento no encontrado en el sistema.');
    }
}
