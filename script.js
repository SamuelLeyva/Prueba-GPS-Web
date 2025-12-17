$(document).ready(function() {

    let isLoggedIn = false;
    let currentUser = null;


    // Verificar sesión al cargar
    function checkSession() {
        $.post('auth.php', { action: 'check_session' }, function(res) {
            if (res.status === 'logged_in') {
                isLoggedIn = true;
                currentUser = res.user;
                updateUI(); // Función nueva para actualizar interfaz
            }
        }, 'json');
    }
    checkSession();
    
    // Coordenadas iniciales: La Habana, Cuba
    const havanaCoords = [23.1136, -82.3666];

      // Inicializar el mapa
    // Deshabilitar el control de zoom y el control de atribución por defecto
    var map = L.map('map', {
        center: havanaCoords,
        zoom: 13,
        zoomControl: false,       // Quita los botones +/-
        attributionControl: false // Quita el cartelito de "Leaflet | © OpenStreetMap contributors"
    });
    
    // Variable para almacenar el marcador de la ubicación del usuario.
    // Esto es crucial para poder actualizarlo en lugar de crear uno nuevo.
    let userMarker = null;

    let tempAdMarker = null; // Marcador temporal rojo antes de guardar
    let adsLayer = L.layerGroup().addTo(map); // Capa para guardar todos los anuncios
    const ZOOM_THRESHOLD = 15; // Nivel de zoom para mostrar detalles (ajustable)

  

    // Cargar capas de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // --- EVENTO CLICK EN MAPA ---
    map.on('click', function(e) {
        // 1. Si NO está logueado -> Mostrar Login
        if (!isLoggedIn) {
            $('#auth-modal').fadeIn(300);
            $('#auth-message').text('Inicia sesión para publicar un anuncio.').css('color', '#4285F4');
            return;
        }

        // 2. Si ESTÁ logueado -> Poner punto rojo temporal
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Si ya hay un marcador temporal, lo quitamos para poner el nuevo
        if (tempAdMarker) {
            map.removeLayer(tempAdMarker);
        }

        // Crear marcador temporal
        tempAdMarker = L.marker([lat, lng], {icon: redDotIcon}).addTo(map);

        // Crear contenido del popup con botón
        const popupContent = `
            <div style="text-align:center">
                <p style="margin:5px 0">¿Publicar aquí?</p>
                <button id="open-create-ad" class="submit-btn" style="padding:5px 10px; font-size:12px;">Crear Anuncio</button>
            </div>
        `;

        tempAdMarker.bindPopup(popupContent).openPopup();

        // Guardar coordenadas en el formulario oculto (por si acaso)
        $('#ad-lat').val(lat);
        $('#ad-lng').val(lng);

        
    });

    // --- NUEVO EVENTO: Quitar marcador temporal al cerrar el popup ---
map.on('popupclose', function(e) {
    // Verificamos si el popup que se cierra pertenece a nuestro marcador temporal
    if (tempAdMarker && e.popup._source === tempAdMarker) {
        map.removeLayer(tempAdMarker);
        tempAdMarker = null; // Reiniciamos la variable
        console.log("Marcador temporal eliminado tras cierre de popup.");
    }
});

    // Delegación de eventos para el botón dentro del Popup de Leaflet
    $('body').on('click', '#open-create-ad', function() {
        if(tempAdMarker) {
            tempAdMarker.closePopup(); // Cierra el globito pequeño
            $('#create-ad-modal').fadeIn(300); // Abre la modal grande
        }
    });


    // --- ENVIAR NUEVO ANUNCIO ---
    $('#ad-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = $(this).serialize() + '&action=create';
        const submitBtn = $(this).find('button[type="submit"]');
        submitBtn.prop('disabled', true).text('Publicando...');

        $.post('ads.php', formData, function(res) {
            submitBtn.prop('disabled', false).text('Publicar Anuncio');
            
            if (res.status === 'success') {
                $('#create-ad-modal').fadeOut();
                $('#ad-form')[0].reset();
                
                // Convertir el marcador temporal en permanente
                if (tempAdMarker) {
                    map.removeLayer(tempAdMarker); // Quitar el temporal
                    tempAdMarker = null;
                }
                
                // Recargar anuncios (o agregar el nuevo manualmente)
                loadAds(); 
                alert('¡Anuncio publicado!');
            } else {
                alert('Error: ' + res.message);
            }
        }, 'json');
    });

    // Cerrar modal de anuncio
    $('.close-ad-modal').on('click', function() {
        $('#create-ad-modal').fadeOut();
        if (tempAdMarker) {
            map.removeLayer(tempAdMarker); // Si cancela, borramos el punto rojo
            tempAdMarker = null;
        }
    });

    // Definir el icono personalizado (Punto Azul con CSS)
    const blueDotIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div><div class="pin"></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20] // Centrar el icono
    });

    // Icono Rojo para anuncios
    const redDotIcon = L.divIcon({
        className: 'ad-marker',
        html: '<div class="pulse red"></div><div class="pin red"></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // --- Función que activa la geolocalización ---
    function locateUser() {
        if (navigator.geolocation) {
            // Pide el permiso de ubicación o lo usa si ya fue concedido
            navigator.geolocation.getCurrentPosition(
                showPosition, // Función de éxito
                showError,    // Función de error (si deniegan o falla)
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
        }
    }

    // Función de éxito del GPS
    function showPosition(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newLatLng = [lat, lng];

        // 1. Mostrar/Actualizar el marcador
        if (userMarker) {
            // Si el marcador ya existe, actualiza su posición
            userMarker.setLatLng(newLatLng);
        } else {
            // Si es la primera vez, crea el marcador y lo guarda
            userMarker = L.marker(newLatLng, {icon: blueDotIcon}).addTo(map);
        }

        // 2. Centrar el mapa en la ubicación del usuario con animación
        // El zoom 15 es un buen nivel para la calle.
        map.flyTo(newLatLng, 15, {
            duration: 1.5 
        });
        
        console.log("Ubicación encontrada y centrada: " + lat + ", " + lng);
        
        // NOTA: El usuario puede moverse libremente después del centrado.
    }

    // Función de error (si deniegan o falla)
    function showError(error) {
        let message = "";
        switch (error.code) {
            case error.PERMISSION_DENIED:
                // Si deniegan el permiso, simplemente informa y el mapa permanece donde está.
                message = "Permiso de ubicación denegado. Puedes seguir usando el mapa normalmente.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Información de ubicación no disponible.";
                break;
            case error.TIMEOUT:
                message = "Tiempo de espera agotado para obtener ubicación.";
                break;
            case error.UNKNOWN_ERROR:
                message = "Error desconocido al obtener ubicación.";
                break;
        }
        alert("No se pudo obtener la ubicación: " + message);
    }
    
    // --- Evento Click del Botón GPS (Usando jQuery) ---
    $('#gps-button').on('click', function() {
        locateUser();
    });


    // ... (Tu código del mapa y GPS anterior va aquí) ...

    // --- LÓGICA DEL MODAL DE AUTENTICACIÓN ---

    const modal = $('#auth-modal');
    const userBtn = $('#user-button');
    const closeBtn = $('.close-modal');
    const tabBtns = $('.tab-btn');
    const forms = $('.auth-form');

    // 1. Abrir Modal
  // Lógica del botón de usuario (Inteligente)
    userBtn.off('click').on('click', function() {
        if (isLoggedIn) {
            // Si está logueado, abrir perfil
            $('#display-username').text(currentUser.username);
            $('#display-email').text(currentUser.email);
            $('#profile-view').removeClass('hidden');
        } else {
            // Si NO está logueado, abrir modal de auth
            modal.fadeIn(300);
        }
    });

    // Cerrar perfil (PC y Móvil)
    $('.close-profile-pc, #close-profile-mobile').on('click', function() {
        $('#profile-view').addClass('hidden');
    });

    // 2. Cerrar Modal (con la X o clicando fuera)
    closeBtn.on('click', function() {
        modal.fadeOut(300);
    });

    $(window).on('click', function(event) {
        if ($(event.target).is(modal)) {
            modal.fadeOut(300);
        }
    });

    // 3. Cambiar entre Login y Registro
    tabBtns.on('click', function() {
        // Quitar clase active de todas las pestañas y formularios
        tabBtns.removeClass('active');
        forms.removeClass('active');

        // Añadir active al clickeado
        $(this).addClass('active');
        
        // Mostrar el formulario correspondiente
        const targetId = $(this).data('target');
        $('#' + targetId).addClass('active');
        
        // Limpiar mensajes
        $('#auth-message').text('');
    });


    // Validar Username en tiempo real
    $('#reg-username').on('blur', function() {
        const username = $(this).val();
        const feedback = $('#username-feedback');
        
        if(username.length < 3) return;

        $.post('auth.php', { action: 'check_username', username: username }, function(res) {
            feedback.show().removeClass('valid');
            if(res.status === 'taken') {
                feedback.text(res.message).css('background', '#ff4444'); // Rojo
                $('.register-btn').prop('disabled', true); // Bloquear botón
            } else {
                feedback.text(res.message).addClass('valid').css('background', '#34A853'); // Verde
                $('.register-btn').prop('disabled', false); // Habilitar
            }
        }, 'json');
    });

    // 4. Manejo del envío de formularios (AJAX Placeholder)
    // Aquí es donde conectarás con PHP más adelante
// 4. Manejo del envío de formularios (CONECTADO A PHP)
    $('.auth-form').on('submit', function(e) {
        e.preventDefault(); 
        
        const form = $(this);
        const formId = form.attr('id');
        const submitBtn = form.find('button');
        const messageBox = $('#auth-message');
        
        // Validación básica de confirmación de contraseña para registro
        if (formId === 'register-form') {
            const pass = form.find('input[name="password"]').val();
            const confirm = form.find('input[name="confirm_password"]').val();
            if (pass !== confirm) {
                messageBox.css('color', 'red').text('Las contraseñas no coinciden.');
                return;
            }
        }

        // Preparar datos
        // Agregamos 'action' manualmente a los datos serializados
        const actionType = formId === 'login-form' ? 'login' : 'register';
        const formData = form.serialize() + '&action=' + actionType;

        // UI: Mostrar carga
        const originalText = submitBtn.text();
        submitBtn.text('Procesando...').prop('disabled', true);
        messageBox.text('');

        // LLAMADA AJAX A PHP
        $.post('auth.php', formData, function(response) {
            
            // Restaurar botón
            submitBtn.text(originalText).prop('disabled', false);

            if (response.status === 'success') {
                // ÉXITO
                messageBox.css('color', 'green').text(response.message);
                
                if (actionType === 'register') {
                    // Si se registró, limpiar formulario y cambiar a pestaña de login
                    form[0].reset();
                    setTimeout(() => {
                        $('.tab-btn[data-target="login-form"]').click(); // Simular click en pestaña login
                        $('#auth-message').css('color', 'green').text('¡Cuenta creada! Por favor inicia sesión.');
                    }, 1500);
                } else {
                    // LOGIN EXITOSO
                    isLoggedIn = true;
                    currentUser = response.user; // Guardamos datos del PHP
                    
                    $('#auth-modal').fadeOut(); // Cerrar modal auth inmediatamente
                    updateUI(); // Actualizar interfaz
                    // No hay alert, es silencioso y directo
                }

            } else {
                // ERROR (Email duplicado o contraseña mal)
                messageBox.css('color', 'red').text(response.message);
            }

        }, 'json') // Forzamos a jQuery a esperar JSON
        .fail(function() {
            submitBtn.text(originalText).prop('disabled', false);
            messageBox.css('color', 'red').text('Error de conexión con el servidor.');
        });
    });


    // Función para Logout
    $('#logout-btn').on('click', function() {
        if(confirm('¿Cerrar sesión?')) {
            $.post('auth.php', { action: 'logout' }, function() {
                isLoggedIn = false;
                currentUser = null;
                $('#profile-view').addClass('hidden');
                updateUI();
                alert('Sesión cerrada');
            }, 'json');
        }
    });

    // Actualizar apariencia del botón user (opcional, para feedback visual)
    function updateUI() {
        if(isLoggedIn) {
            // Podrías poner el icono en verde o cambiar el SVG si quisieras
            $('#user-button svg').css('color', '#34A853'); 
        } else {
            $('#user-button svg').css('color', '#555');
        }
    }



    // --- CARGAR ANUNCIOS DE LA BD ---
    function loadAds() {
        adsLayer.clearLayers(); // Limpiar mapa antes de cargar

        $.post('ads.php', { action: 'fetch_all' }, function(res) {
            if (res.status === 'success') {
                res.ads.forEach(ad => {
                    // Crear marcador rojo
                    const marker = L.marker([ad.lat, ad.lng], {icon: redDotIcon});
                    
                    // Contenido del Tooltip (El cartelito que aparece al hacer zoom)
                 // CÓDIGO CORREGIDO EN loadAds() (Agregando un "event" para detener la propagación):
const tooltipContent = `
    <div class="ad-tooltip-content">
        <b>${ad.title}</b><br>
        $${ad.price}<br>
        <button class="view-ad-btn" onclick="openAdDetails(event, ${ad.id})">Ver más</button>
    </div>
`;

                    // Bind Tooltip permanente (siempre está "abierto" pero oculto por CSS)
                    marker.bindTooltip(tooltipContent, {
                        permanent: true,
                        direction: 'top',
                        className: 'custom-ad-tooltip', // Clase base
                        offset: [0, -20]
                    });

                    adsLayer.addLayer(marker);
                });
                
                // Verificar zoom inicial
                checkZoomLevel();
            }
        }, 'json');
    }

    // --- CONTROL DE ZOOM (Mostrar/Ocultar detalles) ---
    function checkZoomLevel() {
        const currentZoom = map.getZoom();
        
        // Si el zoom es mayor o igual al umbral (ej: 15), mostramos info
        if (currentZoom >= ZOOM_THRESHOLD) {
            $('.leaflet-tooltip').addClass('visible-tooltip');
        } else {
            $('.leaflet-tooltip').removeClass('visible-tooltip');
        }
    }

    // Escuchar evento de zoom del mapa
    map.on('zoomend', checkZoomLevel);

    // Cargar anuncios al iniciar
    loadAds();



// CÓDIGO A REEMPLAZAR (Al final de script.js)
// --- NUEVO EVENTO: Evitar que el clic en un anuncio ya publicado dispare la lógica de creación ---
$('body').on('click', '.custom-ad-tooltip', function(e) {
    // Si haces clic en el tooltip visible del anuncio, evitamos que el mapa lo detecte.
    e.stopPropagation();
    console.log("Clic dentro de un Tooltip de Anuncio. Evento detenido.");
});

    // Se eliminó la lógica de pedir GPS al inicio de la carga.
});

    // --- NUEVA FUNCIÓN: Abrir detalles del anuncio y evitar propagación de click ---
function openAdDetails(event, adId) {
    event.stopPropagation(); // ¡ESTO ES CRUCIAL! Detiene el evento click de llegar al mapa.
    alert('Ver detalles del anuncio ID: ' + adId);
    // Aquí pondrías la lógica real para abrir una modal de detalles del anuncio.
}