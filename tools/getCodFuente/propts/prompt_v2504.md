# Documentación del Proyecto: Audios del Viacrucis Viviente

## Descripción General

Este proyecto es una plataforma web para gestionar y reproducir audios del Viacrucis Viviente del Barrio Yacampiz (2025). La aplicación permite:

- Listar todos los audios disponibles organizados por estaciones del Viacrucis
- Reproducir cada audio individualmente con un reproductor integrado
- Navegar entre audios (anterior/siguiente)
- Compartir audios vía WhatsApp
- Mantener un historial de versiones detallado
- Proteger el acceso con un sistema de autenticación básica

La arquitectura sigue un patrón MVC simplificado con:
- Frontend en HTML/CSS responsivo
- Backend en PHP para la lógica de negocio
- Sistema de seguridad para proteger los recursos

## Estructura de Archivos

### `css/style.css`
**Descripción**: Estilos CSS para toda la aplicación  
**Contenido destacado**:
- Diseño responsivo con gradientes y sombras
- Estilos para el reproductor de audio y lista de canciones
- Efectos hover para elementos interactivos
- Diseño de botones de navegación (anterior/siguiente)

```css
/* Ejemplo reducido */
body {
    font-family: 'Georgia', serif;
    background: linear-gradient(to bottom, #fdf7e3, #e9d8b7);
}

.playlist {
    width: 80%;
    border: 2px solid #806d5a;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
```

### `incs/audioFiles.php`
**Descripción**: Base de datos centralizada de audios  
**Estructura**:
```php
$audioFiles = [
    [
        'filename' => '101_v2502_La_entrada_de_Jesús_en_Jerusalén.mp3',
        'display_name' => '101 - La entrada de Jesús en Jerusalén',
        'id' => '101_v2502',
        'order' => '0102'
    ],
    // ... más audios
];
```
**Nota**: Contiene 29 audios organizados en 3 partes del Viacrucis

### `incs/functions.php`
**Funcionalidades principales**:
- `getBaseURL()`: Genera la URL base dinámicamente
- `getAudioById()`: Busca un audio por su ID en el array

```php
function getBaseURL() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    return $protocol . "://" . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
}
```

### `incs/kerberos.php`
**Propósito**: Sistema de autenticación básico  
**Clave de acceso**: `VCV2025`  
**Mecanismo**:
```php
if (!isset($_GET['key']) || $_GET['key'] !== 'VCV2025') {
    header('Location: error.php');
    exit();
}
```

### `incs/versionLogs.php`
**Historial de cambios**:
- Registra versiones desde la 5.4.1 (2024-12-15) hasta la 25.4 (2025-03-24)
- Detalla mejoras de seguridad, funcionalidad y diseño
- Ordena versiones semánticamente

```php
$versionLogs = [
    '25.4' => [
        'date' => '2025-03-24',
        'changes' => [
            'Modifica La Negacion, agrega música al inicio.',
            'Modifica La Entrega, agrega música al final.'
        ]
    ],
    // ... más versiones
];
```

## Páginas Principales

### `index.php`
**Función**: Punto de entrada principal  
**Características**:
- Verifica clave de acceso
- Muestra lista completa de audios
- Incluye opción de compartir por WhatsApp
- Usa componentes reutilizables (header, footer)

```php
// Estructura simplificada
if (!isset($_GET['key']) || $_GET['key'] !== 'VCV2025') {
    header('Location: error.php');
    exit();
}

include 'incs/header.php';
// Muestra lista de audios
include 'incs/footer.php';
```

### `play.php`
**Función**: Reproductor de audio individual  
**Funcionalidades**:
- Reproductor HTML5 con controles nativos
- Navegación entre audios (anterior/siguiente)
- Diseño adaptado para móviles

```php
$audio = getAudioById($_GET['id'], $audioFiles);
// ... validaciones

<audio controls>
    <source src="serve.php?file=<?= urlencode($audio['filename']) ?>">
</audio>
```

### `serve.php`
**Propósito**: Servir archivos de audio de forma segura  
**Medidas de seguridad**:
- Verifica existencia del archivo
- Valida extensión (.mp3)
- Previene directory traversal

```php
$filePath = realpath($dirMEDIA . '/' . $file);
if (!file_exists($filePath) || pathinfo($filePath, PATHINFO_EXTENSION) !== 'mp3') {
    http_response_code(404);
    die('Archivo no encontrado.');
}
```

## Componentes Reutilizables

### `incs/header.php`
**Contiene**:
- Metatags básicos
- Enlace a hoja de estilos
- Título de la aplicación
- Información de versión

### `incs/footer.php`
**Contiene**:
- Créditos y copyright
- Cierre de etiquetas HTML

## Mejoras Recientes (v25.4)
- Seguridad reforzada con kerberos.php
- Optimización de estructura de directorios
- Mejoras en reproducción (música adicional)
- Sistema de versionado semántico

## Notas Técnicas
- Compatible con PHP 7.4+
- Diseño responsive (mobile-first)
- No requiere base de datos (datos en arrays PHP)
- URLs amigables con parámetros GET

Este documento provee una visión general del sistema. Para detalles específicos, consultar los archivos fuente correspondientes.