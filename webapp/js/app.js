// ==========================================
// CAPA WFS PARA INTERACTIVIDAD Y BÚSQUEDA
// ==========================================
let geojsonLayer;
const departamentosData = [];

// Usamos WFS versión 1.1.0 que es totalmente estable para exportar application/json en GeoServer
const wfsUrl = 'http://localhost:8080/geoserver/taller/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=taller:departamentos&outputFormat=application/json&srsName=EPSG:4326';

fetch(wfsUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("¡Datos WFS cargados con éxito!", data); // Útil para revisar en la consola F12

        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#3388ff',
                weight: 2,
                fillOpacity: 0.1
            },
            onEachFeature: function (feature, layer) {
                // Imprimir propiedades en consola para verificar los nombres exactos de los campos
                console.log("Propiedades del departamento:", feature.properties);

                // Capturar el nombre del departamento contemplando variaciones de mayúsculas/minúsculas
                const props = feature.properties;
                const nombreDepto = props.depto_cnmbr || props.NOMBRE_DPT || props.DPTO_CNMBR || props.NOMBRE_DEP || 'Sin nombre';
                const codigoDepto = props.depto_ccdgo || props.COD_DPTO || props.DPTO_CCDGO || '';

                // Guardar en el arreglo para que funcione la barra de búsqueda
                departamentosData.push({ 
                    name: nombreDepto.toLowerCase().trim(), 
                    layer: layer 
                });

                // Configurar Popup
                layer.bindPopup(`<strong>${nombreDepto}</strong><br>Código: ${codigoDepto}`);

                // Eventos del mouse y zoom al hacer clic
                layer.on({
                    mouseover: function (e) {
                        e.target.setStyle({ weight: 3, color: '#e63946', fillOpacity: 0.4 });
                    },
                    mouseout: function (e) {
                        geojsonLayer.resetStyle(e.target);
                    },
                    click: function (e) {
                        map.fitBounds(e.target.getBounds(), { padding: [50, 50] });
                    }
                });
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error('Fallo al conectar con el WFS de GeoServer:', error);
    });
