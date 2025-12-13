# Instrucciones de Instalación para XAMPP

## Pasos para instalar MapaCuba en XAMPP:

### 1. Copiar archivos
Copia todo el contenido de la carpeta `xampp-version` a tu directorio htdocs de XAMPP:

```bash
# En Windows (cmd)
xcopy "xampp-version\*" "C:\xampp\htdocs\mapacuba\" /E /I

# En Windows (PowerShell)
Copy-Item -Path "xampp-version\*" -Destination "C:\xampp\htdocs\mapacuba\" -Recurse -Force

# En macOS/Linux
cp -r xampp-version/* /Applications/XAMPP/htdocs/mapacuba/
```

### 2. Configurar permisos (macOS/Linux)
```bash
chmod -R 755 /Applications/XAMPP/htdocs/mapacuba/
chmod -R 777 /Applications/XAMPP/htdocs/mapacuba/data/
```

### 3. Iniciar XAMPP
- Abre el panel de control de XAMPP
- Inicia el servidor Apache
- Asegúrate que el puerto 80 esté disponible

### 4. Acceder a la aplicación
Abre tu navegador y visita:
```
http://localhost/mapacuba/
```

### 5. Probar la aplicación
1. La aplicación pedirá permiso de geolocalización
2. Haz clic en cualquier punto del mapa
3. Aparecerá el botón flotante "Crear publicación aquí"
4. Si no estás logueado, mostrará el modal de inicio de sesión
5. Si estás logueado, mostrará el modal para crear publicación

## Estructura creada:
```
htdocs/mapacuba/
├── index.html              # Página principal con toda la lógica
├── .htaccess              # Configuración de Apache
├── README.md              # Documentación
├── api/
│   ├── auth/
│   │   ├── login.php       # Autenticación
│   │   └── register.php    # Registro
│   └── posts/
│       ├── read.php        # Leer publicaciones
│       └── create.php      # Crear publicaciones
└── data/                  # Se creará automáticamente
    ├── users/              # Archivos JSON de usuarios
    └── posts/
        └── posts.json      # Publicaciones
```

## Funcionalidades clave implementadas:

✅ **Mapa OpenStreetMap** a pantalla completa
✅ **Geolocalización automática** al cargar
✅ **Click en mapa** muestra botón flotante
✅ **Botón flotante** inteligente según estado de login
✅ **Sistema de usuarios** con registro e inicio de sesión
✅ **Publicaciones** con marcadores en el mapa
✅ **Diseño responsivo** estilo Google Maps
✅ **Almacenamiento** en archivos JSON locales