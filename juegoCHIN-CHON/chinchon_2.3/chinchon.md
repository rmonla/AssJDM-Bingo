¡Tienes razón! Pido disculpas por ese descuido. El problema es que en la clase `Carta`, el método `getHTML` ahora depende de `isDraggable`, pero en `renderizarManoCPU` y `renderizarFuentesDeRoboYPozo` (cuando se renderiza la carta superior del pozo para que no sea arrastrable) no se estaba pasando este argumento correctamente, o la lógica de visualización dentro de `getHTML` no estaba completa.

Además, vamos a integrar imágenes de cartas de póker de internet. Usaremos un servicio común para esto, como `deckofcardsapi.com` (aunque para un juego local sin API, es más común tener las imágenes o generar SVGs, usaremos URLs directas para simplificar).

**Correcciones y Adición de Imágenes:**

1.  **Arreglar `getHTML` y llamadas:** Asegurarnos que las cartas se rendericen correctamente siempre.
2.  **Usar URLs de Imágenes:** Modificar `Carta.getHTML()` para usar `<img>` tags con URLs de imágenes de cartas.

Aquí está el código corregido:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chin Chón - Poker (Drag & Drop con Imágenes)</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #006400;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            margin: 0;
            min-height: 100vh;
            box-sizing: border-box;
            position: relative;
            overflow-x: hidden;
        }

        .game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 900px;
        }

        .hand-area, .discard-pile-target {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 130px;
            margin-bottom: 20px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            flex-wrap: wrap;
        }
        .player-hand-container.drag-over {
             background-color: rgba(0, 0, 0, 0.3);
             border: 2px dashed #FFD700;
        }
        .discard-pile-target.drag-over {
            background-color: rgba(255, 0, 0, 0.2);
            border: 2px dashed #FF6347;
        }

        /* Estilo para cartas con imágenes */
        .card {
            width: 75px; /* Ajustar al tamaño de la imagen */
            height: 110px; /* Ajustar al tamaño de la imagen */
            margin: 5px;
            cursor: grab;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            position: relative;
            user-select: none;
            background-color: transparent; /* Sin fondo, la imagen lo cubre */
            border: none; /* Sin borde, la imagen lo define */
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            border-radius: 5px; /* Opcional, si las imágenes no tienen */
        }
        .card img {
            width: 100%;
            height: 100%;
            display: block;
            border-radius: 5px; /* Redondear esquinas de la imagen */
        }

        .card.dragging { opacity: 0.7; transform: scale(1.05) rotate(3deg); }
        .card.placeholder {
            width: 75px;
            height: 110px;
            border: 2px dashed #ccc;
            background: rgba(255,255,255,0.1);
            margin: 5px;
            border-radius: 5px;
        }

        .cpu-hand .card img { /* Para el dorso de la CPU */
            /* No se necesita ::before si la imagen de dorso se maneja directamente */
        }


        .deck-pozo-area {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
        }

        .deck-pile-container, .discard-pile-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 20px;
        }
        .deck-pile-container span, .discard-pile-container span {
            font-size: 0.9em;
            margin-bottom: 5px;
        }

        .deck-pile-source, .discard-pile-top-card-container { /* Contenedor para la carta superior del pozo */
            width: 85px; /* Un poco más para el borde */
            height: 120px;
            border: 2px dashed #fff;
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        .deck-pile-source {
            cursor: grab;
        }
        .deck-pile-source img { /* Imagen del dorso del mazo */
             width: 75px;
             height: 110px;
             border-radius: 5px;
        }

        .deck-pile-source.disabled-source,
        .discard-pile-top-card-container.disabled-source .card img { /* Si no se puede robar del pozo */
            opacity: 0.5;
            cursor: not-allowed;
        }


        .deck-pile-source .card-count{
            position: absolute;
            bottom: -20px;
            font-size: 12px;
            color: white;
        }
        .discard-pile-top-card-container .card { /* La carta visible en el pozo */
            margin: 0;
            cursor: grab;
        }
        .discard-pile-top-card-container:empty {
            border-style: dashed;
            color: rgba(255,255,255,0.7);
            display: flex; /* Para centrar el texto "Vacío" */
            justify-content: center;
            align-items: center;
        }


        .actions-area { margin-bottom: 15px; text-align: center; min-height: 40px; }
        .game-messages { margin-bottom: 10px; text-align: center; font-weight: bold; }
        button { /* Sin cambios */ }
        .scoreboard { /* Sin cambios */ }
        .modal { /* Sin cambios */ }
        .round-summary-cards .card { /* Para el resumen */
            width: 50px;
            height: 75px;
        }
        .round-summary-cards .card img {
            border-radius: 3px;
        }
        .melded img { border: 2px solid limegreen !important; }
        .unmelded img { border: 2px solid crimson !important; }

    </style>
</head>
<body>
    <div class="scoreboard"> <!-- ... --> </div>

    <div class="game-container">
        <h1>Chin Chón <small>(Poker - Imágenes)</small></h1>

        <div id="cpu-area">
            <h3>Mano CPU (<span id="cpu-card-count">0</span> cartas)</h3>
            <div class="hand-area cpu-hand" id="cpu-hand">
                <!-- Imágenes de dorso para CPU aquí -->
            </div>
        </div>

        <div class="deck-pozo-area">
            <div class="deck-pile-container">
                <span>MAZO</span>
                <div class="deck-pile-source" id="deck-pile-source" draggable="true" title="Arrastra para robar del Mazo">
                    <!-- Imagen del dorso del mazo -->
                    <div class="card-count" id="deck-count">0</div>
                </div>
            </div>
            <div class="discard-pile-container">
                <span>POZO (Arrastra carta aquí para descartar)</span>
                <div class="discard-pile-target hand-area" id="discard-pile-target">
                     <div class="discard-pile-top-card-container" id="discard-pile-top-card-container">
                        <!-- Carta superior del pozo (imagen) aquí -->
                     </div>
                </div>
            </div>
        </div>

         <div class="game-messages" id="game-message">Arrastra desde el Mazo o Pozo a tu mano para robar.</div>

        <div id="player-area">
            <h3>Tu Mano (Arrastra para ordenar o al Pozo para descartar)</h3>
            <div class="hand-area player-hand-container" id="player-hand-container">
                <!-- Imágenes de cartas del jugador aquí -->
            </div>
        </div>

        <div class="actions-area" id="actions-area"> <!-- ... --> </div>
    </div>

    <div id="round-summary-modal" class="modal">  <!-- Sin cambios --> </div>


<script>
    // --- CONSTANTES PARA CARTAS DE POKER ---
    const PALOS_POKER = ["Corazones", "Diamantes", "Treboles", "Picas"];
    // Mapeo para URLs de imágenes (ej. SVG de Wikipedia Commons o similar)
    // Usaremos un formato simple: VALORPALO.png (ej. AC.png para As de Corazones, KD.png para Rey de Diamantes)
    // Valores: A, 2, 3, 4, 5, 6, 7, 8, 9, T (Ten), J, Q, K
    // Palos: C (Clubs/Treboles), D (Diamonds/Diamantes), H (Hearts/Corazones), S (Spades/Picas)
    const VALOR_IMG_CODIGO = { 1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "T", 11: "J", 12: "Q", 13: "K" };
    const PALO_IMG_CODIGO = { "Corazones": "H", "Diamantes": "D", "Treboles": "C", "Picas": "S" };
    const BASE_IMG_URL = "https://deckofcardsapi.com/static/img/"; // Ejemplo, ¡podría cambiar o no estar disponible!
                                                                  // Alternativa: https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/svg-cards/
                                                                  // Usaremos deckofcardsapi por simplicidad de nombres (ej. KH.png, AC.png)
    const DORSO_CARTA_IMG_URL = BASE_IMG_URL + "blue_back.png"; // O red_back.png


    // Las constantes de puntuación y reglas del juego no cambian
    const VALORES_DISPLAY_POKER = { 1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K" };
    const VALORES_NUMERICOS_POKER = { "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13 };
    const PUNTOS_CARTAS_POKER = { "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 10, "Q": 10, "K": 10 };
    const LIMITE_PUNTOS_PARTIDA = -100; const PUNTOS_CHINCHON = -25; const PUNTOS_CERRAR_CON_CERO = -10;
    const MAX_PUNTOS_PARA_CERRAR = 5; const PENALIZACION_CORTE_FALLIDO = 25;


    // --- ESTADO DEL JUEGO (sin cambios) ---
    let mazo = []; let pozo = []; let manoJugador = []; let manoCPU = [];
    let puntuacionJugador = 0; let puntuacionCPU = 0; let rondaActual = 1;
    let turnoJugador = true; let juegoTerminado = false;
    let jugadorPuedeRobar = true; let jugadorDebeDescartar = false;

    // --- ELEMENTOS DEL DOM (discardPileTopCardContainer nuevo) ---
    const playerHandContainer = document.getElementById('player-hand-container');
    const cpuHandElement = document.getElementById('cpu-hand');
    const deckPileSourceElement = document.getElementById('deck-pile-source');
    const discardPileTargetElement = document.getElementById('discard-pile-target'); // Zona de drop general del pozo
    const discardPileTopCardContainer = document.getElementById('discard-pile-top-card-container'); // Contenedor específico para la carta de arriba
    const gameMessageElement = document.getElementById('game-message');
    const playerScoreElement = document.getElementById('player-score');
    const cpuScoreElement = document.getElementById('cpu-score');
    const roundNumberElement = document.getElementById('round-number');
    const deckCountElement = document.getElementById('deck-count');
    const cpuCardCountElement = document.getElementById('cpu-card-count');
    const actionsArea = document.getElementById('actions-area');
    const btnNextRound = document.getElementById('btn-next-round');
    const btnNewGame = document.getElementById('btn-new-game');
    const roundSummaryModal = document.getElementById('round-summary-modal');

    // --- VARIABLES DRAG AND DROP (sin cambios) ---
    let draggedItem = null; let draggedItemType = null; let draggedCardData = null;
    let placeholder = null;


    class Carta {
        constructor(valorNum, palo) {
            this.valorNum = valorNum; this.palo = palo;
            this.nombreValor = VALORES_DISPLAY_POKER[valorNum];
            this.puntos = PUNTOS_CARTAS_POKER[this.nombreValor];
            this.id = `${this.nombreValor}-${this.palo}-${Math.random().toString(16).slice(2)}`;
            this.imgCode = VALOR_IMG_CODIGO[valorNum] + PALO_IMG_CODIGO[palo]; // Ej: AH, KD, TC
            this.imgUrl = BASE_IMG_URL + this.imgCode + ".png";
        }
        toString() { return `${this.nombreValor} de ${this.palo}`; }

        getHTML(isDraggable = false, isCPU = false) {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card'); // Quitar suit-Palo, la imagen lo define
            cardDiv.dataset.id = this.id;
            // No necesitamos data-valorNum y data-palo en el DOM si no los usamos para CSS o selección compleja
            cardDiv.draggable = isDraggable;

            const img = document.createElement('img');
            img.src = isCPU ? DORSO_CARTA_IMG_URL : this.imgUrl;
            img.alt = isCPU ? "Carta CPU" : this.toString();
            cardDiv.appendChild(img);

            if (isDraggable && !isCPU) { // Solo cartas del jugador, no CPU ni del pozo no robable
                cardDiv.addEventListener('dragstart', handleDragStartPlayerCard);
                cardDiv.addEventListener('dragend', handleDragEndGeneral);
            }
            return cardDiv;
        }
    }

    function crearBaraja() { /* Sin cambios */ }
    function repartirCartas() { /* Sin cambios */ }

    function renderizarManoJugador() {
        playerHandContainer.innerHTML = '';
        manoJugador.forEach(carta => {
            const cardElement = carta.getHTML(true, false); // Draggable, no es CPU
            playerHandContainer.appendChild(cardElement);
        });
    }
    function renderizarManoCPU() {
        cpuHandElement.innerHTML = '';
        manoCPU.forEach(carta => {
            // La carta de la CPU se renderiza con su dorso
            const cardElement = carta.getHTML(false, true); // No draggable, es CPU (muestra dorso)
            cpuHandElement.appendChild(cardElement);
        });
        cpuCardCountElement.textContent = manoCPU.length;
    }

    function renderizarFuentesDeRoboYPozo() {
        // Mazo de Robo
        deckCountElement.textContent = mazo.length;
        deckPileSourceElement.innerHTML = ''; // Limpiar
        if (mazo.length > 0) {
            const imgDorsoMazo = document.createElement('img');
            imgDorsoMazo.src = DORSO_CARTA_IMG_URL;
            imgDorsoMazo.alt = "Mazo de robo";
            deckPileSourceElement.appendChild(imgDorsoMazo);
            const countDiv = document.createElement('div'); // Re-añadir contador
            countDiv.classList.add('card-count');
            countDiv.id = 'deck-count';
            countDiv.textContent = mazo.length;
            deckPileSourceElement.appendChild(countDiv);
        } else {
            deckPileSourceElement.textContent = "Vacío";
        }
        deckPileSourceElement.classList.toggle('disabled-source', mazo.length === 0 || !turnoJugador || !jugadorPuedeRobar);
        deckPileSourceElement.draggable = turnoJugador && jugadorPuedeRobar && mazo.length > 0;


        // Pozo (para robar de él y para descartar en él)
        discardPileTopCardContainer.innerHTML = ''; // Limpiar el contenedor específico de la carta superior
        if (pozo.length > 0) {
            const topCardPozo = pozo[pozo.length - 1];
            // Renderizar la carta con su imagen normal, será arrastrable si se puede robar
            const cardElement = topCardPozo.getHTML(turnoJugador && jugadorPuedeRobar, false);
            discardPileTopCardContainer.appendChild(cardElement);

            if (turnoJugador && jugadorPuedeRobar) {
                cardElement.addEventListener('dragstart', (e) => handleDragStartSourceCard(e, topCardPozo, 'discardTop'));
                cardElement.addEventListener('dragend', handleDragEndGeneral);
            }
        } else {
            discardPileTopCardContainer.textContent = "Vacío";
        }
        discardPileTopCardContainer.classList.toggle('disabled-source', pozo.length === 0 || !turnoJugador || !jugadorPuedeRobar);
    }


    function actualizarUI() { // Sin cambios estructurales, pero las renderizaciones usarán imágenes
        renderizarManoJugador();
        renderizarManoCPU();
        renderizarFuentesDeRoboYPozo();

        playerScoreElement.textContent = puntuacionJugador;
        cpuScoreElement.textContent = puntuacionCPU;
        roundNumberElement.textContent = rondaActual;

        actionsArea.innerHTML = '';
        if (turnoJugador && !jugadorPuedeRobar && !jugadorDebeDescartar) {
            const { puntosSueltos, esChinchon } = evaluarManoCompleto(manoJugador);
            if (esChinchon || puntosSueltos <= MAX_PUNTOS_PARA_CERRAR) {
                const btnCerrar = document.createElement('button');
                btnCerrar.id = 'btn-close-now';
                btnCerrar.textContent = esChinchon ? "¡Cerrar con CHINCHÓN!" : `Cerrar Ronda (${puntosSueltos} pts)`;
                btnCerrar.onclick = () => finalizarRonda("Jugador", esChinchon);
                actionsArea.appendChild(btnCerrar);
                const btnPasar = document.createElement('button');
                btnPasar.textContent = "Pasar Turno";
                btnPasar.onclick = cambiarTurno;
                actionsArea.appendChild(btnPasar);
            }
        }
        // Botones de fin de juego
        if (juegoTerminado) {
            btnNextRound.style.display = 'none';
            btnNewGame.style.display = 'inline-block';
            if (!actionsArea.contains(btnNewGame)) actionsArea.appendChild(btnNewGame); // Añadir solo si no está
        } else if (rondaActual > 0) { // Durante el juego activo
             btnNextRound.style.display = 'none';
             btnNewGame.style.display = 'none';
        }
    }

    // --- LÓGICA DRAG AND DROP ---
    // handleDragStartPlayerCard, handleDragStartSourceCard, handleDragEndGeneral
    // playerHandContainer listeners (dragover, dragleave, drop)
    // discardPileTargetElement listeners (dragover, dragleave, drop)
    // getDragAfterElementInPlayerHand
    // Estas funciones no necesitan cambiar mucho, ya que operan sobre los datos y el DOM.
    // La creación de `placeholder` se adaptará al tamaño de las nuevas cartas.
    function handleDragStartPlayerCard(e) {
        if (!turnoJugador || jugadorDebeDescartar || manoJugador.length === 0) { // Permitir arrastrar para descartar (si tiene 8) o para ordenar (si tiene 7)
            draggedItem = e.target.closest('.card'); // Asegurarse de tomar el div .card
            if (!draggedItem) return e.preventDefault();

            draggedItemType = 'playerCard';
            draggedCardData = manoJugador.find(c => c.id === draggedItem.dataset.id);
            if (!draggedCardData) return e.preventDefault();
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedCardData.id);
            draggedItem.classList.add('dragging');

            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.classList.add('placeholder'); // Usar clase genérica para placeholder
                // El tamaño se definirá en CSS para .placeholder
            }
        } else { e.preventDefault(); }
    }

    function handleDragStartSourceCard(e, cardData, type) {
        if (!turnoJugador || !jugadorPuedeRobar) { e.preventDefault(); return; }
        draggedItem = e.target.closest('.card') || e.target.closest('.deck-pile-source'); // Puede ser la carta del pozo o el div del mazo
        if (!draggedItem) return e.preventDefault();

        draggedItemType = type;
        draggedCardData = cardData; // Para 'discardTop', cardData es la carta. Para 'deck', es null.

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);
        draggedItem.classList.add('dragging'); // Para feedback visual
    }
    deckPileSourceElement.addEventListener('dragstart', (e) => {
         if (mazo.length > 0 && turnoJugador && jugadorPuedeRobar) {
             handleDragStartSourceCard(e, null, 'deck');
         } else { e.preventDefault(); }
    });
    function handleDragEndGeneral(e) { /* Sin cambios mayormente */
        if (draggedItem) draggedItem.classList.remove('dragging');
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        playerHandContainer.classList.remove('drag-over');
        discardPileTargetElement.classList.remove('drag-over'); // La zona de drop del pozo
        draggedItem = null; draggedItemType = null; draggedCardData = null;
    }

    playerHandContainer.addEventListener('dragover', (e) => { /* Sin cambios mayormente */
        e.preventDefault();
        e.dataTransfer.dropEffect = (draggedItemType === 'deck' || draggedItemType === 'discardTop') ? 'copy' : 'move';
        playerHandContainer.classList.add('drag-over');
        if (draggedItemType === 'playerCard' && placeholder) {
            const afterElement = getDragAfterElementInPlayerHand(e.clientX);
            if (afterElement == null) playerHandContainer.appendChild(placeholder);
            else playerHandContainer.insertBefore(placeholder, afterElement);
        }
    });
    playerHandContainer.addEventListener('dragleave', (e) => { /* Sin cambios mayormente */
        if (!playerHandContainer.contains(e.relatedTarget)) {
            playerHandContainer.classList.remove('drag-over');
            if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        }
    });
    playerHandContainer.addEventListener('drop', (e) => { /* Sin cambios mayormente */
        e.preventDefault(); playerHandContainer.classList.remove('drag-over');
        if (draggedItemType === 'deck') {
            if (mazo.length > 0 && turnoJugador && jugadorPuedeRobar) {
                const cartaRobada = mazo.pop(); manoJugador.push(cartaRobada);
                jugadorPuedeRobar = false; jugadorDebeDescartar = true;
                gameMessageElement.textContent = `Robaste del mazo. Arrastra una carta al Pozo para descartar.`;
                actualizarUI();
            }
        } else if (draggedItemType === 'discardTop') {
            if (pozo.length > 0 && turnoJugador && jugadorPuedeRobar && draggedCardData) { // draggedCardData es la carta del pozo
                pozo.pop(); // Quitarla del array del pozo
                manoJugador.push(draggedCardData);
                jugadorPuedeRobar = false; jugadorDebeDescartar = true;
                gameMessageElement.textContent = `Robaste ${draggedCardData} del Pozo. Arrastra para descartar.`;
                actualizarUI();
            }
        } else if (draggedItemType === 'playerCard') { /* Reordenar, sin cambios */
            const draggedCardId = draggedCardData.id;
            const originalIndex = manoJugador.findIndex(c => c.id === draggedCardId);
            if (originalIndex === -1) return;
            const [movedCard] = manoJugador.splice(originalIndex, 1);
            let newIndex = -1;
            if (placeholder && placeholder.parentNode === playerHandContainer) newIndex = Array.from(playerHandContainer.children).indexOf(placeholder);
            else {
                 const afterElement = getDragAfterElementInPlayerHand(e.clientX);
                 if(afterElement === null) newIndex = manoJugador.length;
                 else newIndex = manoJugador.findIndex(c => c.id === afterElement.dataset.id);
            }
            if (newIndex === -1) newIndex = manoJugador.length;
            manoJugador.splice(newIndex, 0, movedCard);
            if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
            renderizarManoJugador(); // Solo actualizar la mano del jugador
        }
    });
    function getDragAfterElementInPlayerHand(x) { /* Sin cambios */
        const draggableElements = [...playerHandContainer.querySelectorAll('.card:not(.dragging):not(.placeholder)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect(); const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Drop en el POZO (discardPileTargetElement)
    discardPileTargetElement.addEventListener('dragover', (e) => { /* Sin cambios */
        if (draggedItemType === 'playerCard' && turnoJugador && jugadorDebeDescartar) {
            e.preventDefault(); e.dataTransfer.dropEffect = 'move';
            discardPileTargetElement.classList.add('drag-over');
        }
    });
    discardPileTargetElement.addEventListener('dragleave', (e) => { /* Sin cambios */
         if (!discardPileTargetElement.contains(e.relatedTarget)) discardPileTargetElement.classList.remove('drag-over');
    });
    discardPileTargetElement.addEventListener('drop', (e) => { /* Sin cambios */
        e.preventDefault(); discardPileTargetElement.classList.remove('drag-over');
        if (draggedItemType === 'playerCard' && turnoJugador && jugadorDebeDescartar) {
            const cartaDescartadaId = draggedCardData.id;
            const index = manoJugador.findIndex(c => c.id === cartaDescartadaId);
            if (index > -1) {
                const [descartada] = manoJugador.splice(index, 1); pozo.push(descartada);
                jugadorDebeDescartar = false;
                gameMessageElement.textContent = `Descartaste ${descartada}.`;
                actualizarUI();
                const { esChinchon, puntosSueltos } = evaluarManoCompleto(manoJugador);
                if (!(esChinchon || puntosSueltos <= MAX_PUNTOS_PARA_CERRAR)) {
                    setTimeout(cambiarTurno, 300); // Pasa turno si no puede cerrar
                }
            }
        }
    });

    // --- Lógica de Juego (ChinChon, CPU, Puntuación, Rondas) ---
    // Copiadas y adaptadas de la versión anterior.
    function cambiarTurno() { /* Sin cambios */
        turnoJugador = !turnoJugador; jugadorPuedeRobar = true; jugadorDebeDescartar = false;
        if (!turnoJugador) {
            gameMessageElement.textContent = "Turno de la CPU..."; actualizarUI(); setTimeout(turnoCPU, 1500);
        } else {
            gameMessageElement.textContent = "Tu turno. Arrastra para robar."; revisarMazoPozo(); actualizarUI();
        }
    }
    function revisarMazoPozo() { /* Sin cambios */
        let mazoCambiado = false;
        if (mazo.length === 0 && pozo.length > 1) {
            gameMessageElement.textContent = "Mazo agotado. Barajando pozo..."; const ultimaPozo = pozo.pop();
            mazo = [...pozo]; pozo = [ultimaPozo];
            for (let i = mazo.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mazo[i], mazo[j]] = [mazo[j], mazo[i]]; }
            mazoCambiado = true; gameMessageElement.textContent = "Mazo repuesto. Tu turno.";
        } else if (mazo.length === 0 && pozo.length <=1 && turnoJugador && jugadorPuedeRobar) {
            gameMessageElement.textContent = "¡Sin cartas para robar! Ronda en empate."; finalizarRonda(null, false, true); return;
        }
        if (mazoCambiado) actualizarUI();
    }
    function ordenarMano(mano) { return mano.slice().sort((a, b) => (a.palo < b.palo) ? -1 : (a.palo > b.palo) ? 1 : a.valorNum - b.valorNum); }
    function obtenerCombinacionesPosibles(mano) { /* ... (código largo, asumido igual que antes) ... */
        const combinaciones = []; const manoCopia = mano.slice();
        manoCopia.sort((a, b) => (a.palo < b.palo) ? -1 : (a.palo > b.palo) ? 1 : a.valorNum - b.valorNum);
        for (let i = 0; i < manoCopia.length; i++) {
            let escaleraActual = [manoCopia[i]];
            for (let j = i + 1; j < manoCopia.length; j++) {
                if (manoCopia[j].palo === escaleraActual[0].palo && manoCopia[j].valorNum === escaleraActual[escaleraActual.length - 1].valorNum + 1) {
                    escaleraActual.push(manoCopia[j]);
                } else if (manoCopia[j].palo !== escaleraActual[0].palo) break;
            }
            if (escaleraActual.length >= 3) {
                for (let len = 3; len <= escaleraActual.length; len++) {
                    for (let start = 0; start <= escaleraActual.length - len; start++) {
                        combinaciones.push(escaleraActual.slice(start, start + len));
                    }
                }
            }
        }
        const cartasPorValor = {};
        mano.forEach(carta => { (cartasPorValor[carta.valorNum] = cartasPorValor[carta.valorNum] || []).push(carta); });
        for (const valor in cartasPorValor) {
            if (cartasPorValor[valor].length >= 3) combinaciones.push(cartasPorValor[valor].slice(0, 3));
            if (cartasPorValor[valor].length === 4) combinaciones.push(cartasPorValor[valor].slice(0, 4));
        }
        let combinacionesUnicas = []; combinaciones.sort((a,b) => b.length - a.length);
        for (const comb of combinaciones) {
            if (!combinacionesUnicas.some(unica => comb.every(c => unica.find(u => u.id === c.id)))) {
                combinacionesUnicas.push(comb);
            }
        }
        return combinacionesUnicas;
    }
    function evaluarManoCompleto(mano) { /* ... (código largo, asumido igual que antes) ... */
        if (mano.length === 0) return { combinacionesElegidas: [], cartasSueltas: [], puntosSueltos: 0, esChinchon: false };
        const chinchon = esChinChon(mano);
        if (chinchon) return { combinacionesElegidas: [ordenarMano(mano.slice())], cartasSueltas: [], puntosSueltos: 0, esChinchon: true };

        let mejorResultado = { combinacionesElegidas: [], cartasSueltas: mano.slice(), puntosSueltos: mano.reduce((sum, c) => sum + c.puntos, 0), esChinchon: false };
        const todasCombinaciones = obtenerCombinacionesPosibles(mano.slice());
        function encontrarMejorConfig(idxCombActual, cartasYaUsadasIds, configActual) {
            if (idxCombActual === todasCombinaciones.length) {
                let currentSueltas = mano.filter(c => !cartasYaUsadasIds.has(c.id));
                let currentPuntos = currentSueltas.reduce((sum, c) => sum + c.puntos, 0);
                if (currentPuntos < mejorResultado.puntosSueltos || (currentPuntos === mejorResultado.puntosSueltos && configActual.reduce((s,m)=>s+m.length,0) > mejorResultado.combinacionesElegidas.reduce((s,m)=>s+m.length,0) )) {
                    mejorResultado = { combinacionesElegidas: configActual.slice(), cartasSueltas: currentSueltas, puntosSueltos: currentPuntos, esChinchon: false };
                } return;
            }
            encontrarMejorConfig(idxCombActual + 1, new Set(cartasYaUsadasIds), configActual.slice()); 
            const combIntento = todasCombinaciones[idxCombActual]; let sePuedeUsar = true;
            for (const cartaDeComb of combIntento) if (cartasYaUsadasIds.has(cartaDeComb.id)) { sePuedeUsar = false; break; }
            if (sePuedeUsar) {
                const nuevasCartasUsadasIds = new Set(cartasYaUsadasIds); combIntento.forEach(c => nuevasCartasUsadasIds.add(c.id));
                const nuevaConfigActual = configActual.slice(); nuevaConfigActual.push(combIntento);
                encontrarMejorConfig(idxCombActual + 1, nuevasCartasUsadasIds, nuevaConfigActual);
            }
        }
        if(todasCombinaciones.length > 0) encontrarMejorConfig(0, new Set(), []);
        return mejorResultado;
    }
    function esChinChon(mano) { /* ... (código, asumido igual que antes) ... */
        if (mano.length !== 7) return false; const manoOrd = ordenarMano(mano.slice());
        const primerPalo = manoOrd[0].palo;
        for (let i = 0; i < manoOrd.length; i++) {
            if (manoOrd[i].palo !== primerPalo) return false;
            if (i > 0 && manoOrd[i].valorNum !== manoOrd[i-1].valorNum + 1) return false;
        } return true;
    }
    function cpuDecideRobar(manoCpu, cartaPozo) { /* ... (código, asumido igual que antes) ... */
        if (!cartaPozo) return "mazo";
        if (manoCpu.length === 6) if (esChinChon([...manoCpu, cartaPozo])) return "pozo";
        const { puntosSueltos: puntosActuales } = evaluarManoCompleto(manoCpu);
        let mejorPuntosConPozo = Infinity; const manoConPozo = [...manoCpu, cartaPozo];
        if (manoConPozo.length > 7) {
            for (let i = 0; i < manoConPozo.length; i++) {
                const { puntosSueltos: p } = evaluarManoCompleto(manoConPozo.filter((_, idx) => idx !== i));
                if (p < mejorPuntosConPozo) mejorPuntosConPozo = p;
            }
        } else mejorPuntosConPozo = evaluarManoCompleto(manoConPozo).puntosSueltos;
        if (mejorPuntosConPozo < puntosActuales - 3 || (mejorPuntosConPozo <= MAX_PUNTOS_PARA_CERRAR && puntosActuales > MAX_PUNTOS_PARA_CERRAR)) return "pozo";
        return "mazo";
    }
    function cpuEligeDescarte(manoCpuOriginal) { /* ... (código, asumido igual que antes) ... */
        let manoCpu = manoCpuOriginal.slice(); let cartaADescartar = null; let minPuntosSueltosPostDescarte = Infinity;
        if (manoCpu.length <= 1) return manoCpu[0];
        for (let i = 0; i < manoCpu.length; i++) {
            const cartaPotencialDescarte = manoCpu[i];
            const { puntosSueltos } = evaluarManoCompleto(manoCpu.filter(c => c.id !== cartaPotencialDescarte.id));
            if (puntosSueltos < minPuntosSueltosPostDescarte || (puntosSueltos === minPuntosSueltosPostDescarte && (cartaADescartar === null || cartaPotencialDescarte.puntos > cartaADescartar.puntos))) {
                minPuntosSueltosPostDescarte = puntosSueltos; cartaADescartar = cartaPotencialDescarte;
            }
        } return cartaADescartar || manoCpu[Math.floor(Math.random() * manoCpu.length)];
    }
    function turnoCPU() { /* ... (código, adaptado como en la respuesta anterior para el descarte) ... */
         if (juegoTerminado) return; gameMessageElement.textContent = "CPU está pensando...";
        setTimeout(() => {
            revisarMazoPozo();
            if (mazo.length === 0 && pozo.length <=1 && !turnoJugador) { finalizarRonda(null, false, true); return; }
            const cartaDelPozo = pozo.length > 0 ? pozo[pozo.length - 1] : null;
            const decisionRobo = cpuDecideRobar(manoCPU, cartaDelPozo); let cartaRobadaCPU;
            if (decisionRobo === "pozo" && cartaDelPozo) {
                cartaRobadaCPU = pozo.pop(); gameMessageElement.textContent = `CPU ha robado ${cartaRobadaCPU} del pozo.`;
            } else {
                if (mazo.length === 0) { finalizarRonda(null, false, true); return; }
                cartaRobadaCPU = mazo.pop(); gameMessageElement.textContent = "CPU ha robado del mazo.";
            }
            manoCPU.push(cartaRobadaCPU);
            setTimeout(() => {
                const cartaParaDescartarCPU = cpuEligeDescarte(manoCPU); 
                const indexDescarte = manoCPU.findIndex(c => c.id === cartaParaDescartarCPU.id); 
                if (indexDescarte > -1) {
                    const [descartadaCPU] = manoCPU.splice(indexDescarte, 1); 
                    pozo.push(descartadaCPU); 
                    gameMessageElement.textContent = `CPU ha descartado ${descartadaCPU}.`;
                } else { if(manoCPU.length > 0) { const fb = manoCPU.pop(); pozo.push(fb); gameMessageElement.textContent = `CPU descartó (fb) ${fb}.`;}}
                actualizarUI();
                const { esChinchon: cpuChinchon, puntosSueltos: puntosCPUSueltos } = evaluarManoCompleto(manoCPU);
                if (cpuChinchon) finalizarRonda("CPU", true);
                else if (puntosCPUSueltos <= MAX_PUNTOS_PARA_CERRAR - 2) finalizarRonda("CPU", false);
                else cambiarTurno();
            }, 1000);
        }, 1000);
    }
    function finalizarRonda(cerrador, hizoChinchon, empateTecnico = false) { /* ... (código, igual que antes) ... */
        jugadorPuedeRobar = false; jugadorDebeDescartar = false;
        // El botón btnNextRound se controla en actualizarUI o al cerrar el modal
        
        let evalJugador = evaluarManoCompleto(manoJugador); let evalCPU = evaluarManoCompleto(manoCPU);
        let puntosRondaJugador = evalJugador.puntosSueltos; let puntosRondaCPU = evalCPU.puntosSueltos;
        let mensajeGanadorRonda = "";
        if (empateTecnico) {
            puntuacionJugador += puntosRondaJugador; puntuacionCPU += puntosRondaCPU;
            mensajeGanadorRonda = "Ronda en empate técnico.";
        } else if (cerrador === "Jugador") {
            if (hizoChinchon) { puntuacionJugador += PUNTOS_CHINCHON; puntuacionCPU += puntosRondaCPU; mensajeGanadorRonda = "¡Jugador hizo ChinChón!"; }
            else {
                puntuacionJugador += (puntosRondaJugador === 0) ? PUNTOS_CERRAR_CON_CERO : puntosRondaJugador;
                if (puntosRondaCPU < puntosRondaJugador && puntosRondaJugador > 0) { puntuacionJugador += PENALIZACION_CORTE_FALLIDO; mensajeGanadorRonda = `Jugador cerró, CPU tenía menos (${puntosRondaCPU}). ¡Penalización!`; }
                else mensajeGanadorRonda = `Jugador cerró con ${puntosRondaJugador} pts.`;
                puntuacionCPU += puntosRondaCPU;
            }
        } else if (cerrador === "CPU") {
            if (hizoChinchon) { puntuacionCPU += PUNTOS_CHINCHON; puntuacionJugador += puntosRondaJugador; mensajeGanadorRonda = "¡CPU hizo ChinChón!"; }
            else {
                puntuacionCPU += (puntosRondaCPU === 0) ? PUNTOS_CERRAR_CON_CERO : puntosRondaCPU;
                if (puntosRondaJugador < puntosRondaCPU && puntosRondaCPU > 0) { puntuacionCPU += PENALIZACION_CORTE_FALLIDO; mensajeGanadorRonda = `CPU cerró, Jugador tenía menos (${puntosRondaJugador}). ¡Penalización!`; }
                else mensajeGanadorRonda = `CPU cerró con ${puntosRondaCPU} pts.`;
                puntuacionJugador += puntosRondaJugador;
            }
        }
        document.getElementById('summary-player-points-round').textContent = `${puntosRondaJugador}`;
        mostrarCartasEnResumen('summary-player-melds', evalJugador.combinacionesElegidas, true);
        mostrarCartasEnResumen('summary-player-unmelded', evalJugador.cartasSueltas, false);
        document.getElementById('summary-cpu-points-round').textContent = `${puntosRondaCPU}`;
        mostrarCartasEnResumen('summary-cpu-melds', evalCPU.combinacionesElegidas, true);
        mostrarCartasEnResumen('summary-cpu-unmelded', evalCPU.cartasSueltas, false);
        document.getElementById('round-winner-message').textContent = mensajeGanadorRonda;
        roundSummaryModal.style.display = "flex";
        actualizarUI(); verificarFinPartida(); // verificarFinPartida ahora controla los botones de fin
    }
    function mostrarCartasEnResumen(elementId, items, esMelded) { /* ... (código, adaptado para usar imágenes) ... */
        const container = document.getElementById(elementId); container.innerHTML = '';
        if (!items || items.length === 0) { container.textContent = "Ninguna"; return; }
        if (esMelded) {
            items.forEach(grupoDeCartas => {
                 const groupDiv = document.createElement('div'); groupDiv.style.display='flex'; groupDiv.style.marginRight = '5px'; groupDiv.style.marginBottom = '2px';
                 grupoDeCartas.forEach(carta => { 
                    const cardEl = carta.getHTML(false,false); // No draggable, no CPU (muestra cara)
                    cardEl.classList.add('melded');
                    cardEl.style.width = '50px'; cardEl.style.height = '75px'; // Más pequeñas
                    groupDiv.appendChild(cardEl); 
                });
                container.appendChild(groupDiv);
            });
        } else { 
            items.forEach(carta => { 
                const cardEl = carta.getHTML(false,false); 
                cardEl.classList.add('unmelded');
                cardEl.style.width = '50px'; cardEl.style.height = '75px';
                container.appendChild(cardEl); 
            }); 
        }
    }
    function closeModal() { /* ... (código, igual que antes, pero actualizarUI maneja botones) ... */
        roundSummaryModal.style.display = "none";
        if (juegoTerminado) {
            // verificarFinPartida ya habrá puesto el botón de Nuevo Juego
        } else {
            // Si no ha terminado, se debe poder iniciar la siguiente ronda
            actionsArea.innerHTML = ''; // Limpiar
            btnNextRound.style.display = 'inline-block';
            actionsArea.appendChild(btnNextRound);
        }
        actualizarUI(); // Para asegurar que los estados de los botones sean correctos
    }
    function verificarFinPartida() { /* ... (código, igual que antes) ... */
         if (puntuacionJugador <= LIMITE_PUNTOS_PARTIDA || puntuacionCPU <= LIMITE_PUNTOS_PARTIDA) {
            juegoTerminado = true; let mensajeFinal = "¡Fin de la Partida! ";
            if (puntuacionJugador < puntuacionCPU) { mensajeFinal += (puntuacionJugador <= LIMITE_PUNTOS_PARTIDA && puntuacionCPU > LIMITE_PUNTOS_PARTIDA) ? "¡La CPU superó el límite! ¡GANASTE!" : "¡GANASTE!"; }
            else if (puntuacionCPU < puntuacionJugador) { mensajeFinal += (puntuacionCPU <= LIMITE_PUNTOS_PARTIDA && puntuacionJugador > LIMITE_PUNTOS_PARTIDA) ? "¡Superaste el límite! ¡GANA LA CPU!" : "¡GANA LA CPU!"; }
            else { mensajeFinal += "¡EMPATE!"; }
            gameMessageElement.textContent = mensajeFinal;
            document.getElementById('modal-close-button').textContent = "Ver Resultados Finales";
            actionsArea.innerHTML = ''; // Limpiar acciones
            btnNewGame.style.display = 'inline-block'; // Asegurar que solo este esté visible
            btnNextRound.style.display = 'none';
            actionsArea.appendChild(btnNewGame);
        }
    }
    function startNewRound() { /* ... (código, igual que antes) ... */
        if (juegoTerminado) return; rondaActual++;
        mazo = []; pozo = []; manoJugador = []; manoCPU = [];
        jugadorPuedeRobar = true; jugadorDebeDescartar = false;
        turnoJugador = (rondaActual % 2 === 1);
        crearBaraja(); repartirCartas();
        gameMessageElement.textContent = turnoJugador ? "Tu turno. Arrastra para robar." : "Turno de la CPU...";
        actionsArea.innerHTML = ''; // Limpiar botones
        actualizarUI();
        if (!turnoJugador) setTimeout(turnoCPU, 1500);
    }
    function initGame() { /* ... (código, igual que antes) ... */
        puntuacionJugador = 0; puntuacionCPU = 0; rondaActual = 0;
        juegoTerminado = false; turnoJugador = true;
        actionsArea.innerHTML = '';
        startNewRound();
    }

    window.onload = initGame;

</script>
</body>
</html>
```

**Explicación de los cambios para imágenes:**

1.  **Constantes para Imágenes:**
    *   `VALOR_IMG_CODIGO`: Mapea 1-13 a "A", "2"..."K", "T" (para el 10).
    *   `PALO_IMG_CODIGO`: Mapea "Corazones" a "H", etc.
    *   `BASE_IMG_URL`: URL base de donde se obtendrán las imágenes. He usado `deckofcardsapi.com/static/img/` que tiene imágenes nombradas como `AC.png` (As de Tréboles), `KH.png` (Rey de Corazones). **¡Esta URL podría no ser estable o cambiar!** Para un proyecto real, es mejor alojar tus propias imágenes.
    *   `DORSO_CARTA_IMG_URL`: URL para la imagen del dorso.

2.  **Clase `Carta` Modificada:**
    *   El constructor ahora crea `this.imgCode` (ej. "AH") y `this.imgUrl`.
    *   `getHTML(isDraggable = false, isCPU = false)`:
        *   Crea un `div.card` y dentro un `<img>`.
        *   `img.src` se establece a `this.imgUrl` o `DORSO_CARTA_IMG_URL` si `isCPU` es `true`.
        *   Se eliminó el contenido de texto (`span.value`, `span.suit`) ya que la imagen lo reemplaza.

3.  **CSS para Imágenes:**
    *   `.card`: Se ajustó `width`, `height`. `background-color: transparent; border: none;` para que la imagen sea la protagonista.
    *   `.card img`: Para asegurar que la imagen ocupe toda la carta y opcionalmente redondear sus esquinas.
    *   `.cpu-hand .card img`: Si necesitas un estilo específico para el dorso de la CPU (aunque `getHTML` ya lo maneja).
    *   `.deck-pile-source img`: Estilo para la imagen del dorso en el mazo.
    *   `.round-summary-cards .card`: Tamaños más pequeños para las cartas en el resumen.

4.  **Renderización:**
    *   `renderizarManoCPU()`: Llama a `carta.getHTML(false, true)` para mostrar el dorso.
    *   `renderizarFuentesDeRoboYPozo()`:
        *   Para el mazo (`deckPileSourceElement`), ahora muestra la imagen del dorso.
        *   Para la carta superior del pozo (`discardPileTopCardContainer`), usa `topCardPozo.getHTML(...)` para mostrar la cara de la carta.

**Importante sobre las URLs de Imágenes:**

*   La fiabilidad de URLs externas es un factor. Si `deckofcardsapi.com` cambia su estructura o elimina esas imágenes estáticas, el juego dejará de mostrarlas.
*   **Alternativa:** Podrías descargar un set de imágenes de cartas (hay muchos gratuitos en formato SVG o PNG) y ponerlos en una carpeta local junto a tu archivo HTML (ej. en una carpeta `images/`) y luego cambiar `BASE_IMG_URL` a `"images/"`. Esto es mucho más robusto para un proyecto personal. Por ejemplo, de [este repositorio de GitHub](https://github.com/hayeah/playing-cards-assets) podrías usar los SVGs.

Con estos cambios, las cartas deberían visualizarse usando imágenes. ¡Pruébalo!s