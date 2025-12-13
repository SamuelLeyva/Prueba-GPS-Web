# Configuración de Apache para XAMPP

## Para resolver el error "Internal Server Error"

### 1. Habilitar módulos necesarios en Apache

Edita el archivo `httpd.conf` de Apache (generalmente en `C:\xampp\apache\conf\httpd.conf`):

Asegúrate que estas líneas no estén comentadas (sin # al inicio):

```apache
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule dir_module modules/mod_dir.so
```

### 2. Configuración del Directorio

En el mismo archivo `httpd.conf`, busca la sección `<Directory>` para tu htdocs y asegúrate que tenga:

```apache
<Directory "C:/xampp/htdocs">
    Options Indexes FollowSymLinks Includes ExecCGI
    AllowOverride All
    Require all granted
</Directory>
```

### 3. Reiniciar Apache

Después de hacer los cambios, reinicia Apache desde el panel de control de XAMPP.

### 4. Verificar permisos

Asegúrate que la carpeta `xampp-version` tenga los permisos correctos:

```bash
# En Windows (como administrador)
icacls "C:\xampp\htdocs\xampp-version" /grant Everyone:(OI)(CI)F

# O manualmente: clic derecho → propiedades → seguridad → editar permisos
```

### 5. Probar la aplicación

1. Copia todo el contenido al directorio htdocs de XAMPP
2. Accede a: `http://localhost/` (para index.html)
3. O: `http://localhost/xampp-version/` (para la API)

## Estructura final en htdocs:

```
htdocs/
├── index.html                    # Página principal
├── xampp-version/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.php
│   │   │   └── register.php
│   │   └── posts/
│   │       ├── read.php
│   │       └── create.php
│   ├── data/
│   │   ├── users/
│   │   └── posts/
│   └── .htaccess
```

## Si el error persiste:

1. Revisa el log de errores de Apache: `C:\xampp\apache\logs\error.log`
2. Asegúrate que PHP esté funcionando: crea un archivo `test.php` con `<?php phpinfo(); ?>`
3. Verifica que el módulo `mod_rewrite` esté activo