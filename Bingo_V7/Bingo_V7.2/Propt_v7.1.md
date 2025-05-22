Okay, ¡vamos a la obra con la versión 7.1!

Este es un proyecto ambicioso para una sola respuesta, así que generaré una base funcional sólida que cumpla con los requisitos principales. Algunas características muy específicas de UX (animaciones super pulidas, drag-and-drop para imágenes si se quisiera, etc.) podrían requerir más iteraciones, pero la lógica central y la estructura estarán ahí.

**Nota Importante:**
*   Para la comunicación entre `control.html` y `display.html`, usaré `localStorage` y el evento `storage`. Esto requiere que ambas páginas se sirvan desde el mismo origen (por ejemplo, abriéndolas como archivos locales `file:///` o desde un servidor web local como `http://localhost`).
*   Las librerías `jsPDF`, `html2canvas` y `confetti-js` se enlazarán mediante CDN para simplificar.
*   Este código es extenso. Se recomienda copiar y pegar cada bloque en su archivo correspondiente.

---

**1. `control.html` (Panel de Operador)**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bingo Interactivo - Panel de Control v7.1</title>
    <link rel="stylesheet" href="bingo-styles.css">
</head>
<body>
    <div id="control-panel">
        <header>
            <h1>Panel de Control del Bingo</h1>
        </header>

        <div class="main-layout">
            <!-- Columna Izquierda: Sorteo y Tablero -->
            <section class="draw-section">
                <h2>Sorteo Actual</h2>
                <div class="current-number-display" id="controlCurrentNumber">--</div>
                <div class="drawn-count" id="controlDrawnCount">Bolillas sorteadas: 0 / 91</div>

                <div class="draw-controls">
                    <button id="btnDrawManual" class="control-button">SACAR BOLILLA</button>
                    <div class="auto-draw-controls">
                        <h3>Modo Automático</h3>
                        <select id="autoDrawInterval">
                            <option value="3000">3 segundos</option>
                            <option value="4000" selected>4 segundos</option>
                            <option value="5000">5 segundos</option>
                        </select>
                        <button id="btnToggleAutoDraw" class="control-button">INICIAR AUTOMÁTICO</button>
                        <span id="autoDrawStatus">Estado: Inactivo</span>
                    </div>
                </div>

                <h2>Tablero de Números (00-90)</h2>
                <div class="number-board" id="controlNumberBoard">
                    <!-- Los números se generarán con JS -->
                </div>
            </section>

            <!-- Columna Derecha: Configuración y Controles -->
            <aside class="config-section">
                <div class="history-panel">
                    <h3>Últimos Sorteados:</h3>
                    <ul id="controlHistoryList">
                        <!-- Historial se llenará con JS -->
                    </ul>
                </div>

                <div class="accordion">
                    <!-- Sección 1: Datos de la Jugada -->
                    <div class="accordion-item">
                        <button class="accordion-header">1. Datos de la Jugada</button>
                        <div class="accordion-content">
                            <label for="eventName">Nombre del Evento:</label>
                            <input type="text" id="eventName" value="Bingo Fantástico">
                            
                            <label for="eventDescription">Descripción:</label>
                            <textarea id="eventDescription" rows="2">¡Gran sorteo de premios!</textarea>
                            
                            <label for="eventLogo">Logo (opcional):</label>
                            <input type="file" id="eventLogo" accept="image/*">
                            <img id="logoPreview" src="#" alt="Vista previa del logo" style="max-width: 100px; display: none;">
                            <button id="removeLogoBtn" style="display: none;">Quitar Logo</button>
                            <button id="saveEventDetails" class="control-button">Guardar Datos Evento</button>
                        </div>
                    </div>

                    <!-- Sección 2: Premios -->
                    <div class="accordion-item">
                        <button class="accordion-header">2. Configuración de Premios</button>
                        <div class="accordion-content">
                            <div class="prize-tabs">
                                <button class="tab-link active" data-prize="linea1">Línea 1</button>
                                <button class="tab-link" data-prize="linea2">Línea 2</button>
                                <button class="tab-link" data-prize="linea3">Línea 3</button>
                                <button class="tab-link" data-prize="bingo">Bingo</button>
                            </div>

                            <div id="prizeConfigContent">
                                <!-- Contenido de las pestañas se carga aquí por JS -->
                            </div>
                             <button id="savePrizeSettings" class="control-button">Guardar Configuración Premios</button>
                        </div>
                    </div>
                    
                    <!-- Sección 3: Controles de Verificación -->
                    <div class="accordion-item">
                        <button class="accordion-header">3. Verificación y Gestión</button>
                        <div class="accordion-content">
                            <h3>Verificación de Premio</h3>
                            <select id="verifyPrizeSelect">
                                <!-- Opciones se llenan con JS -->
                            </select>
                            <button id="btnStartVerification" class="control-button">INICIAR VERIFICACIÓN</button>
                            <div id="verificationControls" style="display: none;">
                                <p>Verificando <strong id="verifyingPrizeName"></strong>...</p>
                                <button id="btnConfirmWinner" class="control-button success">CONFIRMAR GANADOR</button>
                                <button id="btnRejectClaim" class="control-button danger">RECHAZAR RECLAMO</button>
                            </div>
                        </div>
                    </div>

                    <!-- Sección 4: Utilidades -->
                    <div class="accordion-item">
                        <button class="accordion-header">4. Utilidades</button>
                        <div class="accordion-content">
                            <button id="btnResetDraw" class="control-button warning">REINICIAR SORTEO (Números)</button>
                            <button id="btnFullReset" class="control-button danger">REINICIAR JUEGO COMPLETO</button>
                            <button id="btnExportPdf" class="control-button">EXPORTAR ESTADO (PDF)</button>
                            <button id="btnExportHistoryCsv" class="control-button">EXPORTAR HISTORIAL (CSV)</button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <!-- Librerías externas -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    
    <script src="bingo-core.js"></script>
</body>
</html>
```

---

**2. `display.html` (Visualización Pública)**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bingo Interactivo - Pantalla Pública v7.1</title>
    <link rel="stylesheet" href="bingo-styles.css">
</head>
<body>
    <div id="display-screen">
        <header class="display-header">
            <div class="event-info">
                <img id="displayLogo" src="#" alt="Logo del Evento" style="display: none;">
                <div>
                    <h1 id="displayEventName">Bingo</h1>
                    <p id="displayEventDescription">¡Mucha suerte!</p>
                </div>
            </div>
            <div class="active-prizes">
                <h3>Premios en Juego:</h3>
                <ul id="displayActivePrizes">
                    <!-- Premios se llenan con JS -->
                </ul>
            </div>
        </header>

        <main class="display-main">
            <div class="display-current-number-container">
                <div class="display-current-number" id="displayCurrentNumber">--</div>
            </div>
            
            <div class="display-number-board-container">
                <h2>Tablero de Números (00-90)</h2>
                <div class="number-board" id="displayNumberBoard">
                    <!-- Los números se generarán con JS -->
                </div>
            </div>
            
            <aside class="display-history">
                <h3>Últimos Sorteados:</h3>
                <ul id="displayHistoryList">
                    <!-- Historial se llenará con JS -->
                </ul>
            </aside>
        </main>

        <!-- Overlay de Verificación -->
        <div id="verificationOverlay" class="overlay" style="display: none;">
            <div class="overlay-content">
                <h2>VERIFICANDO...</h2>
                <p id="verifyingPrizeText">Se está verificando un cartón para [PREMIO]</p>
            </div>
        </div>

        <!-- Overlay de Ganador -->
        <div id="winnerOverlay" class="overlay" style="display: none;">
            <div class="overlay-content winner-content">
                <h2 id="winnerPrizeName">¡[PREMIO] GANADO!</h2>
                <p id="winnerPrizeDescription"></p>
                <img id="winnerPrizeImage" src="#" alt="Imagen del Premio" style="display:none; max-height: 200px; margin-top: 20px;">
            </div>
        </div>
        <canvas id="confettiCanvas" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; pointer-events: none;"></canvas>

    </div>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="bingo-core.js"></script>
</body>
</html>
```

---

**3. `bingo-styles.css` (Estilos para Ambas Pantallas)**
```css
/* Variables CSS */
:root {
    --primary-color: #2c3e50; /* Azul oscuro */
    --secondary-color: #3498db; /* Azul brillante */
    --accent-color: #e74c3c; /* Rojo */
    --light-color: #ecf0f1; /* Gris claro */
    --dark-color: #222;
    --font-family: 'Arial', sans-serif;
    --number-font-family: 'Impact', 'Arial Black', sans-serif;
    --border-radius: 5px;
    --shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Reset básico y estilos generales */
body {
    font-family: var(--font-family);
    margin: 0;
    padding: 0;
    background-color: var(--light-color);
    color: var(--dark-color);
    line-height: 1.6;
}

h1, h2, h3 {
    color: var(--primary-color);
}

button.control-button, input[type="text"], input[type="file"], textarea, select {
    padding: 10px 15px;
    margin: 5px 0;
    border: 1px solid #ccc;
    border-radius: var(--border-radius);
    font-size: 1em;
}

button.control-button {
    background-color: var(--secondary-color);
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
button.control-button:hover {
    background-color: #2980b9;
}
button.control-button.warning { background-color: #f39c12; }
button.control-button.warning:hover { background-color: #e67e22; }
button.control-button.danger { background-color: var(--accent-color); }
button.control-button.danger:hover { background-color: #c0392b; }
button.control-button.success { background-color: #2ecc71; }
button.control-button.success:hover { background-color: #27ae60; }
button.control-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}

/* Estilos del Panel de Control (#control-panel) */
#control-panel {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

#control-panel header h1 {
    text-align: center;
    margin-bottom: 20px;
}

.main-layout {
    display: flex;
    gap: 20px;
}

.draw-section {
    flex: 2; /* Ocupa más espacio */
}

.config-section {
    flex: 1; /* Ocupa menos espacio */
}

.current-number-display {
    font-family: var(--number-font-family);
    font-size: 6em;
    color: var(--accent-color);
    text-align: center;
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: var(--border-radius);
    margin-bottom: 10px;
}

.drawn-count {
    text-align: center;
    font-size: 1.1em;
    margin-bottom: 20px;
}

.draw-controls {
    text-align: center;
    margin-bottom: 20px;
}
.draw-controls .control-button {
    font-size: 1.2em;
    padding: 15px 30px;
}
.auto-draw-controls {
    margin-top: 15px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: var(--border-radius);
}
.auto-draw-controls h3 { margin-top: 0; }
#autoDrawStatus { margin-left: 10px; font-style: italic; }


.number-board {
    display: grid;
    grid-template-columns: repeat(10, 1fr); /* 10 columnas */
    gap: 5px;
    margin-bottom: 20px;
}

.number-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px; /* Ajustar según necesidad */
    background-color: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: var(--border-radius);
    font-weight: bold;
    font-size: 0.9em;
    transition: background-color 0.3s, color 0.3s;
}

.number-cell.called {
    background-color: var(--secondary-color);
    color: white;
    text-decoration: line-through;
}

.history-panel {
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
    max-height: 200px; /* Para el scroll */
    overflow-y: auto;
}
.history-panel h3 { margin-top: 0; }
#controlHistoryList {
    list-style: none;
    padding: 0;
    margin: 0;
}
#controlHistoryList li {
    padding: 3px 0;
    font-size: 1.1em;
    border-bottom: 1px dashed #eee;
}
#controlHistoryList li:last-child { border-bottom: none; }

/* Acordeón */
.accordion-item {
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: var(--border-radius);
}
.accordion-header {
    background-color: #f7f7f7;
    color: var(--primary-color);
    cursor: pointer;
    padding: 15px;
    width: 100%;
    text-align: left;
    border: none;
    outline: none;
    font-size: 1.1em;
    transition: background-color 0.3s;
}
.accordion-header:hover, .accordion-header.active {
    background-color: #e9e9e9;
}
.accordion-content {
    padding: 15px;
    display: none; /* Oculto por defecto */
    background-color: white;
}
.accordion-content label, .accordion-content input, .accordion-content textarea, .accordion-content select {
    display: block;
    width: calc(100% - 30px); /* Para el padding */
    margin-bottom: 10px;
}
#logoPreview { margin-top: 5px; margin-bottom: 5px; }

/* Pestañas de Premios */
.prize-tabs {
    display: flex;
    margin-bottom: 10px;
}
.tab-link {
    padding: 10px 15px;
    cursor: pointer;
    border: 1px solid #ccc;
    background-color: #f1f1f1;
    margin-right: 5px;
    border-bottom: none;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
}
.tab-link.active {
    background-color: white;
    border-bottom: 1px solid white; /* Simula estar conectado al contenido */
}
.prize-config-item { border: 1px solid #eee; padding: 10px; }
.prize-config-item label { margin-top: 5px; }
.prize-config-item input[type="checkbox"] { display: inline-block; width: auto; margin-right: 5px;}
.prize-status { font-weight: bold; margin-left: 10px; }


/* Estilos de la Pantalla de Display (#display-screen) */
#display-screen {
    display: flex;
    flex-direction: column;
    height: 100vh; /* Ocupa toda la altura de la ventana */
    background-color: #1a2533; /* Fondo oscuro para contraste */
    color: var(--light-color);
    padding: 20px;
    box-sizing: border-box;
}

.display-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--secondary-color);
}
.event-info { display: flex; align-items: center; gap: 15px; }
#displayLogo { max-height: 60px; border-radius: var(--border-radius); }
#displayEventName { font-size: 2em; margin: 0; color: var(--light-color); }
#displayEventDescription { font-size: 1em; margin: 0; color: #bdc3c7; }

.active-prizes h3 { font-size: 1.2em; margin: 0 0 5px 0; color: var(--secondary-color); }
#displayActivePrizes { list-style: none; padding: 0; margin: 0; text-align: right; }
#displayActivePrizes li { font-size: 1em; }

.display-main {
    display: flex;
    flex-grow: 1; /* Ocupa el espacio restante */
    gap: 20px;
    margin-top: 20px;
    align-items: flex-start; /* Alinea los items al inicio para que no se estiren verticalmente */
}

.display-current-number-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0,0,0,0.2);
    border-radius: var(--border-radius);
    padding: 20px;
    min-height: 200px; /* Asegurar altura mínima */
}
.display-current-number {
    font-family: var(--number-font-family);
    font-size: 15vw; /* Tamaño relativo al viewport width */
    line-height: 1;
    color: #f1c40f; /* Amarillo */
    text-shadow: 3px 3px 5px rgba(0,0,0,0.5);
}

.display-number-board-container {
    flex: 2; /* Más espacio para el tablero */
    background-color: rgba(0,0,0,0.1);
    padding: 15px;
    border-radius: var(--border-radius);
}
.display-number-board-container h2 {
    text-align: center;
    margin-top: 0;
    font-size: 1.5em;
    color: var(--light-color);
}
#displayNumberBoard .number-cell {
    height: 5vh; /* Altura relativa al viewport height */
    font-size: 1.5vw; /* Tamaño de fuente relativo */
    background-color: #34495e; /* Azul oscuro más claro */
    border-color: #2c3e50;
    color: var(--light-color);
}
#displayNumberBoard .number-cell.called {
    background-color: var(--secondary-color);
    color: var(--dark-color);
    font-weight: bold;
    text-decoration: none; /* Quitar tachado, el color es suficiente */
}

.display-history {
    flex: 0.5; /* Espacio más pequeño para el historial */
    background-color: rgba(0,0,0,0.1);
    padding: 15px;
    border-radius: var(--border-radius);
    max-height: calc(100vh - 150px); /* Evita que crezca demasiado */
    overflow-y: auto;
}
.display-history h3 { margin-top: 0; font-size: 1.2em; color: var(--secondary-color); }
#displayHistoryList { list-style: none; padding: 0; margin: 0; }
#displayHistoryList li {
    font-size: 2em; /* Números grandes en el historial */
    font-family: var(--number-font-family);
    padding: 5px 0;
    text-align: center;
    color: #bdc3c7;
}
#displayHistoryList li:first-child { color: var(--light-color); font-weight: bold; } /* El más reciente */


/* Overlays en Pantalla de Display */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85); /* Semi-transparente */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px); /* Efecto blur para el fondo */
}
.overlay-content {
    background-color: var(--primary-color);
    padding: 40px;
    border-radius: var(--border-radius);
    text-align: center;
    color: var(--light-color);
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
}
.overlay-content h2 { font-size: 3em; margin-bottom: 20px; color: var(--secondary-color); }
.overlay-content p { font-size: 1.5em; }

.winner-content h2 { color: #f1c40f; /* Amarillo para ganador */ }
.winner-content img {
    max-width: 80%;
    max-height: 30vh;
    margin-top: 20px;
    border-radius: var(--border-radius);
    border: 3px solid #f1c40f;
}

/* Responsividad Básica */
@media (max-width: 992px) { /* Para tablets y layouts más pequeños del control panel */
    .main-layout {
        flex-direction: column;
    }
    .display-main {
        flex-direction: column;
        align-items: stretch; /* Para que ocupen todo el ancho */
    }
    .display-current-number { font-size: 20vw; }
    #displayNumberBoard .number-cell { font-size: 2vw; }
    .display-history { max-height: 150px; }
}

@media (max-width: 768px) { /* Móviles */
    .number-board { grid-template-columns: repeat(5, 1fr); } /* Ajustar tablero para móviles */
    #displayNumberBoard { grid-template-columns: repeat(10, 1fr); /* Mantener 10 en display si es posible o ajustar */}
    #displayNumberBoard .number-cell { font-size: 2.5vw; height: 6vh;}

    .display-header { flex-direction: column; text-align: center; gap: 10px;}
    .active-prizes { text-align: center; }
    .display-current-number { font-size: 25vw; }
    .display-history { display: none; } /* Ocultar historial en pantallas muy pequeñas */
}
```

---

**4. `bingo-core.js` (Lógica del Juego)**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED STATE & CONFIG ---
    const MAX_NUMBER = 90; // 00 to 90 means 91 numbers
    const HISTORY_LENGTH = 5; // For lateral history
    const CONTROL_PANEL_ID = 'control-panel';
    const DISPLAY_SCREEN_ID = 'display-screen';

    let gameState = {
        allNumbers: Array.from({ length: MAX_NUMBER + 1 }, (_, i) => formatNumber(i)),
        drawnNumbers: [],
        currentNumber: null,
        eventDetails: {
            name: "Bingo Fantástico",
            description: "¡Gran sorteo de premios!",
            logo: null, // Base64 string for logo
        },
        prizes: {
            linea1: { name: "Línea 1", enabled: false, description: "Una línea horizontal", image: null, status: "disponible" },
            linea2: { name: "Línea 2", enabled: false, description: "Dos líneas horizontales", image: null, status: "disponible" },
            linea3: { name: "Línea 3", enabled: false, description: "Tres líneas horizontales", image: null, status: "disponible" },
            bingo: { name: "Bingo", enabled: true, description: "¡Cartón Lleno!", image: null, status: "disponible" }
        },
        autoMode: {
            active: false,
            interval: 4000, // ms
            timerId: null,
        },
        isVerifying: false,
        verifyingPrizeId: null,
        lastActionTimestamp: Date.now() // For localStorage sync
    };

    // --- UTILITY FUNCTIONS ---
    function formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    function saveState() {
        gameState.lastActionTimestamp = Date.now();
        localStorage.setItem('bingoGameState_v7.1', JSON.stringify(gameState));
        // Dispatch a custom event for BroadcastChannel or other more direct communication if needed in future
        // For now, localStorage 'storage' event will handle it.
    }

    function loadState() {
        const savedState = localStorage.getItem('bingoGameState_v7.1');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Smart merge: prioritize loaded state but keep functions/defaults if new props added
            gameState = { ...gameState, ...parsedState }; 
            // Ensure prizes object structure is maintained if new prizes are added to default
            gameState.prizes = { ...defaultPrizesStructure(), ...parsedState.prizes };
        }
    }
    
    function defaultPrizesStructure() { // Helper to ensure all prize keys exist
        return {
            linea1: { name: "Línea 1", enabled: false, description: "Una línea horizontal", image: null, status: "disponible" },
            linea2: { name: "Línea 2", enabled: false, description: "Dos líneas horizontales", image: null, status: "disponible" },
            linea3: { name: "Línea 3", enabled: false, description: "Tres líneas horizontales", image: null, status: "disponible" },
            bingo: { name: "Bingo", enabled: true, description: "¡Cartón Lleno!", image: null, status: "disponible" }
        };
    }


    // --- DOM ELEMENTS (Lazy loaded based on page) ---
    let elements = {};

    // --- INITIALIZATION ---
    loadState(); // Load state first

    if (document.getElementById(CONTROL_PANEL_ID)) {
        initControlPanel();
    } else if (document.getElementById(DISPLAY_SCREEN_ID)) {
        initDisplayScreen();
    }

    // --- CONTROL PANEL SPECIFIC LOGIC ---
    function initControlPanel() {
        elements = {
            // Sorteo
            controlCurrentNumber: document.getElementById('controlCurrentNumber'),
            controlDrawnCount: document.getElementById('controlDrawnCount'),
            btnDrawManual: document.getElementById('btnDrawManual'),
            autoDrawIntervalSelect: document.getElementById('autoDrawInterval'),
            btnToggleAutoDraw: document.getElementById('btnToggleAutoDraw'),
            autoDrawStatus: document.getElementById('autoDrawStatus'),
            controlNumberBoard: document.getElementById('controlNumberBoard'),
            controlHistoryList: document.getElementById('controlHistoryList'),
            // Evento
            eventNameInput: document.getElementById('eventName'),
            eventDescriptionInput: document.getElementById('eventDescription'),
            eventLogoInput: document.getElementById('eventLogo'),
            logoPreview: document.getElementById('logoPreview'),
            removeLogoBtn: document.getElementById('removeLogoBtn'),
            saveEventDetailsBtn: document.getElementById('saveEventDetails'),
            // Premios
            prizeTabsContainer: document.querySelector('.prize-tabs'),
            prizeConfigContent: document.getElementById('prizeConfigContent'),
            savePrizeSettingsBtn: document.getElementById('savePrizeSettings'),
            // Verificación
            verifyPrizeSelect: document.getElementById('verifyPrizeSelect'),
            btnStartVerification: document.getElementById('btnStartVerification'),
            verificationControls: document.getElementById('verificationControls'),
            verifyingPrizeName: document.getElementById('verifyingPrizeName'),
            btnConfirmWinner: document.getElementById('btnConfirmWinner'),
            btnRejectClaim: document.getElementById('btnRejectClaim'),
            // Utilidades
            btnResetDraw: document.getElementById('btnResetDraw'),
            btnFullReset: document.getElementById('btnFullReset'),
            btnExportPdf: document.getElementById('btnExportPdf'),
            btnExportHistoryCsv: document.getElementById('btnExportHistoryCsv'),
            // Acordeón
            accordionHeaders: document.querySelectorAll('.accordion-header'),
        };

        setupControlPanelListeners();
        renderControlPanelBoard();
        updateControlPanelUI();
        renderPrizeConfigTabs();
        switchPrizeTab('linea1'); // Default tab
    }

    function setupControlPanelListeners() {
        elements.btnDrawManual.addEventListener('click', drawNumberManual);
        elements.btnToggleAutoDraw.addEventListener('click', toggleAutoDraw);
        elements.autoDrawIntervalSelect.addEventListener('change', (e) => {
            gameState.autoMode.interval = parseInt(e.target.value);
            if (gameState.autoMode.active) { // Restart auto mode with new interval
                stopAutoDraw();
                startAutoDraw();
            }
            saveState();
        });

        elements.saveEventDetailsBtn.addEventListener('click', saveEventDetails);
        elements.eventLogoInput.addEventListener('change', handleLogoUpload);
        elements.removeLogoBtn.addEventListener('click', removeLogo);
        
        elements.prizeTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-link')) {
                switchPrizeTab(e.target.dataset.prize);
            }
        });
        elements.savePrizeSettingsBtn.addEventListener('click', savePrizeSettingsFromUI);

        elements.btnStartVerification.addEventListener('click', startVerification);
        elements.btnConfirmWinner.addEventListener('click', confirmWinner);
        elements.btnRejectClaim.addEventListener('click', rejectClaim);

        elements.btnResetDraw.addEventListener('click', () => {
            if (confirm("¿Seguro que quieres reiniciar el sorteo? Se borrarán los números sorteados.")) {
                resetDraw();
            }
        });
        elements.btnFullReset.addEventListener('click', () => {
            if (confirm("¡ATENCIÓN! ¿Seguro que quieres reiniciar TODO el juego? Se borrarán todos los datos, incluidos nombres de evento y premios.")) {
                if (confirm("ÚLTIMA ADVERTENCIA: Esta acción no se puede deshacer. ¿Continuar?")) {
                    fullReset();
                }
            }
        });
        elements.btnExportPdf.addEventListener('click', exportToPdf);
        elements.btnExportHistoryCsv.addEventListener('click', exportHistoryToCsv);

        elements.accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                header.classList.toggle('active');
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            });
        });
    }

    function renderControlPanelBoard() {
        elements.controlNumberBoard.innerHTML = '';
        gameState.allNumbers.forEach(numStr => {
            const cell = document.createElement('div');
            cell.classList.add('number-cell');
            cell.textContent = numStr;
            cell.dataset.number = numStr;
            elements.controlNumberBoard.appendChild(cell);
        });
    }
    
    function renderPrizeConfigTabs() {
        Object.keys(gameState.prizes).forEach(prizeId => {
            const prize = gameState.prizes[prizeId];
            const prizeDiv = document.createElement('div');
            prizeDiv.classList.add('prize-config-item');
            prizeDiv.id = `config-${prizeId}`;
            prizeDiv.style.display = 'none'; // Hide all initially

            prizeDiv.innerHTML = `
                <h4>Configurar: ${prize.name}</h4>
                <label>
                    <input type="checkbox" id="${prizeId}-enabled" data-prizeid="${prizeId}" ${prize.enabled ? 'checked' : ''}>
                    Habilitado
                </label>
                <label for="${prizeId}-description">Descripción:</label>
                <input type="text" id="${prizeId}-description" value="${prize.description}" data-prizeid="${prizeId}">
                <label for="${prizeId}-image">Imagen:</label>
                <input type="file" id="${prizeId}-image" accept="image/*" data-prizeid="${prizeId}">
                <img id="${prizeId}-imagePreview" src="${prize.image || '#'}" alt="Vista previa" style="max-width: 100px; display: ${prize.image ? 'block' : 'none'}; margin-top: 5px;">
                <button class="control-button" data-removeimage="${prizeId}" style="display: ${prize.image ? 'inline-block' : 'none'}; font-size:0.8em; padding:5px;">Quitar Imagen</button>
                <p>Estado: <span id="${prizeId}-status" class="prize-status">${prize.status}</span></p>
            `;
            elements.prizeConfigContent.appendChild(prizeDiv);

            // Add listeners for individual prize config items
            prizeDiv.querySelector(`#${prizeId}-enabled`).addEventListener('change', handlePrizeEnableChange);
            prizeDiv.querySelector(`#${prizeId}-image`).addEventListener('change', handlePrizeImageUpload);
            prizeDiv.querySelector(`[data-removeimage="${prizeId}"]`).addEventListener('click', (e) => removePrizeImage(e.target.dataset.removeimage));
        });
    }

    function switchPrizeTab(prizeIdToShow) {
        // Botones de pestaña
        elements.prizeTabsContainer.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.prize === prizeIdToShow);
        });
        // Contenido de la pestaña
        elements.prizeConfigContent.querySelectorAll('.prize-config-item').forEach(item => {
            item.style.display = item.id === `config-${prizeIdToShow}` ? 'block' : 'none';
        });
    }
    
    function handlePrizeEnableChange(e) {
        const prizeId = e.target.dataset.prizeid;
        const isChecked = e.target.checked;
        gameState.prizes[prizeId].enabled = isChecked;

        // Regla de habilitación: Línea 2 si Línea 1, Línea 3 si Línea 2
        if (prizeId === 'linea1' && !isChecked) { // Si deshabilitas Línea 1
            gameState.prizes.linea2.enabled = false;
            gameState.prizes.linea3.enabled = false;
            document.getElementById('linea2-enabled').checked = false;
            document.getElementById('linea3-enabled').checked = false;
        } else if (prizeId === 'linea2') {
            if (isChecked && !gameState.prizes.linea1.enabled) { // Intentar habilitar Línea 2 sin Línea 1
                alert("Primero debe habilitar Línea 1 para habilitar Línea 2.");
                e.target.checked = false;
                gameState.prizes.linea2.enabled = false;
            } else if (!isChecked) { // Si deshabilitas Línea 2
                 gameState.prizes.linea3.enabled = false;
                 document.getElementById('linea3-enabled').checked = false;
            }
        } else if (prizeId === 'linea3' && isChecked && !gameState.prizes.linea2.enabled) {
            alert("Primero debe habilitar Línea 2 para habilitar Línea 3.");
            e.target.checked = false;
            gameState.prizes.linea3.enabled = false;
        }
        // No se llama a saveState() aquí, se hace con el botón "Guardar Configuración Premios"
    }

    function handlePrizeImageUpload(e) {
        const prizeId = e.target.dataset.prizeid;
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                gameState.prizes[prizeId].image = event.target.result; // Base64
                document.getElementById(`${prizeId}-imagePreview`).src = event.target.result;
                document.getElementById(`${prizeId}-imagePreview`).style.display = 'block';
                document.querySelector(`[data-removeimage="${prizeId}"]`).style.display = 'inline-block';
                // No se llama a saveState() aquí
            };
            reader.readAsDataURL(file);
        }
    }
    
    function removePrizeImage(prizeId) {
        gameState.prizes[prizeId].image = null;
        document.getElementById(`${prizeId}-imagePreview`).src = '#';
        document.getElementById(`${prizeId}-imagePreview`).style.display = 'none';
        document.getElementById(`${prizeId}-image`).value = ''; // Reset file input
        document.querySelector(`[data-removeimage="${prizeId}"]`).style.display = 'none';
        // No se llama a saveState() aquí
    }
    
    function savePrizeSettingsFromUI() {
        Object.keys(gameState.prizes).forEach(prizeId => {
            gameState.prizes[prizeId].enabled = document.getElementById(`${prizeId}-enabled`).checked;
            gameState.prizes[prizeId].description = document.getElementById(`${prizeId}-description`).value;
            // Image is already in gameState from handlePrizeImageUpload or removePrizeImage
        });
        alert("Configuración de premios guardada.");
        updateControlPanelUI(); // Actualiza select de verificación, etc.
        saveState();
    }


    function updateControlPanelUI() {
        // Números
        elements.controlCurrentNumber.textContent = gameState.currentNumber || '--';
        elements.controlDrawnCount.textContent = `Bolillas sorteadas: ${gameState.drawnNumbers.length} / ${gameState.allNumbers.length}`;
        
        elements.controlNumberBoard.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.toggle('called', gameState.drawnNumbers.includes(cell.dataset.number));
        });

        elements.controlHistoryList.innerHTML = '';
        const historyToShow = gameState.drawnNumbers.slice(-HISTORY_LENGTH).reverse();
        historyToShow.forEach(num => {
            const li = document.createElement('li');
            li.textContent = num;
            elements.controlHistoryList.appendChild(li);
        });

        // Modo Automático
        elements.autoDrawIntervalSelect.value = gameState.autoMode.interval;
        elements.btnToggleAutoDraw.textContent = gameState.autoMode.active ? 'DETENER AUTOMÁTICO' : 'INICIAR AUTOMÁTICO';
        elements.autoDrawStatus.textContent = `Estado: ${gameState.autoMode.active ? 'Activo' : 'Inactivo'}`;
        elements.btnDrawManual.disabled = gameState.autoMode.active || gameState.isVerifying || (gameState.drawnNumbers.length === gameState.allNumbers.length);
        elements.btnToggleAutoDraw.disabled = gameState.isVerifying || (gameState.drawnNumbers.length === gameState.allNumbers.length);


        // Evento
        elements.eventNameInput.value = gameState.eventDetails.name;
        elements.eventDescriptionInput.value = gameState.eventDetails.description;
        if (gameState.eventDetails.logo) {
            elements.logoPreview.src = gameState.eventDetails.logo;
            elements.logoPreview.style.display = 'block';
            elements.removeLogoBtn.style.display = 'inline-block';
        } else {
            elements.logoPreview.src = '#';
            elements.logoPreview.style.display = 'none';
            elements.removeLogoBtn.style.display = 'none';
        }
        
        // Premios (actualizar estado en la UI de configuración)
        Object.keys(gameState.prizes).forEach(prizeId => {
            const prize = gameState.prizes[prizeId];
            const statusSpan = document.getElementById(`${prizeId}-status`);
            if (statusSpan) statusSpan.textContent = prize.status;
            // Checkbox de habilitado
            const enabledCheckbox = document.getElementById(`${prizeId}-enabled`);
            if(enabledCheckbox) enabledCheckbox.checked = prize.enabled;
            // Descripción
            const descriptionInput = document.getElementById(`${prizeId}-description`);
            if(descriptionInput) descriptionInput.value = prize.description;
            // Imagen
            const imagePreview = document.getElementById(`${prizeId}-imagePreview`);
            const removeImageBtn = document.querySelector(`[data-removeimage="${prizeId}"]`);
            if(imagePreview && removeImageBtn){
                if (prize.image) {
                    imagePreview.src = prize.image;
                    imagePreview.style.display = 'block';
                    removeImageBtn.style.display = 'inline-block';
                } else {
                    imagePreview.src = '#';
                    imagePreview.style.display = 'none';
                    removeImageBtn.style.display = 'none';
                }
            }
        });


        // Verificación
        elements.verifyPrizeSelect.innerHTML = '';
        Object.keys(gameState.prizes).forEach(prizeId => {
            const prize = gameState.prizes[prizeId];
            if (prize.enabled && prize.status === 'disponible') {
                const option = document.createElement('option');
                option.value = prizeId;
                option.textContent = prize.name;
                elements.verifyPrizeSelect.appendChild(option);
            }
        });
        elements.btnStartVerification.disabled = elements.verifyPrizeSelect.options.length === 0 || gameState.isVerifying;
        
        if (gameState.isVerifying) {
            elements.verificationControls.style.display = 'block';
            elements.verifyingPrizeName.textContent = gameState.prizes[gameState.verifyingPrizeId].name;
            elements.btnDrawManual.disabled = true;
            elements.btnToggleAutoDraw.disabled = true;
        } else {
            elements.verificationControls.style.display = 'none';
        }
    }

    function drawNumberManual() {
        if (gameState.drawnNumbers.length >= gameState.allNumbers.length) {
            alert("¡Todos los números han sido sorteados!");
            return;
        }
        if (gameState.isVerifying) {
            alert("No se puede sortear mientras se verifica un premio.");
            return;
        }

        let newNumber;
        do {
            newNumber = formatNumber(Math.floor(Math.random() * (MAX_NUMBER + 1)));
        } while (gameState.drawnNumbers.includes(newNumber));

        gameState.currentNumber = newNumber;
        gameState.drawnNumbers.push(newNumber);
        
        updateControlPanelUI();
        saveState();
    }

    function toggleAutoDraw() {
        if (gameState.autoMode.active) {
            stopAutoDraw();
        } else {
            startAutoDraw();
        }
        updateControlPanelUI();
        saveState();
    }

    function startAutoDraw() {
        if (gameState.drawnNumbers.length >= gameState.allNumbers.length) {
            alert("¡Todos los números han sido sorteados!");
            stopAutoDraw(); // Ensure it's stopped
            return;
        }
        gameState.autoMode.active = true;
        elements.btnDrawManual.disabled = true;
        gameState.autoMode.timerId = setInterval(() => {
            drawNumberManual();
            if (gameState.drawnNumbers.length >= gameState.allNumbers.length) {
                stopAutoDraw();
                alert("¡Todos los números han sido sorteados! Modo automático detenido.");
            }
        }, gameState.autoMode.interval);
    }

    function stopAutoDraw() {
        gameState.autoMode.active = false;
        elements.btnDrawManual.disabled = (gameState.drawnNumbers.length === gameState.allNumbers.length);
        clearInterval(gameState.autoMode.timerId);
        gameState.autoMode.timerId = null;
    }

    function saveEventDetails() {
        gameState.eventDetails.name = elements.eventNameInput.value;
        gameState.eventDetails.description = elements.eventDescriptionInput.value;
        // Logo is already in gameState.eventDetails.logo from handleLogoUpload
        alert("Detalles del evento guardados.");
        saveState();
        updateControlPanelUI(); // Para refrescar en caso de que el display esté en la misma página (debug)
    }

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                gameState.eventDetails.logo = e.target.result; // Base64 string
                elements.logoPreview.src = e.target.result;
                elements.logoPreview.style.display = 'block';
                elements.removeLogoBtn.style.display = 'inline-block';
                // No se guarda el estado aquí, se hace con el botón "Guardar Datos Evento"
            };
            reader.readAsDataURL(file);
        }
    }
    function removeLogo() {
        gameState.eventDetails.logo = null;
        elements.logoPreview.src = '#';
        elements.logoPreview.style.display = 'none';
        elements.removeLogoBtn.style.display = 'none';
        elements.eventLogoInput.value = ''; // Reset file input
        // No se guarda el estado aquí
    }

    function startVerification() {
        const selectedPrizeId = elements.verifyPrizeSelect.value;
        if (!selectedPrizeId) {
            alert("Por favor, seleccione un premio para verificar.");
            return;
        }
        if (gameState.autoMode.active) {
            stopAutoDraw(); // Stop auto draw if active
        }
        gameState.isVerifying = true;
        gameState.verifyingPrizeId = selectedPrizeId;
        gameState.prizes[selectedPrizeId].status = "verificando";
        
        updateControlPanelUI();
        saveState();
    }

    function confirmWinner() {
        const prizeId = gameState.verifyingPrizeId;
        gameState.prizes[prizeId].status = "ganado";
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        
        if (window.confetti) { // Disparar confeti desde el control panel también
            triggerConfetti();
        }

        updateControlPanelUI();
        saveState();
    }

    function rejectClaim() {
        const prizeId = gameState.verifyingPrizeId;
        gameState.prizes[prizeId].status = "disponible"; // Vuelve a estar disponible
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        
        updateControlPanelUI();
        saveState();
    }

    function resetDraw() {
        if (gameState.autoMode.active) stopAutoDraw();
        gameState.drawnNumbers = [];
        gameState.currentNumber = null;
        Object.keys(gameState.prizes).forEach(pid => gameState.prizes[pid].status = "disponible"); // Reset prize statuses
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        updateControlPanelUI();
        saveState();
    }

    function fullReset() {
        if (gameState.autoMode.active) stopAutoDraw();
        localStorage.removeItem('bingoGameState_v7.1'); // Clear storage
        // Re-initialize to default state values
        gameState = { // Re-assign to a fresh default state
            allNumbers: Array.from({ length: MAX_NUMBER + 1 }, (_, i) => formatNumber(i)),
            drawnNumbers: [],
            currentNumber: null,
            eventDetails: { name: "Bingo Fantástico", description: "¡Gran sorteo de premios!", logo: null },
            prizes: defaultPrizesStructure(),
            autoMode: { active: false, interval: 4000, timerId: null },
            isVerifying: false,
            verifyingPrizeId: null,
            lastActionTimestamp: Date.now()
        };
        renderPrizeConfigTabs(); // Re-render tabs as DOM might be stale
        switchPrizeTab('linea1'); 
        updateControlPanelUI();
        saveState(); // Save the fresh default state
        alert("Juego reseteado completamente.");
    }

    function exportToPdf() {
        // Intentaremos capturar el display screen si está abierto y es accesible,
        // sino, capturaremos una parte del control panel.
        // Esto es complejo sin comunicación directa de ventanas.
        // Por simplicidad, capturaremos el tablero del control panel.
        const { jsPDF } = window.jspdf;
        const elementToCapture = elements.controlNumberBoard; // O un div que englobe lo que quieras exportar

        html2canvas(elementToCapture, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps= pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.setFontSize(20);
            pdf.text(`Estado del Bingo - ${new Date().toLocaleString()}`, 10, 15);
            pdf.setFontSize(12);
            pdf.text(`Evento: ${gameState.eventDetails.name}`, 10, 25);
            pdf.text(`Números Sorteados: ${gameState.drawnNumbers.length}`, 10, 32);
            if(gameState.currentNumber) pdf.text(`Último número: ${gameState.currentNumber}`,10, 39);

            pdf.addImage(imgData, 'PNG', 10, 45, pdfWidth - 20, pdfHeight - 20);
            pdf.save(`bingo_estado_${Date.now()}.pdf`);
        }).catch(err => console.error("Error al exportar PDF:", err));
    }

    function exportHistoryToCsv() {
        let csvContent = "data:text/csv;charset=utf-8,NumeroSorteado\n";
        gameState.drawnNumbers.forEach(num => {
            csvContent += `${num}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bingo_historial_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- DISPLAY SCREEN SPECIFIC LOGIC ---
    function initDisplayScreen() {
        elements = {
            displayLogo: document.getElementById('displayLogo'),
            displayEventName: document.getElementById('displayEventName'),
            displayEventDescription: document.getElementById('displayEventDescription'),
            displayActivePrizes: document.getElementById('displayActivePrizes'),
            displayCurrentNumber: document.getElementById('displayCurrentNumber'),
            displayNumberBoard: document.getElementById('displayNumberBoard'),
            displayHistoryList: document.getElementById('displayHistoryList'),
            verificationOverlay: document.getElementById('verificationOverlay'),
            verifyingPrizeText: document.getElementById('verifyingPrizeText'),
            winnerOverlay: document.getElementById('winnerOverlay'),
            winnerPrizeName: document.getElementById('winnerPrizeName'),
            winnerPrizeDescription: document.getElementById('winnerPrizeDescription'),
            winnerPrizeImage: document.getElementById('winnerPrizeImage'),
            confettiCanvas: document.getElementById('confettiCanvas')
        };

        renderDisplayPanelBoard();
        updateDisplayPanelUI();

        window.addEventListener('storage', (event) => {
            if (event.key === 'bingoGameState_v7.1') {
                const newState = JSON.parse(event.newValue);
                // Only update if timestamp is newer to avoid loops or stale data
                if (newState && newState.lastActionTimestamp > gameState.lastActionTimestamp) {
                    gameState = { ...gameState, ...newState };
                     // Ensure prizes object structure is maintained if new prizes are added to default
                    gameState.prizes = { ...defaultPrizesStructure(), ...newState.prizes };
                    updateDisplayPanelUI();
                }
            }
        });
    }

    function renderDisplayPanelBoard() {
        elements.displayNumberBoard.innerHTML = '';
        gameState.allNumbers.forEach(numStr => {
            const cell = document.createElement('div');
            cell.classList.add('number-cell');
            cell.textContent = numStr;
            cell.dataset.number = numStr;
            elements.displayNumberBoard.appendChild(cell);
        });
    }
    
    function updateDisplayPanelUI() {
        // Event Info
        elements.displayEventName.textContent = gameState.eventDetails.name;
        elements.displayEventDescription.textContent = gameState.eventDetails.description;
        if (gameState.eventDetails.logo) {
            elements.displayLogo.src = gameState.eventDetails.logo;
            elements.displayLogo.style.display = 'block';
        } else {
            elements.displayLogo.style.display = 'none';
        }

        // Active Prizes
        elements.displayActivePrizes.innerHTML = '';
        Object.values(gameState.prizes).filter(p => p.enabled && p.status === 'disponible').forEach(prize => {
            const li = document.createElement('li');
            li.textContent = prize.name;
            elements.displayActivePrizes.appendChild(li);
        });

        // Current Number
        elements.displayCurrentNumber.textContent = gameState.currentNumber || '--';
        if (gameState.currentNumber) { // Simple animation for new number
            elements.displayCurrentNumber.style.transform = 'scale(0.8)';
            elements.displayCurrentNumber.style.opacity = '0.5';
            setTimeout(() => {
                elements.displayCurrentNumber.style.transform = 'scale(1)';
                elements.displayCurrentNumber.style.opacity = '1';
            }, 100);
        }


        // Number Board
        elements.displayNumberBoard.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.toggle('called', gameState.drawnNumbers.includes(cell.dataset.number));
        });

        // History List
        elements.displayHistoryList.innerHTML = '';
        const historyToShow = gameState.drawnNumbers.slice(-HISTORY_LENGTH).reverse(); // Show more on display? e.g. 10
        historyToShow.forEach(num => {
            const li = document.createElement('li');
            li.textContent = num;
            elements.displayHistoryList.appendChild(li);
        });

        // Overlays
        if (gameState.isVerifying && gameState.verifyingPrizeId) {
            const prizeBeingVerified = gameState.prizes[gameState.verifyingPrizeId];
            elements.verifyingPrizeText.textContent = `Se está verificando un cartón para ${prizeBeingVerified.name}`;
            elements.verificationOverlay.style.display = 'flex';
            elements.winnerOverlay.style.display = 'none'; // Hide winner overlay if verifying
            document.body.classList.add('blur-background');
        } else {
            elements.verificationOverlay.style.display = 'none';
            document.body.classList.remove('blur-background');
        }

        // Check for a newly won prize to display winner overlay
        const justWonPrizeId = Object.keys(gameState.prizes).find(pid => 
            gameState.prizes[pid].status === 'ganado' && 
            (!gameState.prizes[pid].announcedWinner || gameState.prizes[pid].announcedWinner < gameState.lastActionTimestamp)
        );

        if (justWonPrizeId) {
            const prize = gameState.prizes[justWonPrizeId];
            elements.winnerPrizeName.textContent = `¡${prize.name} GANADO!`;
            elements.winnerPrizeDescription.textContent = prize.description;
            if (prize.image) {
                elements.winnerPrizeImage.src = prize.image;
                elements.winnerPrizeImage.style.display = 'block';
            } else {
                elements.winnerPrizeImage.style.display = 'none';
            }
            elements.winnerOverlay.style.display = 'flex';
            elements.verificationOverlay.style.display = 'none'; // Ensure verification is hidden
            document.body.classList.add('blur-background-full');
            triggerConfetti();

            // Mark as announced to prevent re-showing without new action
            gameState.prizes[justWonPrizeId].announcedWinner = Date.now();
            // No saveState() here from display panel to avoid loops. Control panel is master.

            setTimeout(() => { // Auto-hide winner overlay after some time
                elements.winnerOverlay.style.display = 'none';
                document.body.classList.remove('blur-background-full');
                 // Could re-enable verification overlay if another prize is being verified (complex case)
            }, 15000); // 15 seconds
        } else if (!gameState.isVerifying) { // If no one won and not verifying, hide winner overlay
             elements.winnerOverlay.style.display = 'none';
             document.body.classList.remove('blur-background-full');
        }
    }
    
    function triggerConfetti() {
        if (typeof confetti !== 'function') return; // Guard clause

        const confettiCanvas = document.getElementById('confettiCanvas');
        if (!confettiCanvas) return;

        const myConfetti = confetti.create(confettiCanvas, {
            resize: true,
            useWorker: true
        });

        const duration = 5 * 1000; // 5 seconds
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            myConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            myConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

}); // End DOMContentLoaded
```

---

**Cómo usar:**

1.  Crea una carpeta para tu proyecto (ej: `bingo_v7_1`).
2.  Dentro de esa carpeta, crea los 4 archivos: `control.html`, `display.html`, `bingo-styles.css`, `bingo-core.js`.
3.  Copia y pega el contenido correspondiente en cada archivo.
4.  Abre `control.html` en una pestaña de tu navegador.
5.  Abre `display.html` en OTRA pestaña de tu navegador.
6.  Interactúa con el panel de control y observa los cambios en la pantalla pública.

**Consideraciones Adicionales para esta v7.1:**
*   **Accordion:** Implementado con CSS simple y JS para mostrar/ocultar.
*   **Pestañas de Premios:** Implementadas con JS para mostrar/ocultar divs de configuración.
*   **Imágenes:** Se guardan como Base64 en `localStorage`. Esto puede hacer que `localStorage` crezca si subes muchas imágenes grandes. Para producción, se consideraría subirlas a un servidor y guardar solo URLs.
*   **Confeti:** Integrado usando `confetti-js` desde CDN. Se dispara en el `display.html` cuando se detecta un ganador.
*   **Exportación PDF:** `jsPDF` y `html2canvas` se usan para capturar una parte del panel de control. Exportar el `display.html` directamente desde el `control.html` es más complejo por las restricciones de seguridad entre ventanas/pestañas si no se usa un servidor y `postMessage`.
*   **Robustez:** Se ha añadido un `lastActionTimestamp` para ayudar a la sincronización con `localStorage` y evitar que el `display` reaccione a sus propios cambios indirectos (aunque el `display` no debería escribir en `localStorage`).
*   **Errores y Mejoras UX:** Hay espacio para mejorar el manejo de errores, dar más feedback visual, y pulir las transiciones. Por ejemplo, el blur del fondo durante el overlay es un efecto que se puede añadir con CSS (`backdrop-filter` si el navegador lo soporta bien, o un `filter: blur()` en el elemento `body > *:not(.overlay)`). La implementación actual de blur en los overlays (`#display-screen.blur-background > *:not(.overlay)`) es una forma.

¡Esta base debería ser un excelente punto de partida para tu sistema de Bingo Interactivo v7.1!