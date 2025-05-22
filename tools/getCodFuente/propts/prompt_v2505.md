# Prompt Completo del Proyecto: Audios del Viacrucis Viviente

## Descripción del Proyecto
Sistema web para gestionar y reproducir audios del Viacrucis Viviente con:
- Autenticación básica
- Reproductor con navegación
- Listado organizado
- Historial de versiones
- Diseño responsive

## Estructura de Archivos

### `css/style.css`
```css
/* Estilos base */
body {
    font-family: 'Georgia', serif;
    margin: 0;
    background: linear-gradient(to bottom, #fdf7e3, #e9d8b7);
    color: #4a3e31;
    text-align: center;
}

/* Header */
.header {
    background-color: #806d5a;
    padding: 20px;
    color: #fff;
    text-shadow: 1px 1px 4px #000;
}

.header h1, .header h2, .header p {
    margin: 5px;
}

/* Estructura principal */
.main-content {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

/* Lista de reproducción */
.playlist {
    background-color: #f9f4ef;
    border: 2px solid #806d5a;
    border-radius: 8px;
    padding: 20px;
    margin: 20px auto;
    width: 90%;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* Elementos de la lista */
#song-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.song-item {
    padding: 12px 15px;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
    background-color: #f9f4ef;
}

.song-item:hover {
    background-color: #f0e6d2;
    transform: translateX(5px);
}

.song-link {
    text-decoration: none;
    color: #4a3e31;
    font-weight: bold;
    transition: color 0.3s ease;
}

.song-link:hover {
    color: #806d5a;
    text-decoration: underline;
}

/* Icono WhatsApp */
.icon-whatsapp {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: transform 0.2s;
}

.icon-whatsapp:hover {
    transform: scale(1.2);
}

/* Reproductor de audio */
.audio-player-container {
    width: calc(100% - 4px);
    margin: 20px 0;
    padding: 0;
    background-color: #f9f4ef;
    border: 2px solid #806d5a;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

audio {
    width: 100%;
    height: 50px;
    background: transparent;
}

/* Controles del reproductor */
audio::-webkit-media-controls-panel {
    width: 100%;
    background-color: #f9f4ef;
    border-radius: 8px;
}

audio::-moz-range-track {
    width: 100%;
}

/* Mensaje de autoplay */
.autoplay-message {
    display: none;
    background: #fdf7e3;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
    color: #4a3e31;
    border: 1px solid #e9d8b7;
}

/* Botones de navegación */
.back-button-container {
    text-align: left;
    margin-bottom: 15px;
}

.audio-navigation {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
}

.nav-button {
    display: inline-flex;
    align-items: center;
    padding: 8px 15px;
    font-size: 14px;
    color: #4a3e31;
    background-color: #e9d8b7;
    border: 1px solid #806d5a;
    border-radius: 20px;
    text-decoration: none;
    transition: all 0.3s ease;
}

.nav-button:hover {
    background-color: #f9f4ef;
    color: #806d5a;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.nav-button:active {
    background-color: #fdf7e3;
    transform: translateY(1px);
}

.button-icon {
    margin: 0 5px;
    font-weight: bold;
}

/* Footer */
.footer {
    margin-top: 30px;
    padding: 10px;
    background-color: #806d5a;
    color: #fff;
    font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
    .playlist {
        width: 95%;
        padding: 15px;
    }
    
    .audio-navigation {
        flex-wrap: wrap;
    }
    
    .nav-button {
        padding: 6px 12px;
        font-size: 13px;
    }
    
    audio {
        height: 40px;
    }
    
    .header {
        padding: 15px;
    }
    
    .header h1 {
        font-size: 1.5em;
    }
    
    .header h2 {
        font-size: 1.2em;
    }
}
```

### `incs/audioFiles.php`
```php
<?php
$audioFiles = [
    [
        'filename' => '101_v2502_La_entrada_de_Jesús_en_Jerusalén.mp3',
        'display_name' => '101 - La entrada de Jesús en Jerusalén',
        'id' => '101_v2502',
        'order' => '0102',
        'short_url' => ''
    ],
    // ... [todos los demás audios]
];
?>
```

### `incs/footer.php`
```php
<footer class="footer">
    <p>Propiedad de Asociación CAMPS | Inspirado en la fe y la música</p>
</footer>
</body>
</html>
```

### `incs/functions.php`
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
?>
```

### `incs/header.php`
```php
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Audios del Viacrusis Viviente</title>
</head>
<body>
<header class="header">
    <h1>Audios del Viacrusis Viviente</h1>
    <h2>Bº Yacampiz - 2025</h2>
    <p>Versión: <?= htmlspecialchars($latestVersion) ?> | Asociación CAMPS</p>
</header>
```

### `incs/kerberos.php`
```php
<?php
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

### `incs/versionLogs.php`
```php
<?php
$versionLogs = [
    '25.4' => [
        'date' => '2025-03-24',
        'changes' => [
            'Modifica La Negacion, agrega música al inicio.',
            // ... [otros cambios]
        ]
    ],
    // ... [otras versiones]
];

uksort($versionLogs, 'version_compare');
$latestVersion = array_key_last($versionLogs);
$latestDetails = $versionLogs[$latestVersion];
?>
```

### `index.php`
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
            <?php foreach ($audioFiles as $audio): ?>
                <li class="song-item">
                    <a href="play.php?id=<?= htmlspecialchars($audio['id']) ?>" class="song-link">
                        <?= htmlspecialchars($audio['display_name']) ?>
                    </a>
                    <?php if (!empty($audio['short_url'])): ?>
                        <a href="https://wa.me/?text=<?= urlencode($audio['display_name'] . "\n" . $audio['short_url'] . "\nPesebre Viviente del Bº Yacampiz") ?>" target="_blank">
                            <img src="assets/whatsapp-icon.png" alt="WhatsApp" class="icon-whatsapp">
                        </a>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
</main>
<?php include 'incs/footer.php'; ?>
```

### `play.php`
```php
<?php
require 'incs/functions.php';
require 'incs/audioFiles.php';
require 'incs/versionLogs.php';

$id = $_GET['id'] ?? null;
$audio = getAudioById($id, $audioFiles);
$dirMEDIA = 'media';

if (!$audio || !file_exists($dirMEDIA . '/' . $audio['filename'])) {
    http_response_code(404);
    die('Archivo no encontrado.');
}

$currentIndex = array_search($audio, $audioFiles, true);
$prevAudio = $currentIndex > 0 ? $audioFiles[$currentIndex - 1] : null;
$nextAudio = $currentIndex < count($audioFiles) - 1 ? $audioFiles[$currentIndex + 1] : null;

include 'incs/header.php';
?>
<main class="main-content">
    <section class="playlist">
        <div class="back-button-container">
            <a href="index.php?key=VCV2025" class="nav-button back-button" title="Volver a la lista completa">
                <span class="button-icon">←</span> Volver
            </a>
        </div>
        
        <h2 class="audio-title"><?= htmlspecialchars($audio['display_name']) ?></h2>
        
        <div class="audio-player-container">
            <audio id="audioPlayer" controls>
                <source src="serve.php?file=<?= urlencode($audio['filename']) ?>" type="audio/mpeg">
                Tu navegador no soporta el elemento de audio.
            </audio>
            <div id="autoplayMessage" class="autoplay-message">
                <p>La reproducción automática está bloqueada. Por favor haz clic en el botón de play.</p>
            </div>
        </div>
        
        <div class="audio-navigation">
            <?php if ($prevAudio): ?>
                <a href="play.php?id=<?= htmlspecialchars($prevAudio['id']) ?>" class="nav-button prev-button">
                    <span class="button-icon">⟵</span> Anterior
                </a>
            <?php endif; ?>
            
            <?php if ($nextAudio): ?>
                <a href="play.php?id=<?= htmlspecialchars($nextAudio['id']) ?>" class="nav-button next-button">
                    Siguiente <span class="button-icon">⟶</span>
                </a>
            <?php endif; ?>
        </div>
    </section>
</main>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var audio = document.getElementById('audioPlayer');
    var autoplayMessage = document.getElementById('autoplayMessage');
    
    // Intentar reproducción automática
    var playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            autoplayMessage.style.display = 'none';
        })
        .catch(error => {
            // Autoplay fue bloqueado
            autoplayMessage.style.display = 'block';
            audio.controls = true;
        });
    }
    
    // Manejar cambio automático al siguiente audio al terminar
    audio.addEventListener('ended', function() {
        <?php if ($nextAudio): ?>
            window.location.href = 'play.php?id=<?= htmlspecialchars($nextAudio['id']) ?>';
        <?php endif; ?>
    });
});
</script>

<?php include 'incs/footer.php'; ?>
```

### `serve.php`
```php
<?php
require 'incs/functions.php';

$dirMEDIA = 'media';
$file = $_GET['file'] ?? '';
$filePath = realpath($dirMEDIA . '/' . $file);

if (!$filePath || !file_exists($filePath) || pathinfo($filePath, PATHINFO_EXTENSION) !== 'mp3') {
    http_response_code(404);
    die('Archivo no encontrado.');
}

if (strpos($filePath, realpath($dirMEDIA)) !== 0) {
    http_response_code(403);
    die('Acceso denegado.');
}

header('Content-Type: audio/mpeg');
header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
?>
```

## Características Clave
1. **Seguridad**:
   - Autenticación por clave (VCV2025)
   - Protección contra directory traversal
   - Validación de tipos de archivo

2. **Reproducción**:
   - Autoplay inteligente
   - Navegación entre audios
   - Reproductor responsive

3. **Organización**:
   - Audios categorizados
   - Historial de versiones
   - Estructura modular

4. **Diseño**:
   - Paleta de colores consistente
   - Transiciones suaves
   - Adaptable a móviles

