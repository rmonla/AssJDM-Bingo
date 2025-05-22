# Código Fuente Recolectado

## ../../incs/audioFiles.php


```php
<?php
// Array de archivos de audio (debería centralizarse si es muy grande)
$audioFiles = [
    [
        'filename' => '001_v2502_Música_Pueblo.mp3',
        'display_name' => '001 Música Pueblo.mp3',
        'id' => '001_v2502', 'order' => '0102', 'short_url' => '',
    ],
// Y varios elementos mas ...
];
```

## ../../incs/footer.php


```php
<footer class="footer">
    <p>Versión: <?= htmlspecialchars($latestVersion) ?> | Asociación CAMPS</p>
</footer>
</body>
</html>
```

## ../../incs/functions.php


```php
<?php
function getBaseURL() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $path = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
    return $protocol . "://" . $host . $path;
}

function getAudioById($id, $audioFiles) {
    foreach ($audioFiles as $audio) {
        if ($audio['id'] == $id) {
            return $audio;
        }
    }
    return null;
}

```

## ../../incs/header.php


```php
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Via Crusis del Barrio Yacampiz - 2025</title>
</head>
<body>
<header class="header">
    <h1>Via Crusis del Barrio Yacampiz - 2025</h1>
</header>
```

## ../../incs/index.php


```php
<?php include 'kerberos.php'; ?>
```

## ../../incs/kerberos.php


```php
<?php
// Verificar si se pasa el parámetro 'key' con el valor 'VCV2025'
if (!isset($_GET['key']) || $_GET['key'] !== 'VCV2025') {
    header('Location: error.php');
    exit();
}
?>
<?php include 'header.php'; ?>
    <main class="main-content">
        <p>Contenido protegido accesible solo con la clave correcta.</p>
    </main>
<?php include 'footer.php'; ?>


```

## ../../incs/versionLogs.php


```php
<?php
$versionLogs = [
    '25.5' => [
        'date' => '2025-03-30', // Actualizar con fecha de hoy
        'changes' => [
            'Rediseño completo del reproductor de audio',
            'Implementación de navegación inferior unificada (Volver/Anterior/Siguiente)',
            'Mejoras en el sistema responsive para móviles',
            'Nuevos efectos visuales y microinteracciones:',
            '   - Efecto "onda" en botones al hacer hover',
            '   - Animación pulsante para icono de WhatsApp',
            '   - Feedback visual al completar reproducción',
            '   - Transición suave al cambiar entre audios',
            'Rediseño del header con título simplificado',
            'Reubicación de la versión al footer',
            'Control de reproducción auto-ajustable al 100% del ancho',
            'Compatibilidad con modo oscuro del sistema',
            'Optimización de rendimiento para animaciones CSS',
            'Corrección del sistema de range requests para navegación en pistas',
            'Mejoras en la accesibilidad táctil para móviles',
            'Integración de will-change para aceleración hardware',
            'Correcciones específicas para navegadores (Firefox, Safari)'
        ]
    ],
    // Y varios elementos mas ...

];

// Ordena las claves del array en orden descendente
uksort($versionLogs, 'version_compare');
$latestVersion = array_key_last($versionLogs);
$latestDetails = $versionLogs[$latestVersion];
?>

```

## ../../index.php


```php
<?php
require 'incs/functions.php';
require 'incs/audioFiles.php';
require 'incs/versionLogs.php';

if (!isset($_GET['key']) || $_GET['key'] !== 'VCV2025') {
    header('Location: error.php');
    exit();
}

$baseURL = getBaseURL();
include 'incs/header.php';
?>

<main class="main-content">
    <section class="playlist">
        <h3>Lista de Audios</h3>
        <ul id="song-list">
            <?php foreach ($audioFiles as $audio): 
                $isActive = (isset($_GET['id']) && $_GET['id'] === $audio['id']);
                $audioURL = getBaseURL() . "/play.php?id=" . urlencode($audio['id']) . "&wa=1";
            ?>
                <li class="song-item <?= $isActive ? 'active' : '' ?>">
                    <a href="play.php?id=<?= htmlspecialchars($audio['id']) ?>" class="song-link">
                        <?= htmlspecialchars($audio['display_name']) ?>
                    </a>
                    
                    <div class="song-actions">
                        <!-- Botón de descarga -->
                        <a href="serve.php?file=<?= urlencode($audio['filename']) ?>" download="<?= htmlspecialchars($audio['filename']) ?>">
                            📥
                        </a>

                        <!-- Botón de compartir en WhatsApp -->
                        <a href="https://wa.me/?text=<?= urlencode($audio['display_name'] . "\n" . $audioURL) ?>" target="_blank">
                            <svg class="icon-whatsapp" viewBox="0 0 24 24" fill="#25D366">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </a>

                    </div>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
</main>


<?php include 'incs/footer.php'; ?>

```

## ../../play.php


```php
<?php
require 'incs/functions.php';
require 'incs/audioFiles.php';
require 'incs/versionLogs.php';

// Configuración inicial
$id = $_GET['id'] ?? null;
$audio = getAudioById($id, $audioFiles);
$dirMEDIA = 'media';
$hideNavButtons = isset($_GET['wa']) && $_GET['wa'] == '1';

// Validación de archivo
if (!$audio || !file_exists($dirMEDIA . '/' . $audio['filename'])) {
    http_response_code(404);
    die('Archivo no encontrado.');
}

// Navegación entre audios
$currentIndex = array_search($audio, $audioFiles, true);
$prevAudio = $currentIndex > 0 ? $audioFiles[$currentIndex - 1] : null;
$nextAudio = $currentIndex < count($audioFiles) - 1 ? $audioFiles[$currentIndex + 1] : null;

// Generación de contenido condicional
$audio_title = htmlspecialchars($audio['display_name']);
$audio_file = htmlspecialchars($audio['filename']);

// Generación de botones de navegación
$buttons = [];
if (!$hideNavButtons) {
    if ($prevAudio) {
        $buttons[] = sprintf(
            '<a href="play.php?id=%s" class="nav-button prev-button">⟵ Anterior</a>',
            htmlspecialchars($prevAudio['id'])
        );
    }

    $buttons[] = sprintf(
        '<a href="index.php?key=VCV2025" class="nav-button back-button" title="Volver a la lista completa">← Volver</a>'
    );

    if ($nextAudio) {
        $buttons[] = sprintf(
            '<a href="play.php?id=%s" class="nav-button next-button">Siguiente ⟶</a>',
            htmlspecialchars($nextAudio['id'])
        );
    }

    $htmlBOTONEs = sprintf('<div class="audio-navigation">%s</div>', implode('', $buttons));
} else {
    $htmlBOTONEs = '';
}

// Generación de JavaScript condicional
$javascriptCode = '';
if (!$hideNavButtons) {
    $autonextScript = '';
    if ($nextAudio) {
        $autonextScript = sprintf(
            "window.location.href = 'play.php?id=%s';",
            htmlspecialchars($nextAudio['id'])
        );
    }

    $javascriptCode = sprintf(
        <<<'JS'
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var audio = document.getElementById('audioPlayer');
                var autoplayMessage = document.getElementById('autoplayMessage');
                
                // Intentar autoplay (siempre que no sea desde WhatsApp)
                var playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        autoplayMessage.style.display = 'none';
                    }).catch(error => {
                        autoplayMessage.style.display = 'block';
                        audio.controls = true;
                    });
                }
                
                // Configurar autonext solo si hay siguiente audio
                audio.addEventListener('ended', function() {
                    document.querySelector('.audio-player-container').classList.add('ended');
                    setTimeout(() => {
                        document.querySelector('.audio-player-container').classList.remove('ended');
                        %s
                    }, 500);
                });
            });
        </script>
        JS,
        $autonextScript
    );
}

// Construcción del HTML final
$htmlMAIN = sprintf(
    <<<'HTML'
    <main class="main-content">
        <section class="playlist">
            <h2 class="audio-title">%s</h2>
            <div class="audio-player-container">
                <audio id="audioPlayer" controls controlsList="nodownload">
                    <source src="serve.php?file=%s" type="audio/mpeg">
                    Tu navegador no soporta el elemento de audio.
                </audio>
                %s
            </div>
            %s
            %s
        </section>
    </main>
    HTML,
    $audio_title,
    $audio_file,
    (!$hideNavButtons ? '<div id="autoplayMessage" class="autoplay-message"><p>La reproducción automática está bloqueada. Por favor haz clic en el botón de play.</p></div>' : ''),
    $htmlBOTONEs,
    $javascriptCode
);

// Salida final
include 'incs/header.php';
echo $htmlMAIN;
include 'incs/footer.php';
?>
```

## ../../serve.php


```php
<?php
require 'incs/functions.php';

$dirMEDIA = 'media';
$file = $_GET['file'] ?? '';
$filePath = realpath($dirMEDIA . '/' . $file);

// Validaciones de seguridad
if (!$filePath || !file_exists($filePath) || pathinfo($filePath, PATHINFO_EXTENSION) !== 'mp3') {
    http_response_code(404);
    die('Archivo no encontrado.');
}

if (strpos($filePath, realpath($dirMEDIA)) !== 0) {
    http_response_code(403);
    die('Acceso denegado.');
}

// Configurar headers para soportar range requests
$fileSize = filesize($filePath);
$fileTime = filemtime($filePath);

header('Content-Type: audio/mpeg');
header('Accept-Ranges: bytes');
header('Content-Length: ' . $fileSize);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $fileTime) . ' GMT');
header('Cache-Control: no-cache');

// Manejar range requests (para saltar en el audio)
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];
    $range = str_replace('bytes=', '', $range);
    $range = explode('-', $range);
    
    $start = (int)$range[0];
    $end = $fileSize - 1;
    
    if (!empty($range[1])) {
        $end = (int)$range[1];
    }
    
    $length = $end - $start + 1;
    
    header('HTTP/1.1 206 Partial Content');
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $fileSize);
    header('Content-Length: ' . $length);
    
    // Leer y enviar la parte solicitada del archivo
    $file = fopen($filePath, 'rb');
    fseek($file, $start);
    
    $remaining = $length;
    while ($remaining > 0) {
        $chunk = min(8192, $remaining);
        echo fread($file, $chunk);
        $remaining -= $chunk;
        flush();
    }
    
    fclose($file);
} else {
    // Enviar el archivo completo si no hay range request
    readfile($filePath);
}
exit();
?>
```

