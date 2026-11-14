// Crear el mapa centrado en el departamento de Boyacá
const map = L.map('map').setView([5.45, -73.36], 8);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// URL del servicio WMS de GeoServer
const geoserverUrl = 'https://geoportal.dane.gov.co/mparcgis/services/MGN2024/Serv_CapasMGN_2024/MapServer/WMSServer';

// Código DANE del departamento a mostrar: Boyacá
const BOYACA_CCDGO = '15';

// Agregar capa WMS de departamentos
const departamentosWMS = L.tileLayer.wms(geoserverUrl, {
    layers: '8',
    format: 'image/png',
    transparent: true,
    attribution: 'DANE - Departamento Administrativo Nacional de Estadística'
}).addTo(map);

// URL del servicio WFS
const departamentosWFSUrl = 'datos/departamentos.geojson';
let departamentosGeoJSON; // Variable para almacenar la capa GeoJSON

// Cargar y mostrar departamentos como GeoJSON
fetch(departamentosWFSUrl)
    .then(response => response.json())
    .then(data => {
        // Crear capa GeoJSON (solo Boyacá)
        departamentosGeoJSON = L.geoJSON(data, {
            filter: feature => feature.properties.dpto_ccdgo === BOYACA_CCDGO,
            style: {
                color: '#232323',
                weight: 2,
                fillColor: '#e8f881',
                fillOpacity: 0.5
            },
            onEachFeature: onEachFeature
        });

        // Agregar al mapa
        departamentosGeoJSON.addTo(map);
        controlLayer.addOverlay(departamentosGeoJSON, "Departamentos (WFS)");

        // Extensión de Boyacá
        const boyacaBounds = departamentosGeoJSON.getBounds();

        // Restringir las teselas de ambos WMS a la extensión de Boyacá
        departamentosWMS.options.bounds = boyacaBounds;
        departamentosWMS.redraw();
        municipiosWMS.options.bounds = boyacaBounds;

        // Centrar la vista en el departamento de Boyacá
        map.fitBounds(boyacaBounds);
    })
    .catch(error => console.error('Error cargando WFS:', error));

// Agregar capa WMS de municipios
const municipiosWMS = L.tileLayer.wms(geoserverUrl, {
    layers: '7',
    format: 'image/png',
    transparent: true,
    attribution: 'DANE - Departamento Administrativo Nacional de Estadística'
});

// Capas base
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }),
    "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    })
};

// Capas superpuestas
let overlayMaps = {
    "Departamentos": departamentosWMS,    
    "Municipios": municipiosWMS
};

// Agregar control de capas
const controlLayer = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(map);

// Agregar capa base por defecto
baseMaps["OpenStreetMap"].addTo(map);

// ============================================================
// Capas detalladas de Boyacá (cartografía base IGAC/DANE)
// Datos recortados por departamento en datos/15_BOYACA/.
// ============================================================
const boyacaDataDir = 'https://epiragauta.github.io/geoservicios_y_websites/webapp/datos/15_BOYACA/';

const capasBoyaca = [
    {
        file: 'Administrativo_P.geojson', label: 'Topónimos administrativos',
        tipo: 'punto', color: '#c62828', radio: 4
    },
    {
        file: 'Construccion_P.geojson', label: 'Construcciones',
        tipo: 'punto', color: '#6d4c41', radio: 3
    },
    {
        file: 'Costero_Insular.geojson', label: 'Costero / insular',
        tipo: 'punto', color: '#00838f', radio: 4
    },
    {
        file: 'Via.geojson', label: 'Vías',
        tipo: 'linea', estilo: { color: '#e65100', weight: 1.5 }
    },
    {
        file: 'Drenaje_Sencillo.geojson', label: 'Drenaje sencillo',
        tipo: 'linea', estilo: { color: '#1e88e5', weight: 1 }
    },
    {
        file: 'Curva_Nivel.geojson', label: 'Curvas de nivel',
        tipo: 'linea', estilo: { color: '#8d6e63', weight: 0.8 }
    },
    {
        file: 'Laguna.geojson', label: 'Lagunas',
        tipo: 'poligono', estilo: { color: '#0277bd', weight: 1, fillColor: '#4fc3f7', fillOpacity: 0.5 }
    },
    {
        file: 'Bosque.geojson', label: 'Bosques',
        tipo: 'poligono', estilo: { color: '#1b5e20', weight: 1, fillColor: '#66bb6a', fillOpacity: 0.4 }
    }
];

// Construye el contenido del popup a partir de los atributos más relevantes
function popupBoyaca(props) {
    const campos = [
        ['NOMBRE_GEO', 'Nombre'],
        ['TIPO_VIA', 'Tipo de vía'],
        ['ESTADO_SUP', 'Estado superficie'],
        ['ESTADO_DRE', 'Estado drenaje'],
        ['ALTURA_SOB', 'Altura (m)'],
        ['TIPO_CURVA', 'Tipo de curva'],
        ['CODIGO_USO', 'Código de uso'],
        ['CODIGO_NOM', 'Código']
    ];
    const filas = campos
        .filter(([k]) => props[k] !== undefined && props[k] !== null && props[k] !== '')
        .map(([k, etiqueta]) => `<p style="margin:2px 0"><strong>${etiqueta}:</strong> ${props[k]}</p>`);
    return filas.length ? `<div>${filas.join('')}</div>` : '<div>Sin atributos</div>';
}

// Carga (una sola vez) el GeoJSON de una capa dentro de su layerGroup
function cargarCapaBoyaca(cfg) {
    fetch(boyacaDataDir + cfg.file)
        .then(response => response.json())
        .then(data => {
            const capa = L.geoJSON(data, {
                style: cfg.estilo,
                pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
                    radius: cfg.radio || 4,
                    color: cfg.color,
                    fillColor: cfg.color,
                    weight: 1,
                    fillOpacity: 0.8
                }),
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        layer.bindPopup(popupBoyaca(feature.properties));
                    }
                }
            });
            capa.addTo(cfg._group);
        })
        .catch(error => console.error('Error cargando capa ' + cfg.file + ':', error));
}

// Registrar cada capa como overlay con carga diferida
capasBoyaca.forEach(cfg => {
    cfg._group = L.layerGroup();
    cfg._loaded = false;
    controlLayer.addOverlay(cfg._group, cfg.label);
});

// Al activar una capa por primera vez, descargar su GeoJSON
map.on('overlayadd', function (e) {
    const cfg = capasBoyaca.find(c => c._group === e.layer);
    if (cfg && !cfg._loaded) {
        cfg._loaded = true;
        cargarCapaBoyaca(cfg);
    }
});

function onEachFeature(feature, layer) {
    // Popup al hacer clic
    if (feature.properties) {
        const popupContent = `
            <div style="text-align: center;">
                <h3>${feature.properties.dpto_cnmbr}</h3>
                <p><strong>Código:</strong> ${feature.properties.dpto_ccdgo}</p>
            </div>
        `;
        layer.bindPopup(popupContent);
    }

    // Highlight al pasar el mouse
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        fillOpacity: 0.7
    });

    layer.bringToFront();
}

function resetHighlight(e) {
    const layer = e.target;
    layer.setStyle({
        weight: 2,
        color: '#232323',
        fillOpacity: 0.5
    });
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Control de escala
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(map);

// Panel de información
const info = L.control({position: 'topleft'});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = `
        <h4>Boyacá - Servicios Geográficos</h4>
        <p>Visualización del departamento y sus municipios</p>
        <p><small>Datos: DANE | Servidor: GeoServer</small></p>
    `;
    return this._div;
};

info.addTo(map);

// Crear control de búsqueda
const searchControl = L.control({position: 'topright'});

searchControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'search-control');
    div.innerHTML = `
        <input type="text" id="search-input" placeholder="Buscar departamento...">
        <button id="search-button">Buscar</button>
    `;
    L.DomEvent.disableClickPropagation(div);
    return div;
};

searchControl.addTo(map);

// Función de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    function buscar() {
        const searchText = searchInput.value.trim().toLowerCase();
        if (!searchText || !departamentosGeoJSON) return;

        let encontrado = null;
        departamentosGeoJSON.eachLayer(function(layer) {
            const nombre = layer.feature.properties.dpto_cnmbr.toLowerCase();
            if (!encontrado && nombre.includes(searchText)) {
                encontrado = layer;
            }
        });

        if (encontrado) {
            map.fitBounds(encontrado.getBounds());
            encontrado.openPopup();
        } else {
            alert('No se encontró el departamento: ' + searchInput.value);
        }
    }

    searchButton.addEventListener('click', buscar);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') buscar();
    });
});

// Marcador de Tunja (capital de Boyacá)
const tunjaMarker = L.marker([5.5352, -73.3678])
    .addTo(map)
    .bindPopup('<b>Tunja</b><br>Capital de Boyacá');