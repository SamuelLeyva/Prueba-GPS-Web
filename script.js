$(document).ready(function() {
    // Variables globales
    let map = null;
    let currentMarker = null;
    let destinationMarker = null;
    let routeLayer = null;
    let watchId = null;
    let isTracking = false;
    let isMobile = false;
    let permissionGranted = null;
    let currentLocation = null;
    let destinationLocation = null;
    let adLocation = null;
    let adMarkers = []; // Array para marcadores de anuncios
    let currentUser = null; // Usuario autenticado
    let isLoginMode = true; // Modo actual: login o register

    // Inicialización
    initApp();

    function initApp() {
        detectMobileDevice();
        checkGeolocationPermission();
        setupEventHandlers();
        updateUI();
        
        // Verificar si el usuario ya está autenticado
        checkAuthentication();
        
        // Iniciar mapa y solicitar permiso de ubicación directamente
        initializeAppWithoutPermissionModal();
    }

    // Inicializar aplicación sin modal de permisos
    function initializeAppWithoutPermissionModal() {
        console.log('Iniciando aplicación directamente');
        
        // Mostrar elementos de UI
        $('#map').show();
        $('#floatingGpsBtn').show();
        $('#floating-indicators').show();
        
        // Iniciar mapa con ubicación por defecto inmediatamente
        initializeDefaultMap();
        
        // Retrasar la solicitud de permiso para evitar la violación
        setTimeout(() => {
            requestLocationPermissionNative();
        }, 1000);
    }

    // Solicitar permiso de ubicación de forma nativa
    function requestLocationPermissionNative() {
        if (!navigator.geolocation) {
            showError('Tu navegador no soporta geolocalización');
            // Iniciar mapa con ubicación por defecto
            initializeDefaultMap();
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            function(position) {
                permissionGranted = true;
                updateGPSBadge();
                handleLocationSuccess(position);
            },
            function(error) {
                handleLocationError(error);
                // Iniciar mapa con ubicación por defecto aunque no se tenga permiso
                initializeDefaultMap();
            },
            options
        );
    }

    // Configurar manejadores de eventos
    function setupEventHandlers() {
        // Botón flotante de GPS
        $('#floatingGpsBtn').on('click', getCurrentLocation);
        
        // Panel de ruta
        $('#clearRouteBtn').on('click', clearRoute);
        $('#closeRoutePanel').on('click', closeRoutePanel);
        
        // Eventos del modal principal
        $('#closeModalBtn, #cancelDestinationBtn').on('click', closeModal);
        $('#confirmDestinationBtn').on('click', confirmDestination);
        $('#publishAdBtn').on('click', openAdModal);
        
        // Eventos del modal de autenticación
        $('#closeAuthModalBtn').on('click', closeAuthModal);
        $('#switchToRegisterBtn').on('click', switchToRegister);
        $('#switchToLoginBtn').on('click', switchToLogin);
        $('#submitAuthBtn').on('click', submitAuth);
        
        // Eventos del modal de anuncio
        $('#closeAdModalBtn, #cancelAdBtn').on('click', closeAdModal);
        $('#saveAdBtn').on('click', saveAd);
        
        // Eventos del modal de ver anuncio
        $('#closeViewAdModalBtn, #closeViewAdBtn').on('click', closeViewAdModal);
        
        // Cerrar modales al hacer clic fuera
        $('#destinationModal, #adModal, #viewAdModal, #authModal').on('click', function(e) {
            if (e.target === this) {
                $(this).hide();
            }
        });
        
        // Manejar cambios de tamaño de ventana
        $(window).on('resize', function() {
            if (map) {
                map.invalidateSize();
            }
        });
    }

    // Detectar dispositivo móvil
    function detectMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        if (isMobile) {
            $('#deviceBadge').removeClass('badge-secondary').addClass('badge-primary').html('📱 Móvil');
            $('.subtitle').text('Aplicación móvil con GPS en tiempo real');
            $('#mobileInstructions').show();
        } else {
            $('#deviceBadge').removeClass('badge-primary').addClass('badge-secondary').html('💻 Escritorio');
            $('.subtitle').text('Versión escritorio - GPS desde navegador');
            $('#mobileInstructions').hide();
        }
    }

    // Verificar permisos de geolocalización
    function checkGeolocationPermission() {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
                permissionGranted = result.state === 'granted';
                updateGPSBadge();
                
                result.addEventListener('change', function() {
                    permissionGranted = result.state === 'granted';
                    updateGPSBadge();
                });
            });
        }
    }

      // Actualizar UI según estado
    function updateUI() {
        updateGPSBadge();
    }

    // Actualizar badge de GPS
    function updateGPSBadge() {
        const $gpsBadge = $('#gpsBadge');
        if (permissionGranted === true) {
            $gpsBadge.removeClass('badge-danger').addClass('badge-success').html('✅ GPS Activo');
        } else if (permissionGranted === false) {
            $gpsBadge.removeClass('badge-success').addClass('badge-danger').html('❌ GPS Inactivo');
        } else {
            $gpsBadge.removeClass('badge-success').addClass('badge-danger').html('❌ GPS Inactivo');
        }
    }

    // Obtener ubicación actual
    function getCurrentLocation() {
        const $btn = $('#floatingGpsBtn');
        
        if (!navigator.geolocation) {
            showError('Tu navegador no soporta geolocalización');
            return;
        }

        // Mostrar estado de carga
        $btn.prop('disabled', true).addClass('loading');
        hideError();

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            function(position) {
                handleLocationSuccess(position);
                $btn.prop('disabled', false).removeClass('loading');
                // Iniciar seguimiento después de obtener la ubicación (en respuesta a gesto del usuario)
                if (!isTracking) {
                    startTracking();
                }
            },
            function(error) {
                handleLocationError(error);
                $btn.prop('disabled', false).removeClass('loading');
            },
            options
        );
    }

      // Manejar éxito de geolocalización
    function handleLocationSuccess(position) {
        console.log('Ubicación obtenida exitosamente:', position);
        
        currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };

        initializeMap(currentLocation);
        permissionGranted = true;
        updateGPSBadge();
        hideError();
        
        // No iniciar seguimiento automáticamente para evitar violación
        // El seguimiento se iniciará cuando el usuario haga clic en el botón GPS
        // startTracking();
        
        // Mostrar botón flotante de GPS (ya está visible)
        $('#floatingGpsBtn').show();
        
        console.log('Estado actual:', {
            permissionGranted: permissionGranted,
            currentLocation: currentLocation,
            mapVisible: map !== null
        });
    }

    // Manejar error de geolocalización
    function handleLocationError(error) {
        let errorMessage = 'Error al obtener la ubicación';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permiso de geolocalización denegado. Por favor, permite el acceso a tu ubicación.';
                permissionGranted = false;
                if (isMobile) {
                    $('#mobileErrorHint').show();
                }
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Información de ubicación no disponible';
                break;
            case error.TIMEOUT:
                errorMessage = 'Tiempo de espera agotado al obtener la ubicación';
                break;
        }
        
        showError(errorMessage);
        updateGPSBadge();
    }

    // Inicializar mapa por defecto (sin ubicación del usuario)
    function initializeDefaultMap() {
        console.log('Iniciando mapa con ubicación por defecto');
        
        // Ubicación por defecto (Madrid, España)
        const defaultLocation = {
            lat: 40.4168,
            lng: -3.7038
        };

        // Crear mapa si no existe
        if (!map) {
            map = L.map('map', {
                center: [defaultLocation.lat, defaultLocation.lng],
                zoom: 13,
                zoomControl: !isMobile
            });

            // Agregar capa de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Agregar evento de clic al mapa
            map.on('click', function(e) {
                handleMapClick(e.latlng);
            });
        }
    }

      // Inicializar mapa
    function initializeMap(location) {
        // Crear mapa si no existe
        if (!map) {
            // Configurar iconos personalizados
            const currentLocationIcon = L.divIcon({
                html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10],
                className: 'current-location-marker'
            });

            const destinationIcon = L.divIcon({
                html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12],
                className: 'destination-marker'
            });

            map = L.map('map', {
                center: [location.lat, location.lng],
                zoom: 15,
                zoomControl: !isMobile // Ocultar controles de zoom en móviles
            });

            // Agregar capa de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            // Agregar marcador de ubicación actual
            currentMarker = L.marker([location.lat, location.lng], { icon: currentLocationIcon }).addTo(map);
            
            // Agregar popup al marcador actual
            const popupContent = `
                <div style="text-align: center; min-width: 150px;">
                    <strong style="color: #1f2937;">Tu ubicación actual</strong><br>
                    <small style="color: #6b7280;">
                        Lat: ${location.lat.toFixed(6)}<br>
                        Lng: ${location.lng.toFixed(6)}
                    </small>
                </div>
            `;
            currentMarker.bindPopup(popupContent);
            
            // Agregar evento de clic al mapa
            map.on('click', function(e) {
                handleMapClick(e.latlng);
            });
            
        } else {
            // Actualizar mapa existente
            map.setView([location.lat, location.lng], 15);
            
            // Crear o actualizar marcador si no existe
            if (!currentMarker) {
                const currentLocationIcon = L.divIcon({
                    html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    popupAnchor: [0, -10],
                    className: 'current-location-marker'
                });
                
                currentMarker = L.marker([location.lat, location.lng], { icon: currentLocationIcon }).addTo(map);
                
                // Agregar popup al marcador actual
                const popupContent = `
                    <div style="text-align: center; min-width: 150px;">
                        <strong style="color: #1f2937;">Tu ubicación actual</strong><br>
                        <small style="color: #6b7280;">
                            Lat: ${location.lat.toFixed(6)}<br>
                            Lng: ${location.lng.toFixed(6)}
                        </small>
                    </div>
                `;
                currentMarker.bindPopup(popupContent);
            } else {
                // Actualizar marcador existente
                currentMarker.setLatLng([location.lat, location.lng]);
                
                // Actualizar popup
                const popupContent = `
                    <div style="text-align: center; min-width: 150px;">
                        <strong style="color: #1f2937;">Tu ubicación actual</strong><br>
                        <small style="color: #6b7280;">
                            Lat: ${location.lat.toFixed(6)}<br>
                            Lng: ${location.lng.toFixed(6)}
                        </small>
                    </div>
                `;
                currentMarker.setPopupContent(popupContent);
            }
        }
    }

    // Manejar clic en el mapa
    function handleMapClick(latlng) {
        if (!currentLocation) {
            showError('Primero obtén tu ubicación actual');
            return;
        }

        destinationLocation = {
            lat: latlng.lat,
            lng: latlng.lng
        };

        // Mostrar modal con coordenadas
        $('#destLat').text(latlng.lat.toFixed(6));
        $('#destLng').text(latlng.lng.toFixed(6));
        $('#destinationModal').show();
    }

    // Mostrar modal
    function showModal() {
        $('#destinationModal').show();
    }

    // Cerrar modal
    function closeModal() {
        $('#destinationModal').hide();
        destinationLocation = null;
    }

    // Confirmar destino
    function confirmDestination() {
        if (!destinationLocation || !currentLocation) {
            closeModal();
            return;
        }

        // Guardar temporalmente antes de cerrar el modal
        const tempDestination = { ...destinationLocation };
        
        closeModal();
        
        // Restaurar después de cerrar el modal
        destinationLocation = tempDestination;
        
        createDestinationMarker();
        calculateRoute();
        showRoutePanel();
    }

    // Ver detalles del anuncio
    function viewAdDetails(adId) {
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (isFileProtocol) {
            // Buscar en localStorage
            const anuncios = loadAdsLocalStorage();
            const anuncio = anuncios.find(a => a.id === adId);
            if (anuncio) {
                showViewAdModal(anuncio);
            }
        } else {
            // Buscar en API
            $.ajax({
                url: `/api/anuncios/${adId}`,
                method: 'GET',
                success: function(anuncio) {
                    showViewAdModal(anuncio);
                },
                error: function() {
                    alert('Error al cargar detalles del anuncio');
                }
            });
        }
    }

    // Mostrar mensaje de éxito
    function showSuccess(message) {
        // Crear elemento de éxito temporal
        const successDiv = $('<div class="floating-success">')
            .text(message)
            .css({
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#10b981',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: 10000,
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            });
        
        $('body').append(successDiv);
        
        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            successDiv.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }

    // Abrir modal de anuncio
    function openAdModal() {
        if (!destinationLocation) {
            closeModal();
            return;
        }

        // Verificar si el usuario está autenticado
        if (!currentUser) {
            closeModal();
            showAuthModal();
            return;
        }

        adLocation = { ...destinationLocation };
        
        // Cerrar modal principal
        closeModal();
        
        // Mostrar coordenadas en el modal de anuncio
        $('#adLocationCoords').text(`${adLocation.lat.toFixed(6)}, ${adLocation.lng.toFixed(6)}`);
        
        // Limpiar formulario
        $('#adForm')[0].reset();
        
        // Mostrar modal de anuncio
        $('#adModal').show();
    }

    // Cerrar modal de anuncio
    function closeAdModal() {
        $('#adModal').hide();
        adLocation = null;
    }

    // Guardar anuncio
    function saveAd() {
        const title = $('#adTitle').val().trim();
        const description = $('#adDescription').val().trim();
        const price = $('#adPrice').val();

        if (!title) {
            alert('Por favor, ingresa un título para el anuncio');
            return;
        }

        if (!adLocation) {
            alert('No se ha definido la ubicación del anuncio');
            return;
        }

        const adData = {
            titulo: title,
            descripcion: description || null,
            precio: price ? parseFloat(price) : null,
            latitud: adLocation.lat,
            longitud: adLocation.lng,
            userId: currentUser.id
        };

        // Determinar si estamos en modo file:// o http://
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (isFileProtocol) {
            // Usar localStorage para modo file://
            try {
                const savedAd = saveAdLocalStorage(adData);
                alert('¡Anuncio publicado exitosamente!');
                closeAdModal();
                loadAds(); // Recargar anuncios
            } catch (error) {
                console.error('Error al guardar anuncio local:', error);
                alert('Error al publicar el anuncio. Por favor, intenta nuevamente.');
            }
        } else {
            // Usar API para modo http://
            $.ajax({
                url: '/api/anuncios',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(adData),
                success: function(response) {
                    alert('¡Anuncio publicado exitosamente!');
                    closeAdModal();
                    loadAds(); // Recargar anuncios
                },
                error: function(xhr, status, error) {
                    console.error('Error al guardar anuncio:', error);
                    alert('Error al publicar el anuncio. Por favor, intenta nuevamente.');
                }
            });
        }
    }

    // Cargar anuncios desde la base de datos o localStorage
    function loadAds() {
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (isFileProtocol) {
            // Cargar desde localStorage
            try {
                const anuncios = loadAdsLocalStorage();
                displayAds(anuncios);
            } catch (error) {
                console.error('Error al cargar anuncios locales:', error);
            }
        } else {
            // Cargar desde API
            $.ajax({
                url: '/api/anuncios',
                method: 'GET',
                success: function(anuncios) {
                    displayAds(anuncios);
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar anuncios:', error);
                }
            });
        }
    }

    // Mostrar anuncios en el mapa
    function displayAds(anuncios) {
        // Limpiar marcadores existentes
        adMarkers.forEach(marker => map.removeLayer(marker));
        adMarkers = [];

        // Crear marcadores para cada anuncio
        anuncios.forEach(function(anuncio) {
            createAdMarker(anuncio);
        });
    }

    // Crear marcador de anuncio
    function createAdMarker(anuncio) {
        const adIcon = L.divIcon({
            html: '<div style="background: #f59e0b; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📢</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14],
            className: 'ad-marker'
        });

        const marker = L.marker([anuncio.latitud, anuncio.longitud], { icon: adIcon }).addTo(map);
        
        // Popup con título del anuncio
        const popupContent = `
            <div style="text-align: center; min-width: 200px;">
                <strong style="color: #d97706;">📢 ${anuncio.titulo}</strong><br>
                <small style="color: #6b7280;">
                    ${anuncio.user ? '👤 ' + anuncio.user.username : '👤 Usuario desconocido'}<br>
                    ${anuncio.precio ? '💰 $' + anuncio.precio.toFixed(2) : ''}
                </small><br>
                <button onclick="viewAdDetails('${anuncio.id}')" style="margin-top: 8px; padding: 4px 8px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Ver detalles
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Guardar referencia al anuncio en el marcador
        marker.anuncioData = anuncio;
        
        adMarkers.push(marker);
    }

    // Ver detalles del anuncio (función global para que pueda ser llamada desde el popup)
    window.viewAdDetails = function(anuncioId) {
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (isFileProtocol) {
            // Cargar desde localStorage
            try {
                const anuncios = loadAdsLocalStorage();
                const anuncio = anuncios.find(ad => ad.id === anuncioId);
                if (anuncio) {
                    showViewAdModal(anuncio);
                } else {
                    alert('Anuncio no encontrado');
                }
            } catch (error) {
                console.error('Error al cargar detalles del anuncio:', error);
                alert('Error al cargar los detalles del anuncio');
            }
        } else {
            // Cargar desde API
            $.ajax({
                url: `/api/anuncios/${anuncioId}`,
                method: 'GET',
                success: function(anuncio) {
                    showViewAdModal(anuncio);
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar detalles del anuncio:', error);
                    alert('Error al cargar los detalles del anuncio');
                }
            });
        }
    };

    // Mostrar modal para ver anuncio
    function showViewAdModal(anuncio) {
        $('#viewAdTitle').text(anuncio.titulo);
        $('#viewAdUser').text(anuncio.user ? anuncio.user.username : 'Usuario desconocido');
        $('#viewAdDescription').text(anuncio.descripcion || 'Sin descripción');
        $('#viewAdPrice').text(anuncio.precio ? '$' + anuncio.precio.toFixed(2) : 'No especificado');
        $('#viewAdLocation').text(`${anuncio.latitud.toFixed(6)}, ${anuncio.longitud.toFixed(6)}`);
        $('#viewAdDate').text(new Date(anuncio.createdAt).toLocaleString());
        
        $('#viewAdModal').show();
    }

    // Cerrar modal de ver anuncio
    function closeViewAdModal() {
        $('#viewAdModal').hide();
    }

    // Crear marcador de destino
    function createDestinationMarker() {
        if (!destinationLocation) {
            console.error('No hay destino definido');
            return;
        }

        const destinationIcon = L.divIcon({
            html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
            className: 'destination-marker'
        });

        if (destinationMarker) {
            destinationMarker.remove();
        }

        destinationMarker = L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destinationIcon }).addTo(map);
        
        const popupContent = `
            <div style="text-align: center; min-width: 150px;">
                <strong style="color: #dc2626;">🎯 Destino</strong><br>
                <small style="color: #6b7280;">
                    Lat: ${destinationLocation.lat.toFixed(6)}<br>
                    Lng: ${destinationLocation.lng.toFixed(6)}
                </small>
            </div>
        `;
        destinationMarker.bindPopup(popupContent);
    }

    // Calcular ruta
    function calculateRoute() {
        if (!currentLocation || !destinationLocation) return;

        // Usar OpenRouteService API para ruta real por calles
        getRealRoute();
    }

    // Obtener ruta real usando OSRM API (completamente gratuito, sin CORS issues)
    function getRealRoute() {
        // Determinar perfil de ruta según el dispositivo
        const profile = isMobile ? 'foot' : 'car';
        
        // OSRM API - Gratuito, sin API key, soporta CORS
        const url = `https://router.project-osrm.org/route/v1/${profile}/`;
        
        const coordinates = [
            [currentLocation.lng, currentLocation.lat].join(','),
            [destinationLocation.lng, destinationLocation.lat].join(',')
        ].join(';');

        const fullUrl = `${url}${coordinates}?overview=full&geometries=geojson&alternatives=false`;

        // Mostrar indicador de carga
        showRouteLoading();

        $.ajax({
            url: fullUrl,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response && response.routes && response.routes.length > 0) {
                    drawOSRMRoute(response);
                } else {
                    console.warn('No se encontró ruta, usando línea recta');
                    createDirectRoute();
                }
            },
            error: function(xhr, status, error) {
                console.warn('Error en API de rutas:', error);
                console.log('Usando línea recta como alternativa');
                createDirectRoute();
            }
        });
    }

    // Dibujar ruta de OSRM
    function drawOSRMRoute(response) {
        // Limpiar ruta anterior
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        // Extraer coordenadas de la ruta
        const route = response.routes[0];
        const coordinates = route.geometry.coordinates;
        
        // Convertir coordenadas [lng, lat] a [lat, lng] para Leaflet
        const routeCoordinates = coordinates.map(coord => [coord[1], coord[0]]);

        // Crear polilínea con la ruta real
        routeLayer = L.polyline(routeCoordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(map);

        // Obtener distancia y tiempo de la respuesta
        const distance = route.distance; // en metros
        const duration = route.duration; // en segundos

        // Actualizar información de ruta
        updateRealRouteInfo(distance, duration);
        
        // Ajustar vista para mostrar ruta completa
        if (currentMarker && destinationMarker) {
            const group = new L.featureGroup([currentMarker, destinationMarker, routeLayer]);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Mostrar indicador de carga de ruta
    function showRouteLoading() {
        $('#routeDistance').text('Calculando...');
        $('#routeTime').text('...');
        $('#routeInfo').show();
    }

    // Dibujar ruta real
    function drawRealRoute(response) {
        // Limpiar ruta anterior
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        // Extraer coordenadas de la ruta
        const routeFeature = response.features[0];
        const coordinates = routeFeature.geometry.coordinates;
        
        // Convertir coordenadas [lng, lat] a [lat, lng] para Leaflet
        const routeCoordinates = coordinates.map(coord => [coord[1], coord[0]]);

        // Crear polilínea con la ruta real
        routeLayer = L.polyline(routeCoordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(map);

        // Obtener distancia y tiempo de la respuesta
        const properties = routeFeature.properties;
        const distance = properties.segments[0].distance; // en metros
        const duration = properties.segments[0].duration; // en segundos

        // Actualizar información de ruta
        updateRealRouteInfo(distance, duration);
        
        // Ajustar vista para mostrar ruta completa
        if (currentMarker && destinationMarker) {
            const group = new L.featureGroup([currentMarker, destinationMarker, routeLayer]);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Actualizar información de ruta real
    function updateRealRouteInfo(distanceMeters, durationSeconds) {
        // Convertir distancia
        let distanceText;
        if (distanceMeters < 1000) {
            distanceText = Math.round(distanceMeters) + ' m';
        } else {
            distanceText = (distanceMeters / 1000).toFixed(2) + ' km';
        }

        // Convertir duración
        let timeText;
        if (durationSeconds < 60) {
            timeText = Math.round(durationSeconds) + ' seg';
        } else if (durationSeconds < 3600) {
            const minutes = Math.round(durationSeconds / 60);
            timeText = minutes + ' min';
        } else {
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.round((durationSeconds % 3600) / 60);
            timeText = hours + 'h ' + minutes + 'min';
        }

        $('#routeDistance').text(distanceText);
        $('#routeTime').text(timeText);
        $('#routeInfo').show();
    }

    // Crear ruta directa (línea recta)
    function createDirectRoute() {
        if (!currentLocation || !destinationLocation) {
            console.error('Faltan coordenadas para crear ruta');
            return;
        }

        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        const routeCoordinates = [
            [currentLocation.lat, currentLocation.lng],
            [destinationLocation.lat, destinationLocation.lng]
        ];

        routeLayer = L.polyline(routeCoordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);

        // Calcular distancia aproximada
        const distance = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            destinationLocation.lat, destinationLocation.lng
        );

        // Actualizar información de ruta
        updateRouteInfo(distance);
        
        // Ajustar vista para mostrar ruta completa
        if (currentMarker && destinationMarker) {
            const group = new L.featureGroup([currentMarker, destinationMarker, routeLayer]);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Calcular distancia entre dos puntos
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    }

    // Actualizar información de ruta
    function updateRouteInfo(distanceKm) {
        showRoutePanel();
        
        const distance = distanceKm < 1 ? 
            (distanceKm * 1000).toFixed(0) + ' m' : 
            distanceKm.toFixed(2) + ' km';
        
        // Tiempo estimado (asumiendo 5 km/h para caminar, 30 km/h para coche)
        const speedKmh = isMobile ? 5 : 30; // Velocidad promedio
        const timeHours = distanceKm / speedKmh;
        const timeMinutes = Math.round(timeHours * 60);
        
        let timeText;
        if (timeMinutes < 60) {
            timeText = timeMinutes + ' min';
        } else {
            const hours = Math.floor(timeMinutes / 60);
            const minutes = timeMinutes % 60;
            timeText = hours + 'h ' + minutes + 'min';
        }

        // Velocidad promedio
        const speedText = speedKmh.toFixed(1) + ' km/h';
        
        // Llegada estimada
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + (timeHours * 60 * 60 * 1000));
        const arrivalText = arrivalTime.toLocaleTimeString();

        $('#routeDistance').text(distance);
        $('#routeTime').text(timeText);
        // Campos eliminados: velocidad y llegada
        // $('#routeSpeed').text(speedText);
        // $('#routeETA').text(arrivalText);
    }

    // Limpiar ruta
    function clearRoute() {
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        
        if (destinationMarker) {
            destinationMarker.remove();
            destinationMarker = null;
        }
        
        destinationLocation = null;
        closeRoutePanel();
    }

    // Mostrar panel de ruta
    function showRoutePanel() {
        $('#routePanel').show();
        // Agregar clase al body para ajustar el mapa
        if (window.innerWidth <= 480) {
            $('body').addClass('has-bottom-nav-mobile');
        } else {
            $('body').addClass('has-bottom-nav');
        }
    }

    // Cerrar panel de ruta
    function closeRoutePanel() {
        $('#routePanel').hide();
        // Remover clases del body
        $('body').removeClass('has-bottom-nav has-bottom-nav-mobile');
    }

    // Iniciar seguimiento
    function startTracking() {
        if (!navigator.geolocation) {
            showError('Tu navegador no soporta geolocalización');
            return;
        }

        isTracking = true;
        hideError();

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        };

        watchId = navigator.geolocation.watchPosition(
            function(position) {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                currentLocation = location;
                
                if (map) {
                    map.setView([location.lat, location.lng], 15);
                    if (currentMarker) {
                        currentMarker.setLatLng([location.lat, location.lng]);
                        
                        const popupContent = `
                            <div style="text-align: center; min-width: 150px;">
                                <strong style="color: #1f2937;">Tu ubicación actual</strong><br>
                                <small style="color: #6b7280;">
                                    Lat: ${location.lat.toFixed(6)}<br>
                                    Lng: ${location.lng.toFixed(6)}
                                </small>
                            </div>
                        `;
                        currentMarker.setPopupContent(popupContent);
                    }
                    
                    // Si hay una ruta activa, actualizarla
                    if (destinationLocation && routeLayer) {
                        updateRoute();
                    }
                }
                
                permissionGranted = true;
                updateGPSBadge();
            },
            function(error) {
                console.error('Error en seguimiento:', error);
                handleLocationError(error);
                stopTracking();
            },
            options
        );
    }

    // Actualizar ruta durante seguimiento
    function updateRoute() {
        if (!currentLocation || !destinationLocation) return;

        const routeCoordinates = [
            [currentLocation.lat, currentLocation.lng],
            [destinationLocation.lat, destinationLocation.lng]
        ];

        if (routeLayer) {
            routeLayer.setLatLngs(routeCoordinates);
        }

        // Recalcular distancia y tiempo
        const distance = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            destinationLocation.lat, destinationLocation.lng
        );
        updateRouteInfo(distance);
    }

    // Detener seguimiento
    function stopTracking() {
        isTracking = false;
        
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }

    // Mostrar error
    function showError(message) {
        $('#errorText').text(message);
        $('#errorMessage').show();
    }

    // Ocultar error
    function hideError() {
        $('#errorMessage').hide();
        $('#mobileErrorHint').hide();
    }

    // Verificar autenticación al cargar la página
    function checkAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('Usuario autenticado:', currentUser);
        }
    }

    // Mostrar modal de autenticación
    function showAuthModal() {
        $('#authModal').show();
    }

    // Cerrar modal de autenticación
    function closeAuthModal() {
        $('#authModal').hide();
    }

    // Cambiar a modo registro
    function switchToRegister() {
        isLoginMode = false;
        $('#loginForm').hide();
        $('#registerForm').show();
        $('#authModalTitle').text('🔐 Registrarse');
        $('#switchToRegisterBtn').hide();
        $('#switchToLoginBtn').show();
        $('#submitAuthBtn .btn-text').text('Registrarse');
    }

    // Cambiar a modo login
    function switchToLogin() {
        isLoginMode = true;
        $('#registerForm').hide();
        $('#loginForm').show();
        $('#authModalTitle').text('🔐 Iniciar Sesión');
        $('#switchToLoginBtn').hide();
        $('#switchToRegisterBtn').show();
        $('#submitAuthBtn .btn-text').text('Iniciar Sesión');
    }

    // Enviar formulario de autenticación
    async function submitAuth() {
        const action = isLoginMode ? 'login' : 'register';
        let data;

        if (isLoginMode) {
            const identifier = $('#loginIdentifier').val().trim();
            const password = $('#loginPassword').val();

            if (!identifier || !password) {
                showError('Por favor completa todos los campos');
                return;
            }

            // Determinar si es email o teléfono
            const isEmail = identifier.includes('@');
            data = {
                action,
                [isEmail ? 'email' : 'phone']: identifier,
                password
            };
        } else {
            const username = $('#registerUsername').val().trim();
            const phone = $('#registerPhone').val().trim();
            const password = $('#registerPassword').val();
            const confirmPassword = $('#confirmPassword').val();

            if (!username || !password || !phone) {
                showError('Por favor completa los campos requeridos');
                return;
            }

            if (password !== confirmPassword) {
                showError('Las contraseñas no coinciden');
                return;
            }

            data = {
                action,
                username,
                phone,
                password
            };
        }

        try {
            // Determinar si estamos en modo file:// o http://
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isFileProtocol) {
                // Usar localStorage para autenticación local
                submitAuthLocalStorage(data);
            } else {
                // Usar API del servidor
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    if (isLoginMode) {
                        // Guardar usuario en localStorage
                        currentUser = result.user;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        showSuccess('Inicio de sesión exitoso');
                        closeAuthModal();
                    } else {
                        showSuccess('Registro exitoso. Por favor inicia sesión.');
                        switchToLogin(); // Cambiar a modo login
                    }
                } else {
                    showError(result.error || 'Error en la autenticación');
                }
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            showError('Error de conexión. Intenta nuevamente.');
        }
    }

    // Enviar formulario de autenticación a localStorage
    function submitAuthLocalStorage(data) {
        const action = isLoginMode ? 'login' : 'register';
        let users = JSON.parse(localStorage.getItem('users') || '[]');

        if (isLoginMode) {
            // Login
            const user = users.find(u => u.phone === data.phone);
            
            if (!user) {
                showError('Usuario no encontrado');
                return;
            }

            if (user.password !== data.password) {
                showError('Contraseña incorrecta');
                return;
            }

            // Login exitoso
            currentUser = {
                id: user.id,
                username: user.username,
                phone: user.phone
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showSuccess('Inicio de sesión exitoso');
            closeAuthModal();

        } else {
            // Registro
            // Verificar si el usuario ya existe
            const existingUser = users.find(u => u.username === data.username || u.phone === data.phone);
            
            if (existingUser) {
                showError('El usuario o teléfono ya está registrado');
                return;
            }

            // Crear nuevo usuario
            const newUser = {
                id: 'user_' + Date.now(),
                username: data.username,
                phone: data.phone,
                password: data.password // En modo local no encriptamos
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            showSuccess('Registro exitoso. Por favor inicia sesión.');
            switchToLogin(); // Cambiar a modo login
        }
    }

    // Manejar cierre de página
    $(window).on('beforeunload', function() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
});