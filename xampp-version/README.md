# MapaCuba - Sistema de Anuncios en Cuba

Versión compatible con XAMPP que utiliza OpenStreetMap para mostrar un mapa interactivo con sistema de publicaciones y autenticación de usuarios.

## Características

### 🗺️ **Mapa Interactivo**
- OpenStreetMap a pantalla completa
- Geolocalización automática al cargar
- Click en cualquier punto del mapa para crear publicaciones

### 👤 **Sistema de Usuarios**
- Registro con nombre, teléfono cubano (+53) y contraseña
- Inicio de sesión con cookies
- Contraseñas encriptadas con SHA-256
- Almacenamiento en archivos JSON

### 📝 **Sistema de Publicaciones**
- Crear anuncios con título, descripción y precio
- Publicaciones visibles para todos los visitantes
- Marcadores en el mapa para cada anuncio
- Solo usuarios logueados pueden publicar

### 🎯 **Interfaz Intuitiva**
- Botón flotante al tocar el mapa
- Modales según estado de autenticación
- Diseño responsivo y moderno
- Contador de publicaciones en tiempo real

## Instalación en XAMPP

1. **Copiar archivos al directorio de XAMPP:**
   ```bash
   # Copiar todo el contenido a tu directorio htdocs
   cp -r xampp-version/* /Applications/XAMPP/htdocs/mapacuba/
   ```

2. **Configurar permisos:**
   ```bash
   chmod -R 755 /Applications/XAMPP/htdocs/mapacuba/
   chmod -R 777 /Applications/XAMPP/htdocs/mapacuba/data/
   ```

3. **Iniciar Apache en XAMPP**

4. **Acceder a la aplicación:**
   ```
   http://localhost/mapacuba/
   ```

## Estructura de Archivos

```
mapacuba/
├── index.html              # Página principal
├── api/
│   ├── auth/
│   │   ├── login.php       # Inicio de sesión
│   │   └── register.php    # Registro de usuarios
│   └── posts/
│       ├── read.php        # Leer publicaciones
│       └── create.php      # Crear publicación
└── data/
    ├── users/              # Archivos JSON de usuarios
    └── posts/
        └── posts.json      # Todas las publicaciones
```

## Uso

### Para visitantes:
1. La aplicación solicita permiso de ubicación automáticamente
2. Puedes ver todas las publicaciones en el mapa
3. Haz clic en cualquier punto del mapa para ver opción de crear publicación

### Para usuarios registrados:
1. Regístrate con tu número cubano (+53)
2. Inicia sesión para poder crear publicaciones
3. Haz clic en el mapa y selecciona "Crear publicación aquí"
4. Completa el formulario y tu anuncio aparecerá en el mapa

## Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Tailwind), JavaScript Vanilla
- **Mapa:** OpenStreetMap + Leaflet.js
- **Backend:** PHP 7.4+
- **Almacenamiento:** Archivos JSON
- **Iconos:** Lucide Icons
- **Estilos:** Tailwind CSS

## Requisitos

- XAMPP con Apache y PHP
- Navegador web moderno con soporte de geolocalización
- Conexión a internet para los mapas

## Notas Importantes

- Los datos se almacenan localmente en archivos JSON
- Las contraseñas se encriptan antes de guardar
- Se requiere permiso de geolocalización del navegador
- Compatible con dispositivos móviles y escritorio

## Licencia

Proyecto de código abierto para uso educativo y comercial.