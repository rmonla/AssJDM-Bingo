document.addEventListener('DOMContentLoaded', () => {
    const MAX_NUMBER = 99;
    // --- DOM Elements ---
    const bodyEl = document.body;
    const currentBallEl = document.getElementById('currentBallDisplay');
    const masterBoardEl = document.getElementById('masterBoardDisplay');
    const drawnBallsHistoryEl = document.getElementById('drawnBallsHistoryDisplay');
    const eventNameEl = document.getElementById('eventNameDisplay');
    const eventDescriptionEl = document.getElementById('eventDescriptionDisplay');
    const eventLogoEl = document.getElementById('eventLogoDisplay');
    const currentPlayEl = document.getElementById('currentPlayDisplay');

    const overlayContainerEl = document.getElementById('overlayMessageContainer');
    const mainDisplayMessageEl = document.getElementById('mainDisplayMessage');
    const winnerBoxEl = document.getElementById('winnerAnnouncementBox');
    const announcedPrizeNameEl = document.getElementById('announcedPrizeName');
    const announcedPrizeDescriptionEl = document.getElementById('announcedPrizeDescription');
    const announcedWinnerNameEl = document.getElementById('announcedWinnerName');
    const announcedPrizeImageEl = document.getElementById('announcedPrizeImage'); // Imagen del premio
    const announcedWinnerPhotoEl = document.getElementById('announcedWinnerPhoto'); // Foto del ganador

    let lastBallAnimated = null;
    let confettiInterval = null; // Para controlar el confeti continuo

    // --- Core Display Functions ---
    function createMasterBoard() {
        masterBoardEl.innerHTML = ''; // Limpiar tablero
        for (let i = 0; i <= MAX_NUMBER; i++) {
            const cell = document.createElement('div');
            cell.classList.add('master-board-cell-display');
            cell.textContent = i < 10 ? `0${i}` : i.toString();
            cell.dataset.number = i.toString();
            masterBoardEl.appendChild(cell);
        }
    }
    
    function updateDisplay(gameState) {
        // Actualizar información del evento
        eventNameEl.textContent = gameState.eventName || "Bingo";
        eventDescriptionEl.textContent = gameState.eventDescription || "";
        if (gameState.eventLogoUrl) {
            eventLogoEl.src = gameState.eventLogoUrl;
            eventLogoEl.style.display = 'block';
        } else {
            eventLogoEl.style.display = 'none';
        }
        currentPlayEl.textContent = gameState.currentPlayMessage || "Cargando...";

        // Si es un reseteo completo del juego
        if (gameState.gameReset) {
            currentBallEl.textContent = '--';
            drawnBallsHistoryEl.innerHTML = '';
            createMasterBoard(); // Recrea el tablero desde cero
            lastBallAnimated = null;
            stopContinuousConfetti();
            overlayContainerEl.classList.remove('active');
            mainDisplayMessageEl.textContent = "";
            winnerBoxEl.style.display = 'none';
            bodyEl.classList.remove('bingo-celebration');
            console.log("Display reseteado.");
            return;
        }

        // Actualizar bolilla actual
        const ballText = gameState.currentBall === null || gameState.currentBall === "" ? "--" : 
                         (typeof gameState.currentBall === 'number' && gameState.currentBall < 10 ? `0${gameState.currentBall}` : gameState.currentBall.toString());
        currentBallEl.textContent = ballText;
        if (ballText !== '--' && ballText !== "FIN" && ballText !== lastBallAnimated) {
            currentBallEl.classList.remove('ball-pop-animation');
            void currentBallEl.offsetWidth; // Trigger reflow
            currentBallEl.classList.add('ball-pop-animation');
            lastBallAnimated = ballText;
        }

        // Actualizar historial y tablero maestro
        if (gameState.drawnNumbers && Array.isArray(gameState.drawnNumbers)) {
            drawnBallsHistoryEl.innerHTML = '';
            gameState.drawnNumbers.slice().reverse().forEach(ball => {
                const ballItem = document.createElement('span');
                ballItem.classList.add('drawn-ball-history-item-display');
                ballItem.textContent = ball < 10 ? `0${ball}` : ball.toString();
                drawnBallsHistoryEl.appendChild(ballItem);
            });
            drawnBallsHistoryEl.scrollTop = 0; 

            // Marcar números en el tablero
            masterBoardEl.querySelectorAll('.master-board-cell-display').forEach(cell => cell.classList.remove('drawn'));
            gameState.drawnNumbers.forEach(ballNum => {
                const cell = masterBoardEl.querySelector(`.master-board-cell-display[data-number="${ballNum}"]`);
                if (cell) {
                    cell.classList.add('drawn');
                }
            });
        }

        // Manejar mensajes y anuncios de ganador en el overlay
        if (gameState.displayStatus) {
            if (gameState.displayStatus.mainMessage) {
                mainDisplayMessageEl.textContent = gameState.displayStatus.mainMessage;
                winnerBoxEl.style.display = 'none'; // Ocultar caja de ganador
                overlayContainerEl.classList.add('active');
                bodyEl.classList.remove('bingo-celebration'); // Quitar celebración si solo es mensaje
                stopContinuousConfetti(); // Detener confeti si solo es mensaje
            } else if (gameState.displayStatus.winnerAnnouncement) {
                const ann = gameState.displayStatus.winnerAnnouncement;
                announcedPrizeNameEl.textContent = ann.prizeName;
                announcedPrizeDescriptionEl.textContent = ann.prizeDescription || "";
                announcedWinnerNameEl.textContent = ann.winnerName;

                announcedPrizeImageEl.style.display = ann.prizeImageUrl ? 'block' : 'none';
                if(ann.prizeImageUrl) announcedPrizeImageEl.src = ann.prizeImageUrl;
                
                announcedWinnerPhotoEl.style.display = ann.winnerPhotoUrl ? 'block' : 'none';
                if(ann.winnerPhotoUrl) announcedWinnerPhotoEl.src = ann.winnerPhotoUrl;

                mainDisplayMessageEl.textContent = ""; // Limpiar mensaje principal
                winnerBoxEl.style.display = 'block';
                overlayContainerEl.classList.add('active');

                if (ann.isBingo) {
                    bodyEl.classList.add('bingo-celebration'); // Activa fondo especial
                    launchContinuousConfetti(['#FFD700', '#FFC107', '#FFEB3B', '#FFFACD', '#FFFFFF'], 0); // Confeti dorado para bingo (sin fin)
                } else {
                    bodyEl.classList.remove('bingo-celebration'); // Sin fondo especial para línea
                    launchContinuousConfetti(['#4dd0e1', '#80deea', '#26c6da', '#e0f7fa', '#afeeee'], 7000); // Confeti cian para línea (7 seg)
                }
            } else { // No hay mensaje ni anuncio
                overlayContainerEl.classList.remove('active');
                // No detener confeti aquí, podría ser el confeti general de BINGO
                // bodyEl.classList.remove('bingo-celebration'); // Tampoco, podría ser la celebración de BINGO
            }
        } else { // Si no hay displayStatus, asegurar que el overlay esté oculto
             overlayContainerEl.classList.remove('active');
        }
        
        // Manejar confeti general de BINGO (si triggerConfetti es true y no hay un anuncio específico)
        if (gameState.triggerConfetti && (!gameState.displayStatus || !gameState.displayStatus.winnerAnnouncement)) {
            if (!bodyEl.classList.contains('bingo-celebration')) { // Solo si no está ya celebrando un bingo anunciado
                bodyEl.classList.add('bingo-celebration');
                launchContinuousConfetti(['#FFD700', '#FFC107', '#FFEB3B', '#FFFACD', '#FFFFFF'], 0);
            }
        } else if (!gameState.triggerConfetti && (!gameState.displayStatus || !gameState.displayStatus.winnerAnnouncement?.isBingo)) {
            // Detener confeti general y celebración si no hay triggerConfetti y no se está mostrando un anuncio de BINGO.
            // Esto evita que se detenga el confeti de un anuncio de LÍNEA.
            stopContinuousConfetti();
            bodyEl.classList.remove('bingo-celebration');
        }
    }
    
    // --- Confetti Functions ---
    function launchContinuousConfetti(colors, durationMs = 0) {
        stopContinuousConfetti(); // Detener cualquier confeti anterior
        const animationEnd = durationMs > 0 ? Date.now() + durationMs : Infinity;
        let remainingTime = durationMs;

        function frame(currentTime) {
            if (confettiInterval === null) return; // Si se detuvo externamente

            if (durationMs > 0) {
                const elapsedTime = currentTime - (frame.lastTime || currentTime);
                remainingTime -= elapsedTime;
                if (remainingTime <= 0) {
                    stopContinuousConfetti();
                    return;
                }
            }
            frame.lastTime = currentTime;

            confetti({ particleCount: durationMs === 0 ? 3 : 2, angle: 60, spread: 65, origin: { x: 0 }, colors: colors, ticks: 200, drift: 0.1, scalar: 1.1 });
            confetti({ particleCount: durationMs === 0 ? 3 : 2, angle: 120, spread: 65, origin: { x: 1 }, colors: colors, ticks: 200, drift: -0.1, scalar: 1.1 });
            
            confettiInterval = requestAnimationFrame(frame);
        }
        frame.lastTime = performance.now(); // Usar performance.now() para alta precisión
        confettiInterval = requestAnimationFrame(frame);
    }

    function stopContinuousConfetti() {
        if (confettiInterval) {
            cancelAnimationFrame(confettiInterval);
        }
        confettiInterval = null;
        // confetti.reset(); // Opcional: limpia inmediatamente el canvas. Si se omite, el confeti existente caerá.
    }

    // --- Event Listeners & Initial Load ---
    window.addEventListener('storage', (event) => {
        if (event.key === 'bingoGameState') {
            try {
                const newState = JSON.parse(event.newValue);
                if (newState) {
                    updateDisplay(newState);
                    // console.log("Display actualizado por localStorage:", newState);
                }
            } catch (e) {
                console.error("Error al parsear gameState desde localStorage en Display:", e);
            }
        }
    });

    function initialLoad() {
        createMasterBoard(); // Crear el tablero al cargar
        try {
            const initialGameState = JSON.parse(localStorage.getItem('bingoGameState'));
            if (initialGameState) {
                updateDisplay(initialGameState);
                console.log("Estado inicial cargado en Display:", initialGameState);
            } else {
                // Estado por defecto si no hay nada en localStorage
                updateDisplay({
                    eventName: "Bingo Interactivo",
                    eventDescription: "¡Mucha Suerte!",
                    currentPlayMessage: "Esperando configuración del juego...",
                    currentBall: '--', drawnNumbers: [],
                    displayStatus: { mainMessage: "", winnerAnnouncement: null },
                    triggerConfetti: false
                });
            }
        } catch (e) {
            console.error("Error al cargar estado inicial en Display:", e);
            updateDisplay({ currentBall: '--', drawnNumbers: [] }); // Fallback
        }
    }

    initialLoad();
});