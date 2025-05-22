document.addEventListener('DOMContentLoaded', () => {
    const MAX_NUMBER = 99;
    let currentGameState = {
        eventName: "Gran Bingo Solidario",
        eventDescription: "¡Participa y Gana Fabulosos Premios!",
        eventLogoUrl: null,
        prizes: [ // IDs deben ser únicos y consistentes
            { id: 'line1', type: 'line', defaultName: "Línea 1", customName: "", description: "", imageUrl: null, enabled: true, claimed: false, winnerName: null, winnerPhotoUrl: null },
            { id: 'line2', type: 'line', defaultName: "Línea 2", customName: "", description: "", imageUrl: null, enabled: false, claimed: false, winnerName: null, winnerPhotoUrl: null },
            { id: 'line3', type: 'line', defaultName: "Línea 3", customName: "", description: "", imageUrl: null, enabled: false, claimed: false, winnerName: null, winnerPhotoUrl: null },
            { id: 'bingo', type: 'bingo', defaultName: "Bingo Completo", customName: "", description: "", imageUrl: null, enabled: true, claimed: false, winnerName: null, winnerPhotoUrl: null }
        ],
        currentPlayMessage: "",
        currentBall: '--',
        drawnNumbers: [],
        availableNumbers: Array.from({ length: MAX_NUMBER + 1 }, (_, i) => i),
        gameActive: true,
        triggerConfetti: false, // Para el confeti general de BINGO final
        verifyingPrizeId: null,
        displayStatus: { mainMessage: "", winnerAnnouncement: null } // Para mensajes en display
    };

    // --- DOM Elements ---
    const eventNameInput = document.getElementById('eventName');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventLogoInput = document.getElementById('eventLogo');
    const logoPreview = document.getElementById('logoPreview');
    const logoPreviewContainer = document.getElementById('logoPreviewContainer');
    const saveMainConfigBtn = document.getElementById('saveMainConfigBtn');

    const tabsContainer = document.getElementById('prizeTabsContainer');
    const linePrizeTabsDiv = document.getElementById('linePrizeTabs');
    const linePrizeContentsDiv = document.getElementById('linePrizeContents');
    const bingoPrizeConfigDiv = document.getElementById('bingoPrizeConfigContainer');
    const savePrizesConfigBtn = document.getElementById('savePrizesConfigBtn');
    
    const currentPlayMessageDisplay = document.getElementById('currentPlayMessageDisplay');
    const drawBallBtn = document.getElementById('drawBallBtn');
    const announcePrizeCheckBtn = document.getElementById('announcePrizeCheckBtn');
    const currentPrizeToVerifyTextSpan = document.getElementById('currentPrizeToVerifyText');
    const resetGameBtn = document.getElementById('resetGameBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    const winnerVerificationSection = document.getElementById('winnerVerificationSection');
    const verifyingPrizeNameSpan = document.getElementById('verifyingPrizeNameSpan');
    const winnerNameInput = document.getElementById('winnerNameInput');
    const winnerPhotoInput = document.getElementById('winnerPhotoInput');
    const winnerPhotoPreview = document.getElementById('winnerPhotoPreview');
    const winnerPhotoPreviewContainer = document.getElementById('winnerPhotoPreviewContainer');
    const confirmAndAnnounceWinnerBtn = document.getElementById('confirmAndAnnounceWinnerBtn');
    const cancelVerificationBtn = document.getElementById('cancelVerificationBtn');

    let tempWinnerPhotoUrl = null;

    // --- Utility Functions ---
    function updateLocalStorage() {
        localStorage.setItem('bingoGameState', JSON.stringify(currentGameState));
        console.log("Estado guardado en LS:", JSON.parse(JSON.stringify(currentGameState)));
    }

    function loadFromLocalStorage() {
        const savedState = localStorage.getItem('bingoGameState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            currentGameState.eventName = parsedState.eventName || currentGameState.eventName;
            currentGameState.eventDescription = parsedState.eventDescription || currentGameState.eventDescription;
            currentGameState.eventLogoUrl = parsedState.eventLogoUrl || null;

            if (parsedState.prizes && parsedState.prizes.length === currentGameState.prizes.length) {
                currentGameState.prizes = currentGameState.prizes.map((defaultPrize, index) => {
                    const savedPrizeData = parsedState.prizes.find(sp => sp.id === defaultPrize.id);
                    return {
                        ...defaultPrize,
                        ...(savedPrizeData || {}),
                    };
                });
            }
            
            currentGameState.drawnNumbers = parsedState.drawnNumbers || [];
            currentGameState.availableNumbers = Array.from({ length: MAX_NUMBER + 1 }, (_, i) => i)
                .filter(n => !currentGameState.drawnNumbers.includes(n));
            currentGameState.gameActive = parsedState.gameActive !== undefined ? parsedState.gameActive : true;
            currentGameState.currentBall = parsedState.currentBall || '--';
        }
        
        eventNameInput.value = currentGameState.eventName;
        eventDescriptionInput.value = currentGameState.eventDescription;
        if (currentGameState.eventLogoUrl) {
            logoPreview.src = currentGameState.eventLogoUrl;
            logoPreviewContainer.classList.remove('hidden');
        }
        renderPrizesForm();
        updateGameStatusDisplay();
    }

    function handleImageUpload(fileInput, previewElement, previewContainer, callback) {
        const file = fileInput.files[0];
        previewElement.src = "#"; // Reset preview
        if (previewContainer) previewContainer.classList.add('hidden');

        if (file) {
            if (file.size > 2 * 1024 * 1024) { alert("Imagen demasiado grande (máx 2MB)."); fileInput.value = ""; callback(null); return; }
            if (!['image/jpeg', 'image/png'].includes(file.type)) { alert("Formato no válido (solo JPG/PNG)."); fileInput.value = ""; callback(null); return; }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
                if (previewContainer) previewContainer.classList.remove('hidden');
                callback(e.target.result);
            }
            reader.readAsDataURL(file);
        } else {
            callback(null); // No file selected or cleared
        }
    }
            
    // --- Event Config Logic ---
    eventLogoInput.addEventListener('change', () => handleImageUpload(eventLogoInput, logoPreview, logoPreviewContainer, (dataUrl) => {
        currentGameState.eventLogoUrl = dataUrl;
        // No guardar aquí, se hace con el botón
    }));

    saveMainConfigBtn.addEventListener('click', () => {
        currentGameState.eventName = eventNameInput.value.trim();
        currentGameState.eventDescription = eventDescriptionInput.value.trim();
        // eventLogoUrl ya está en currentGameState por el 'change' handler
        updateLocalStorage();
        alert("Configuración Principal Guardada.");
    });

    // --- Prizes Config Logic ---
    function createPrizeFormElements(prize, index, isBingo = false) {
        const prizeFormHTML = `
            ${isBingo ? '' : `<div class="form-group">
                <input type="checkbox" id="enablePrize_${prize.id}" data-index="${index}" ${prize.enabled ? 'checked' : ''}>
                <label for="enablePrize_${prize.id}" style="font-weight: normal;">Habilitar este premio de línea</label>
            </div>`}
            <div class="form-group">
                <label for="prizeName_${prize.id}">Nombre Personalizado ${isBingo ? '(Requerido)' : '(Opcional)'}:</label>
                <input type="text" id="prizeName_${prize.id}" data-index="${index}" value="${prize.customName || ''}" placeholder="${prize.defaultName}">
            </div>
            <div class="form-group">
                <label for="prizeDesc_${prize.id}">Descripción del Premio:</label>
                <textarea id="prizeDesc_${prize.id}" data-index="${index}" placeholder="Ej: Contenido del premio...">${prize.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="prizeImg_${prize.id}">Imagen del Premio (opcional):</label>
                <input type="file" id="prizeImg_${prize.id}" data-index="${index}" accept="image/jpeg, image/png">
                <div id="prizeImgPreviewContainer_${prize.id}" class="image-preview-container ${prize.imageUrl ? '' : 'hidden'}">
                    <img id="prizeImgPreview_${prize.id}" src="${prize.imageUrl || '#'}" alt="Vista Premio" class="image-preview">
                </div>
            </div>
            ${prize.claimed ? `<p class="prize-status"><strong>Entregado a:</strong> ${prize.winnerName || 'N/A'}</p>` : ''}
        `;
        return prizeFormHTML;
    }
    
    function renderPrizesForm() {
        linePrizeTabsDiv.innerHTML = '';
        linePrizeContentsDiv.innerHTML = '';
        bingoPrizeConfigDiv.innerHTML = '';

        currentGameState.prizes.forEach((prize, index) => {
            if (prize.type === 'line') {
                // Crear botón de pestaña
                const tabButton = document.createElement('button');
                tabButton.classList.add('tab-button');
                tabButton.dataset.tabTarget = `#prizeContent_${prize.id}`;
                tabButton.textContent = prize.customName || prize.defaultName;
                if (index === 0) tabButton.classList.add('active'); // Activar la primera pestaña por defecto
                linePrizeTabsDiv.appendChild(tabButton);

                // Crear contenido de pestaña
                const tabContent = document.createElement('div');
                tabContent.classList.add('tab-content');
                tabContent.id = `prizeContent_${prize.id}`;
                if (index === 0) tabContent.classList.add('active');
                
                const prizeItemDiv = document.createElement('div');
                prizeItemDiv.classList.add('prize-item');
                prizeItemDiv.innerHTML = createPrizeFormElements(prize, index);
                tabContent.appendChild(prizeItemDiv);
                linePrizeContentsDiv.appendChild(tabContent);

            } else if (prize.type === 'bingo') {
                const bingoItemDiv = document.createElement('div');
                bingoItemDiv.classList.add('prize-item');
                bingoItemDiv.innerHTML = `<h3>Configuración Premio Bingo</h3>` + createPrizeFormElements(prize, index, true);
                bingoPrizeConfigDiv.appendChild(bingoItemDiv);
            }
        });

        // Agregar listeners a los elementos recién creados
        currentGameState.prizes.forEach((prize, index) => {
            const enableCheckbox = document.getElementById(`enablePrize_${prize.id}`);
            const nameInput = document.getElementById(`prizeName_${prize.id}`);
            const descTextarea = document.getElementById(`prizeDesc_${prize.id}`);
            const imgInput = document.getElementById(`prizeImg_${prize.id}`);
            const imgPreview = document.getElementById(`prizeImgPreview_${prize.id}`);
            const imgPreviewContainer = document.getElementById(`prizeImgPreviewContainer_${prize.id}`);

            if(enableCheckbox) { // No existe para BINGO
                enableCheckbox.addEventListener('change', (e) => {
                    currentGameState.prizes[index].enabled = e.target.checked;
                    updateGameStatusDisplay();
                });
            }
            if(nameInput) {
                nameInput.addEventListener('input', (e) => {
                    currentGameState.prizes[index].customName = e.target.value;
                    if (prize.type === 'line') { // Actualizar texto de la pestaña
                        const tabButton = linePrizeTabsDiv.querySelector(`[data-tab-target="#prizeContent_${prize.id}"]`);
                        if (tabButton) tabButton.textContent = e.target.value || prize.defaultName;
                    }
                    updateGameStatusDisplay();
                });
            }
            if(descTextarea) {
                descTextarea.addEventListener('input', (e) => { currentGameState.prizes[index].description = e.target.value; });
            }
            if(imgInput) {
                imgInput.addEventListener('change', () => handleImageUpload(imgInput, imgPreview, imgPreviewContainer, (dataUrl) => {
                    currentGameState.prizes[index].imageUrl = dataUrl;
                }));
            }
        });

        // Manejadores para los botones de las pestañas
        const tabButtons = linePrizeTabsDiv.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                linePrizeContentsDiv.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const targetContent = document.querySelector(button.dataset.tabTarget);
                if(targetContent) targetContent.classList.add('active');
            });
        });
    }
    
    savePrizesConfigBtn.addEventListener('click', () => {
        // Los datos ya se actualizan en currentGameState con los eventos 'input' y 'change'
        updateLocalStorage();
        alert("Configuración de Premios Guardada.");
    });

    // --- Game Control Logic ---
    function getCurrentActivePrize() {
        return currentGameState.prizes.find(p => p.enabled && !p.claimed);
    }

    function updateGameStatusDisplay() {
        const activePrize = getCurrentActivePrize();
        if (activePrize) {
            const prizeName = activePrize.customName || activePrize.defaultName;
            currentGameState.currentPlayMessage = `Jugando por: ${prizeName}`;
            currentPlayMessageDisplay.value = prizeName;
            currentPrizeToVerifyTextSpan.textContent = prizeName;
        } else {
            currentGameState.currentPlayMessage = "Todos los premios entregados o juego no iniciado.";
            currentPlayMessageDisplay.value = "N/A";
            currentPrizeToVerifyTextSpan.textContent = "Premio";
        }
        drawBallBtn.disabled = !currentGameState.gameActive || currentGameState.availableNumbers.length === 0 || !activePrize;
        announcePrizeCheckBtn.disabled = !activePrize || currentGameState.drawnNumbers.length === 0;
        exportPdfBtn.disabled = currentGameState.prizes.every(p => !p.claimed); // Habilitar si al menos un premio fue reclamado
    }

    function initializeGameLogic() {
        currentGameState.availableNumbers = Array.from({ length: MAX_NUMBER + 1 }, (_, i) => i);
        currentGameState.drawnNumbers = [];
        currentGameState.gameActive = true;
        currentGameState.currentBall = '--';
        currentGameState.triggerConfetti = false;
        currentGameState.verifyingPrizeId = null;
        currentGameState.displayStatus = { mainMessage: "", winnerAnnouncement: null };
        currentGameState.prizes.forEach(p => { // Resetear estado de premios
            p.claimed = false; p.winnerName = null; p.winnerPhotoUrl = null;
            // No resetear p.enabled, p.customName, p.description, p.imageUrl aquí, son parte de la config.
        });
        
        winnerVerificationSection.classList.add('hidden');
        renderPrizesForm(); // Actualizar visualmente los estados de premios (ej. quitar "Entregado a")
        updateGameStatusDisplay();
        
        // Informar al display que resetee
        const tempStateForReset = { ...currentGameState, gameReset: true };
        localStorage.setItem('bingoGameState', JSON.stringify(tempStateForReset));
        setTimeout(() => { 
            delete tempStateForReset.gameReset; // Limpiar bandera para futuras actualizaciones
            localStorage.setItem('bingoGameState', JSON.stringify(tempStateForReset));
        }, 200);
        console.log("Juego Reiniciado");
    }
    resetGameBtn.addEventListener('click', initializeGameLogic);

    drawBallBtn.addEventListener('click', () => {
        if (!currentGameState.gameActive || currentGameState.availableNumbers.length === 0) {
            currentGameState.displayStatus.mainMessage = currentGameState.availableNumbers.length === 0 ? "¡Todas las bolillas sacadas!" : "Juego pausado o finalizado.";
            updateLocalStorage();
            return;
        }
        const randomIndex = Math.floor(Math.random() * currentGameState.availableNumbers.length);
        const ball = currentGameState.availableNumbers.splice(randomIndex, 1)[0];
        currentGameState.drawnNumbers.push(ball);
        currentGameState.currentBall = ball;
        currentGameState.displayStatus = { mainMessage: "", winnerAnnouncement: null }; // Limpiar mensajes de display

        if (currentGameState.availableNumbers.length === 0) {
            currentGameState.gameActive = false;
            currentGameState.displayStatus.mainMessage = "¡Todas las bolillas han sido sacadas!";
        }
        updateGameStatusDisplay();
        updateLocalStorage();
    });

    // --- Winner Verification Logic ---
    winnerPhotoInput.addEventListener('change', () => handleImageUpload(winnerPhotoInput, winnerPhotoPreview, winnerPhotoPreviewContainer, (dataUrl) => {
        tempWinnerPhotoUrl = dataUrl; // Para el ganador actual
    }));
    
    announcePrizeCheckBtn.addEventListener('click', () => {
        const prizeToVerify = getCurrentActivePrize();
        if (prizeToVerify) {
            currentGameState.verifyingPrizeId = prizeToVerify.id;
            const prizeName = prizeToVerify.customName || prizeToVerify.defaultName;
            verifyingPrizeNameSpan.textContent = prizeName;
            winnerNameInput.value = "";
            winnerPhotoInput.value = ""; 
            tempWinnerPhotoUrl = null; 
            winnerPhotoPreview.src = "#";
            winnerPhotoPreviewContainer.classList.add('hidden');
            
            winnerVerificationSection.classList.remove('hidden');
            drawBallBtn.disabled = true; // Pausar sacar bolillas
            // currentGameState.gameActive = false; // No completamente, solo pausar extracción.
            currentGameState.displayStatus = { mainMessage: `Verificando cartón para: ${prizeName}...`, winnerAnnouncement: null };
            updateLocalStorage();
        } else {
            alert("No hay premios activos para verificar o el juego no ha comenzado.");
        }
    });

    cancelVerificationBtn.addEventListener('click', () => {
        winnerVerificationSection.classList.add('hidden');
        currentGameState.verifyingPrizeId = null;
        // currentGameState.gameActive = true; // Reanudar si estaba pausado.
        currentGameState.displayStatus = { mainMessage: "", winnerAnnouncement: null }; // Limpiar mensaje display
        updateGameStatusDisplay(); // Esto reactivará drawBallBtn si es apropiado
        updateLocalStorage();
    });

    confirmAndAnnounceWinnerBtn.addEventListener('click', () => {
        const prizeId = currentGameState.verifyingPrizeId;
        const prizeIndex = currentGameState.prizes.findIndex(p => p.id === prizeId);
        if (prizeIndex === -1) { alert("Error: Premio no encontrado."); return; }

        const winnerDisplayName = winnerNameInput.value.trim();
        if (!winnerDisplayName) { alert("Por favor, ingresa el nombre del ganador."); return; }

        currentGameState.prizes[prizeIndex].claimed = true;
        currentGameState.prizes[prizeIndex].winnerName = winnerDisplayName;
        currentGameState.prizes[prizeIndex].winnerPhotoUrl = tempWinnerPhotoUrl;

        currentGameState.displayStatus.winnerAnnouncement = {
            prizeName: currentGameState.prizes[prizeIndex].customName || currentGameState.prizes[prizeIndex].defaultName,
            prizeDescription: currentGameState.prizes[prizeIndex].description,
            prizeImageUrl: currentGameState.prizes[prizeIndex].imageUrl, // Imagen del premio
            winnerName: winnerDisplayName,
            winnerPhotoUrl: tempWinnerPhotoUrl, // Foto del ganador
            isBingo: prizeId === 'bingo'
        };
        currentGameState.displayStatus.mainMessage = ""; // Limpiar mensaje de verificación

        if (prizeId === 'bingo') {
            currentGameState.gameActive = false; // Bingo termina el juego
            currentGameState.triggerConfetti = true; // Activar confeti general para bingo
        } else {
            // Para líneas, el juego puede continuar si hay más premios
            const remainingActivePrizes = currentGameState.prizes.some(p => p.enabled && !p.claimed);
            currentGameState.gameActive = remainingActivePrizes;
        }
        
        winnerVerificationSection.classList.add('hidden');
        currentGameState.verifyingPrizeId = null;
        tempWinnerPhotoUrl = null; 
        
        renderPrizesForm(); 
        updateGameStatusDisplay();
        updateLocalStorage();
    });

    // --- PDF Export Logic ---
    exportPdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        let yPosition = 15;
        const pageHeight = pdf.internal.pageSize.height;
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 15;

        function addText(text, x, y, size = 10, style = 'normal') {
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style);
            pdf.text(text, x, y);
        }
        
        function checkNewPage(neededHeight) {
            if (yPosition + neededHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
        }

        addText(`Reporte de Jugada: ${currentGameState.eventName}`, pageWidth / 2, yPosition, 18, 'bold', {align: 'center'});
        yPosition += 12;
        addText(`Descripción: ${currentGameState.eventDescription}`, margin, yPosition, 10);
        yPosition += 8;
        addText(`Fecha de Exportación: ${new Date().toLocaleString()}`, margin, yPosition, 8, 'italic');
        yPosition += 15;

        if (currentGameState.eventLogoUrl) {
            try {
                checkNewPage(50); // Approx height for logo
                await pdf.addImage(currentGameState.eventLogoUrl, 'JPEG', margin, yPosition, 40, 40);
                yPosition += 50; // Espacio después del logo
            } catch (e) { console.error("Error añadiendo logo:", e); yPosition +=10; /* Espacio de fallback */ }
        }

        addText("Ganadores de Premios:", margin, yPosition, 14, 'bold');
        yPosition += 10;

        for (const prize of currentGameState.prizes) {
            if (prize.claimed) {
                checkNewPage(80); // Estimado para un premio con imágenes
                const prizeDisplayName = prize.customName || prize.defaultName;
                addText(`Premio: ${prizeDisplayName}`, margin, yPosition, 12, 'bold');
                yPosition += 7;
                addText(`Ganador: ${prize.winnerName || 'N/A'}`, margin + 5, yPosition, 10);
                yPosition += 7;
                if(prize.description) {
                    addText(`Descripción Premio: ${prize.description}`, margin + 5, yPosition, 9);
                    yPosition += 7;
                }

                let imageX = margin + 5;
                if (prize.imageUrl) {
                    try {
                        checkNewPage(45);
                        addText('Imagen del Premio:', imageX, yPosition, 8, 'italic'); yPosition +=5;
                        await pdf.addImage(prize.imageUrl, 'JPEG', imageX, yPosition, 30, 30);
                        imageX += 40; // Mover para la siguiente imagen si hay
                    } catch (e) { console.error("Error añadiendo imagen premio:", e); }
                }
                if (prize.winnerPhotoUrl) {
                    try {
                        checkNewPage(45);
                        addText('Foto del Ganador:', imageX, yPosition - (prize.imageUrl ? 0 : 5) /*Ajuste si no hubo img previa*/ , 8, 'italic'); 
                        if(!prize.imageUrl) yPosition +=5; //Solo si no hubo otra img antes
                        await pdf.addImage(prize.winnerPhotoUrl, 'JPEG', imageX, yPosition, 30, 30);
                    } catch (e) { console.error("Error añadiendo foto ganador:", e); }
                }
                yPosition += 40; // Espacio después de las imágenes o del texto del ganador
                yPosition += 5; // Separador entre premios
            }
        }
        
        checkNewPage(20);
        addText("Números Cantados (" + currentGameState.drawnNumbers.length + "):", margin, yPosition, 12, 'bold');
        yPosition += 8;

        const numbersPerPage = 80; // Aprox.
        let numbersString = currentGameState.drawnNumbers.join(', ');
        let lines = pdf.splitTextToSize(numbersString, pageWidth - 2 * margin);
        
        checkNewPage(lines.length * 5); // 5 es aprox altura de linea
        pdf.setFontSize(10);
        pdf.text(lines, margin, yPosition);

        pdf.save(`Reporte_Bingo_${currentGameState.eventName.replace(/\s+/g, '_')}.pdf`);
    });


    // --- Inicialización ---
    loadFromLocalStorage(); // Cargar estado previo
    // Si no hay estado, los valores por defecto de currentGameState se usarán para la primera renderización.
});