document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED STATE & CONFIG ---
    const MAX_NUMBER = 90; // 00 to 90 means 91 numbers
    const HISTORY_LENGTH = 5; // For lateral history
    const CONTROL_PANEL_ID = 'control-panel';
    const DISPLAY_SCREEN_ID = 'display-screen';

    // Helper para la estructura de premios por defecto, incluyendo wonTimestamp
    function defaultPrizesStructure() {
        return {
            linea1: { name: "Línea 1", enabled: false, description: "Una línea horizontal", image: null, status: "disponible", wonTimestamp: null },
            linea2: { name: "Línea 2", enabled: false, description: "Dos líneas horizontales", image: null, status: "disponible", wonTimestamp: null },
            linea3: { name: "Línea 3", enabled: false, description: "Tres líneas horizontales", image: null, status: "disponible", wonTimestamp: null },
            bingo: { name: "Bingo", enabled: true, description: "¡Cartón Lleno!", image: null, status: "disponible", wonTimestamp: null }
        };
    }

    let gameState = {
        allNumbers: Array.from({ length: MAX_NUMBER + 1 }, (_, i) => formatNumber(i)),
        drawnNumbers: [],
        currentNumber: null,
        eventDetails: {
            name: "Bingo Fantástico",
            description: "¡Gran sorteo de premios!",
            logo: null, 
        },
        prizes: defaultPrizesStructure(), // Usar la función para la estructura inicial
        autoMode: {
            active: false,
            interval: 4000, 
            timerId: null,
        },
        isVerifying: false,
        verifyingPrizeId: null,
        lastActionTimestamp: Date.now() 
    };

    // --- UTILITY FUNCTIONS ---
    function formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    function saveState() {
        gameState.lastActionTimestamp = Date.now();
        localStorage.setItem('bingoGameState_v7.1', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('bingoGameState_v7.1');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            const currentDefaultPrizes = defaultPrizesStructure();
            
            // Smart merge: prioritize loaded state but keep functions/defaults if new props added
            gameState = { ...gameState, ...parsedState }; 
            
            // Ensure prizes object structure is maintained, especially for new properties like wonTimestamp
            let mergedPrizes = {};
            for (const prizeId in currentDefaultPrizes) {
                mergedPrizes[prizeId] = {
                    ...currentDefaultPrizes[prizeId], // Start with new defaults (e.g., ensuring wonTimestamp exists)
                    ...(parsedState.prizes && parsedState.prizes[prizeId] ? parsedState.prizes[prizeId] : {}) // Override with saved values
                };
            }
            gameState.prizes = mergedPrizes;
        }
    }
    
    // defaultPrizesStructure() ya está definida arriba.

    // --- DOM ELEMENTS (Lazy loaded based on page) ---
    let elements = {};
    // Variable para el panel de display para rastrear anuncios de ganadores
    let lastShownWonTimestampForPrize = {}; 

    // --- INITIALIZATION ---
    loadState(); 

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
        switchPrizeTab('linea1'); 
    }

    function setupControlPanelListeners() {
        elements.btnDrawManual.addEventListener('click', drawNumberManual);
        elements.btnToggleAutoDraw.addEventListener('click', toggleAutoDraw);
        elements.autoDrawIntervalSelect.addEventListener('change', (e) => {
            gameState.autoMode.interval = parseInt(e.target.value);
            if (gameState.autoMode.active) { 
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
            prizeDiv.style.display = 'none'; 

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

            prizeDiv.querySelector(`#${prizeId}-enabled`).addEventListener('change', handlePrizeEnableChange);
            prizeDiv.querySelector(`#${prizeId}-image`).addEventListener('change', handlePrizeImageUpload);
            prizeDiv.querySelector(`[data-removeimage="${prizeId}"]`).addEventListener('click', (e) => removePrizeImage(e.target.dataset.removeimage));
        });
    }

    function switchPrizeTab(prizeIdToShow) {
        elements.prizeTabsContainer.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.prize === prizeIdToShow);
        });
        elements.prizeConfigContent.querySelectorAll('.prize-config-item').forEach(item => {
            item.style.display = item.id === `config-${prizeIdToShow}` ? 'block' : 'none';
        });
    }
    
    function handlePrizeEnableChange(e) {
        const prizeId = e.target.dataset.prizeid;
        const isChecked = e.target.checked;
        gameState.prizes[prizeId].enabled = isChecked;

        if (prizeId === 'linea1' && !isChecked) { 
            gameState.prizes.linea2.enabled = false;
            gameState.prizes.linea3.enabled = false;
            document.getElementById('linea2-enabled').checked = false;
            document.getElementById('linea3-enabled').checked = false;
        } else if (prizeId === 'linea2') {
            if (isChecked && !gameState.prizes.linea1.enabled) { 
                alert("Primero debe habilitar Línea 1 para habilitar Línea 2.");
                e.target.checked = false;
                gameState.prizes.linea2.enabled = false;
            } else if (!isChecked) { 
                 gameState.prizes.linea3.enabled = false;
                 document.getElementById('linea3-enabled').checked = false;
            }
        } else if (prizeId === 'linea3' && isChecked && !gameState.prizes.linea2.enabled) {
            alert("Primero debe habilitar Línea 2 para habilitar Línea 3.");
            e.target.checked = false;
            gameState.prizes.linea3.enabled = false;
        }
    }

    function handlePrizeImageUpload(e) {
        const prizeId = e.target.dataset.prizeid;
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                gameState.prizes[prizeId].image = event.target.result; 
                document.getElementById(`${prizeId}-imagePreview`).src = event.target.result;
                document.getElementById(`${prizeId}-imagePreview`).style.display = 'block';
                document.querySelector(`[data-removeimage="${prizeId}"]`).style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    function removePrizeImage(prizeId) {
        gameState.prizes[prizeId].image = null;
        document.getElementById(`${prizeId}-imagePreview`).src = '#';
        document.getElementById(`${prizeId}-imagePreview`).style.display = 'none';
        document.getElementById(`${prizeId}-image`).value = ''; 
        document.querySelector(`[data-removeimage="${prizeId}"]`).style.display = 'none';
    }
    
    function savePrizeSettingsFromUI() {
        Object.keys(gameState.prizes).forEach(prizeId => {
            gameState.prizes[prizeId].enabled = document.getElementById(`${prizeId}-enabled`).checked;
            gameState.prizes[prizeId].description = document.getElementById(`${prizeId}-description`).value;
        });
        alert("Configuración de premios guardada.");
        updateControlPanelUI(); 
        saveState();
    }


    function updateControlPanelUI() {
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

        elements.autoDrawIntervalSelect.value = gameState.autoMode.interval;
        elements.btnToggleAutoDraw.textContent = gameState.autoMode.active ? 'DETENER AUTOMÁTICO' : 'INICIAR AUTOMÁTICO';
        elements.autoDrawStatus.textContent = `Estado: ${gameState.autoMode.active ? 'Activo' : 'Inactivo'}`;
        elements.btnDrawManual.disabled = gameState.autoMode.active || gameState.isVerifying || (gameState.drawnNumbers.length === gameState.allNumbers.length);
        elements.btnToggleAutoDraw.disabled = gameState.isVerifying || (gameState.drawnNumbers.length === gameState.allNumbers.length);

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
        
        Object.keys(gameState.prizes).forEach(prizeId => {
            const prize = gameState.prizes[prizeId];
            const statusSpan = document.getElementById(`${prizeId}-status`);
            if (statusSpan) statusSpan.textContent = prize.status;
            const enabledCheckbox = document.getElementById(`${prizeId}-enabled`);
            if(enabledCheckbox) enabledCheckbox.checked = prize.enabled;
            const descriptionInput = document.getElementById(`${prizeId}-description`);
            if(descriptionInput) descriptionInput.value = prize.description;
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
            stopAutoDraw(); 
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
        alert("Detalles del evento guardados.");
        saveState();
        updateControlPanelUI(); 
    }

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                gameState.eventDetails.logo = e.target.result; 
                elements.logoPreview.src = e.target.result;
                elements.logoPreview.style.display = 'block';
                elements.removeLogoBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    }
    function removeLogo() {
        gameState.eventDetails.logo = null;
        elements.logoPreview.src = '#';
        elements.logoPreview.style.display = 'none';
        elements.removeLogoBtn.style.display = 'none';
        elements.eventLogoInput.value = ''; 
    }

    function startVerification() {
        const selectedPrizeId = elements.verifyPrizeSelect.value;
        if (!selectedPrizeId) {
            alert("Por favor, seleccione un premio para verificar.");
            return;
        }
        if (gameState.autoMode.active) {
            stopAutoDraw(); 
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
        gameState.prizes[prizeId].wonTimestamp = Date.now(); // Establecer timestamp de cuándo se ganó
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        
        if (window.confetti) { 
            triggerConfetti();
        }

        updateControlPanelUI();
        saveState();
    }

    function rejectClaim() {
        const prizeId = gameState.verifyingPrizeId;
        gameState.prizes[prizeId].status = "disponible"; 
        gameState.prizes[prizeId].wonTimestamp = null; // Resetear timestamp
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        
        updateControlPanelUI();
        saveState();
    }

    function resetDraw() {
        if (gameState.autoMode.active) stopAutoDraw();
        gameState.drawnNumbers = [];
        gameState.currentNumber = null;
        Object.keys(gameState.prizes).forEach(pid => {
            gameState.prizes[pid].status = "disponible";
            gameState.prizes[pid].wonTimestamp = null; // Resetear timestamp
        });
        gameState.isVerifying = false;
        gameState.verifyingPrizeId = null;
        updateControlPanelUI();
        saveState();
    }

    function fullReset() {
        if (gameState.autoMode.active) stopAutoDraw();
        localStorage.removeItem('bingoGameState_v7.1'); 
        gameState = { 
            allNumbers: Array.from({ length: MAX_NUMBER + 1 }, (_, i) => formatNumber(i)),
            drawnNumbers: [],
            currentNumber: null,
            eventDetails: { name: "Bingo Fantástico", description: "¡Gran sorteo de premios!", logo: null },
            prizes: defaultPrizesStructure(), // Usar la función para la estructura por defecto
            autoMode: { active: false, interval: 4000, timerId: null },
            isVerifying: false,
            verifyingPrizeId: null,
            lastActionTimestamp: Date.now()
        };
        // Es importante re-renderizar las pestañas de premios ya que el DOM se basa en la estructura inicial.
        if (elements.prizeConfigContent) { // Solo si el panel de control está inicializado
            elements.prizeConfigContent.innerHTML = ''; // Limpiar contenido viejo
            renderPrizeConfigTabs(); 
            switchPrizeTab('linea1'); 
        }
        updateControlPanelUI();
        saveState(); 
        alert("Juego reseteado completamente.");
    }

    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const elementToCapture = elements.controlNumberBoard; 

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
        
        // Inicializar la variable para rastrear anuncios de ganadores aquí
        lastShownWonTimestampForPrize = {};

        renderDisplayPanelBoard();
        updateDisplayPanelUI();

        window.addEventListener('storage', (event) => {
            if (event.key === 'bingoGameState_v7.1') {
                const newState = JSON.parse(event.newValue);
                if (newState && newState.lastActionTimestamp > gameState.lastActionTimestamp) {
                    const currentDefaultPrizes = defaultPrizesStructure();
                    gameState = { ...gameState, ...newState };
                    
                    let mergedPrizes = {};
                    for (const prizeId in currentDefaultPrizes) {
                        mergedPrizes[prizeId] = {
                            ...currentDefaultPrizes[prizeId],
                            ...(newState.prizes && newState.prizes[prizeId] ? newState.prizes[prizeId] : {})
                        };
                    }
                    gameState.prizes = mergedPrizes;
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
        elements.displayEventName.textContent = gameState.eventDetails.name;
        elements.displayEventDescription.textContent = gameState.eventDetails.description;
        if (gameState.eventDetails.logo) {
            elements.displayLogo.src = gameState.eventDetails.logo;
            elements.displayLogo.style.display = 'block';
        } else {
            elements.displayLogo.style.display = 'none';
        }

        elements.displayActivePrizes.innerHTML = '';
        Object.values(gameState.prizes).filter(p => p.enabled && p.status === 'disponible').forEach(prize => {
            const li = document.createElement('li');
            li.textContent = prize.name;
            elements.displayActivePrizes.appendChild(li);
        });

        elements.displayCurrentNumber.textContent = gameState.currentNumber || '--';
        if (gameState.currentNumber) { 
            elements.displayCurrentNumber.style.transform = 'scale(0.8)';
            elements.displayCurrentNumber.style.opacity = '0.5';
            setTimeout(() => {
                elements.displayCurrentNumber.style.transform = 'scale(1)';
                elements.displayCurrentNumber.style.opacity = '1';
            }, 100);
        }

        elements.displayNumberBoard.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.toggle('called', gameState.drawnNumbers.includes(cell.dataset.number));
        });

        elements.displayHistoryList.innerHTML = '';
        const historyToShow = gameState.drawnNumbers.slice(-HISTORY_LENGTH).reverse(); 
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
            elements.winnerOverlay.style.display = 'none'; 
            document.body.classList.add('blur-background');
            document.body.classList.remove('blur-background-full');
        } else {
            elements.verificationOverlay.style.display = 'none';
            document.body.classList.remove('blur-background');

            // Lógica para mostrar el overlay de ganador
            const prizeIdToShowWinner = Object.keys(gameState.prizes).find(pid => {
                const prize = gameState.prizes[pid];
                if (!prize) return false; 
                return prize.status === 'ganado' &&
                       prize.wonTimestamp && 
                       (!lastShownWonTimestampForPrize[pid] || lastShownWonTimestampForPrize[pid] < prize.wonTimestamp);
            });

            if (prizeIdToShowWinner) {
                const prize = gameState.prizes[prizeIdToShowWinner];
                elements.winnerPrizeName.textContent = `¡${prize.name} GANADO!`;
                elements.winnerPrizeDescription.textContent = prize.description;
                if (prize.image) {
                    elements.winnerPrizeImage.src = prize.image;
                    elements.winnerPrizeImage.style.display = 'block';
                } else {
                    elements.winnerPrizeImage.style.display = 'none';
                }
                elements.winnerOverlay.style.display = 'flex';
                document.body.classList.add('blur-background-full');
                triggerConfetti();

                // Registrar que este timestamp de ganador ya se mostró
                lastShownWonTimestampForPrize[prizeIdToShowWinner] = prize.wonTimestamp;

                setTimeout(() => { 
                    elements.winnerOverlay.style.display = 'none';
                    document.body.classList.remove('blur-background-full');
                }, 15000); // 15 segundos
            } else if (!Object.values(gameState.prizes).some(p => p.status === 'ganado' && p.wonTimestamp && (!lastShownWonTimestampForPrize[Object.keys(gameState.prizes).find(k=>gameState.prizes[k]===p)] || lastShownWonTimestampForPrize[Object.keys(gameState.prizes).find(k=>gameState.prizes[k]===p)] < p.wonTimestamp))) {
                // Si no hay un nuevo ganador para mostrar Y no hay una verificación, asegurarse que el overlay de ganador está oculto
                // Esto es importante para cuando el timeout termina o si el estado cambia y ya no hay un "justWonPrize".
                 elements.winnerOverlay.style.display = 'none';
                 document.body.classList.remove('blur-background-full');
            }
        }
    }
    
    function triggerConfetti() {
        if (typeof confetti !== 'function') return; 

        const confettiCanvas = document.getElementById('confettiCanvas');
        if (!confettiCanvas) return;

        const myConfetti = confetti.create(confettiCanvas, {
            resize: true,
            useWorker: true
        });

        const duration = 5 * 1000; 
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

});