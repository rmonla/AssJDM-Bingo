document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startGameButton = document.getElementById('start-game');
    const resetGameButton = document.getElementById('reset-game');
    const targetScoreInput = document.getElementById('target-score');
    const gameArea = document.getElementById('game-area');
    const player1CardsDiv = document.getElementById('player1-cards');
    const player2CardsDiv = document.getElementById('player2-cards');
    const score1Display = document.getElementById('score1');
    const score2Display = document.getElementById('score2');
    const currentTurnMessage = document.getElementById('current-turn-message');
    const lastDeclarationMessage = document.getElementById('last-declaration-message');
    const roundResultMessage = document.getElementById('round-result-message');
    const deckCountDisplay = document.getElementById('deck-count');
    const cpuThoughtDisplay = document.getElementById('cpu-thought');

    // Action Buttons & Inputs
    const discardButton = document.getElementById('discard-selected');
    const keepHandButton = document.getElementById('keep-hand');
    const declareHandTypeSelect = document.getElementById('declare-hand-type');
    const declareHandDetailsInput = document.getElementById('declare-hand-details'); // Optional
    const declareActionButton = document.getElementById('declare-action');
    const doubtActionButton = document.getElementById('doubt-action');
    const improveActionButton = document.getElementById('improve-action');
    const passActionButton = document.getElementById('pass-action');

    // --- Game State Variables ---
    let deck = [];
    let player1Hand = [];
    let player2Hand = [];
    let player1Score = 0;
    let player2Score = 0;
    let targetScore = 5;
    let currentPlayer = 1; // 1 for Player 1, 2 for Player 2 (CPU)
    let currentPhase = ''; // 'DISCARD', 'DECLARE', 'RESPOND'
    let lastDeclaration = null; // { player: 1, type: 'PAIR', details: 'Kings', actualHandValue: 2 }
    let discardPile = [];

    const SUITS = ["♥", "♦", "♣", "♠"]; // Hearts, Diamonds, Clubs, Spades
    const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const RANK_VALUES = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14 };
    const HAND_HIERARCHY = {
        HIGH_CARD: 1, PAIR: 2, TWO_PAIR: 3, THREE_OF_A_KIND: 4, STRAIGHT: 5,
        FLUSH: 6, FULL_HOUSE: 7, FOUR_OF_A_KIND: 8, STRAIGHT_FLUSH: 9, ROYAL_FLUSH: 10
    };

    // --- Game Logic Functions ---
    function createDeck() {
        deck = [];
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                deck.push({ suit, rank, value: RANK_VALUES[rank] });
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function dealCards() {
        player1Hand = [];
        player2Hand = [];
        discardPile = [];
        for (let i = 0; i < 5; i++) {
            if (deck.length > 0) player1Hand.push(deck.pop());
            if (deck.length > 0) player2Hand.push(deck.pop());
        }
        updateDeckCount();
    }

    function renderCards() {
        player1CardsDiv.innerHTML = '';
        player1Hand.forEach((card, index) => {
            const cardDiv = createCardDiv(card, index, 1);
            player1CardsDiv.appendChild(cardDiv);
        });

        player2CardsDiv.innerHTML = '';
        player2Hand.forEach((card, index) => {
            // For CPU, show hidden cards unless it's a reveal
            const cardDiv = createCardDiv(card, index, 2, currentPhase === 'REVEAL');
            player2CardsDiv.appendChild(cardDiv);
        });
    }

    function createCardDiv(card, index, player, show = true) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.dataset.cardIndex = index; // For discard selection
        cardDiv.dataset.player = player;

        if (show) {
            cardDiv.textContent = card.rank;
            const suitSpan = document.createElement('span');
            suitSpan.classList.add('suit');
            suitSpan.textContent = card.suit;
            if (card.suit === "♥" || card.suit === "♦") cardDiv.classList.add('hearts'); // Or diamonds
            else cardDiv.classList.add('spades'); // Or clubs
            cardDiv.appendChild(suitSpan);

            // Click listener for player 1's cards during discard phase
            if (player === 1 && currentPhase === 'DISCARD') {
                cardDiv.addEventListener('click', toggleCardSelection);
            }
        } else {
            cardDiv.classList.add('hidden');
            cardDiv.innerHTML = '<span>?</span>'; // Placeholder for hidden card
        }
        return cardDiv;
    }

    function toggleCardSelection(event) {
        if (currentPhase !== 'DISCARD' || currentPlayer !== 1) return;
        event.currentTarget.classList.toggle('selected');
    }

    function handleDiscard() {
        if (currentPlayer !== 1 || currentPhase !== 'DISCARD') return;

        const selectedCardsIndices = [];
        player1CardsDiv.querySelectorAll('.card.selected').forEach(cardDiv => {
            selectedCardsIndices.push(parseInt(cardDiv.dataset.cardIndex));
        });

        // Remove selected cards from hand (in reverse to avoid index issues)
        selectedCardsIndices.sort((a, b) => b - a).forEach(index => {
            discardPile.push(player1Hand.splice(index, 1)[0]);
        });

        // Draw new cards
        const numToDraw = selectedCardsIndices.length;
        for (let i = 0; i < numToDraw; i++) {
            if (deck.length > 0) {
                player1Hand.push(deck.pop());
            } else if (discardPile.length > 1) { // Reshuffle discard if deck is empty (leave last discarded)
                const toShuffle = discardPile.splice(0, discardPile.length -1);
                deck.push(...toShuffle);
                shuffleDeck();
                if (deck.length > 0) player1Hand.push(deck.pop());
            }
        }
        updateDeckCount();
        renderCards(); // Re-render cards after discard
        
        // CPU Discard Logic (simple: discard 0-2 random cards if hand is weak)
        cpuDiscardLogic();
        
        startDeclarationPhase();
    }

    function cpuDiscardLogic() {
        // Simple CPU discard: if hand is very weak (e.g. less than a pair), discard 1 or 2 random cards
        const cpuHandEval = evaluateHand(player2Hand);
        let cardsToDiscard = 0;
        if (cpuHandEval.numericValue < HAND_HIERARCHY.PAIR) {
            cardsToDiscard = Math.floor(Math.random() * 3); // 0, 1, or 2
        } else if (cpuHandEval.numericValue < HAND_HIERARCHY.TWO_PAIR) {
            cardsToDiscard = Math.floor(Math.random() * 2); // 0 or 1
        }

        for (let i = 0; i < cardsToDiscard; i++) {
            if (player2Hand.length > 0) {
                const randomIndex = Math.floor(Math.random() * player2Hand.length);
                discardPile.push(player2Hand.splice(randomIndex, 1)[0]);
                if (deck.length > 0) {
                    player2Hand.push(deck.pop());
                } else if (discardPile.length > 1) {
                    const toShuffle = discardPile.splice(0, discardPile.length -1);
                    deck.push(...toShuffle);
                    shuffleDeck();
                     if (deck.length > 0) player2Hand.push(deck.pop());
                }
            }
        }
        updateDeckCount();
        // Player 2 cards are not re-rendered here as they are hidden
        cpuThoughtDisplay.textContent = `CPU descartó ${cardsToDiscard} carta(s).`;
    }

    function handleKeepHand() {
        if (currentPlayer !== 1 || currentPhase !== 'DISCARD') return;
        // CPU Discard Logic (even if player keeps hand, CPU might discard)
        cpuDiscardLogic();
        startDeclarationPhase();
    }


    function startDeclarationPhase() {
        currentPhase = 'DECLARE';
        currentPlayer = Math.random() < 0.5 ? 1 : 2; // Random player starts declaration
        updateTurnMessage();
        updateActionButtonVisibility();
        if (currentPlayer === 2) {
            setTimeout(cpuDeclare, 1500); // CPU takes a moment to "think"
        }
    }

    function handleDeclareAction() {
        if (currentPlayer !== 1 || currentPhase !== 'DECLARE' && currentPhase !== 'RESPOND_IMPROVE') return;

        const declaredType = declareHandTypeSelect.value;
        const declaredDetails = declareHandDetailsInput.value.trim(); // Optional for now

        // Basic validation: if improving, must be better
        if (currentPhase === 'RESPOND_IMPROVE') {
            if (HAND_HIERARCHY[declaredType] <= HAND_HIERARCHY[lastDeclaration.type]) {
                roundResultMessage.textContent = "Debes declarar una mano superior a la anterior.";
                return;
            }
        }
        
        lastDeclaration = {
            player: 1,
            type: declaredType,
            details: declaredDetails,
            // actualHandValue: evaluateHand(player1Hand).numericValue // Don't reveal this yet
        };

        roundResultMessage.textContent = ""; // Clear previous result
        lastDeclarationMessage.textContent = `Jugador 1 declara: ${formatHandName(declaredType)} ${declaredDetails}`;
        currentPlayer = 2;
        currentPhase = 'RESPOND';
        updateTurnMessage();
        updateActionButtonVisibility();
        setTimeout(cpuRespond, 2000);
    }

    function handleDoubtAction() {
        if (currentPlayer !== 1 || currentPhase !== 'RESPOND') return;
        resolveDoubt(1); // Player 1 doubts Player 2's declaration
    }

    function handleImproveAction() {
        if (currentPlayer !== 1 || currentPhase !== 'RESPOND') return;
        currentPhase = 'RESPOND_IMPROVE'; // Player 1 wants to improve on CPU's declaration
        updateTurnMessage('Tu turno de mejorar la declaración.');
        updateActionButtonVisibility();
        // Now player 1 uses the declare button again, but it's an "improve" context
    }

    function handlePassAction() {
        if (currentPlayer !== 1 || currentPhase !== 'RESPOND') return;
        
        roundResultMessage.textContent = `Jugador 1 pasa. Jugador 2 gana la ronda.`;
        cpuThoughtDisplay.textContent = "";
        player2Score++;
        updateScores();
        checkWinCondition();
        if (!checkWinCondition()) {
            setTimeout(startNewRound, 2000);
        }
    }

    function resolveDoubt(doubtingPlayer) {
        currentPhase = 'REVEAL';
        renderCards(); // Show all cards

        const declaredPlayer = lastDeclaration.player;
        const declaredHandType = lastDeclaration.type;
        const handToEvaluate = declaredPlayer === 1 ? player1Hand : player2Hand;
        
        const actualHand = evaluateHand(handToEvaluate);
        const actualHandName = formatHandName(actualHand.type); // Use the type from evaluation
        
        let message = `¡Duda! Jugador ${declaredPlayer} declaró ${formatHandName(declaredHandType)}. `;
        message += `Tenía: ${actualHandName}.`;

        if (HAND_HIERARCHY[actualHand.type] >= HAND_HIERARCHY[declaredHandType]) { // Declaration was true (or better)
            message += ` ¡La declaración era VERDADERA!`;
            if (doubtingPlayer === 1) { // Player 1 doubted P2 (CPU)
                message += ` Jugador 2 (CPU) gana la ronda.`;
                player2Score++;
            } else { // Player 2 (CPU) doubted P1
                message += ` Jugador 1 gana la ronda.`;
                player1Score++;
            }
        } else { // Declaration was false
            message += ` ¡La declaración era FALSA!`;
            if (doubtingPlayer === 1) { // Player 1 doubted P2 (CPU)
                message += ` Jugador 1 gana la ronda.`;
                player1Score++;
            } else { // Player 2 (CPU) doubted P1
                message += ` Jugador 2 (CPU) gana la ronda.`;
                player2Score++;
            }
        }
        roundResultMessage.textContent = message;
        cpuThoughtDisplay.textContent = "";
        updateScores();
        
        if (!checkWinCondition()) {
            setTimeout(startNewRound, 4000); // Longer delay to read result
        }
    }

    // --- CPU Logic ---
    function cpuDeclare() {
        if (currentPlayer !== 2 || (currentPhase !== 'DECLARE' && currentPhase !== 'RESPOND_IMPROVE')) return;

        const cpuActualHand = evaluateHand(player2Hand);
        let declaredTypeKey;
        const handTypes = Object.keys(HAND_HIERARCHY);

        // Simple CPU strategy:
        // 60% chance to tell the truth (or slightly better if truth is weak)
        // 30% chance to bluff (declare something higher than actual)
        // 10% chance to under-declare (sandbag)
        const roll = Math.random();
        let declaredValue;

        if (roll < 0.6) { // Truth (or slightly better)
            declaredValue = cpuActualHand.numericValue;
            if (declaredValue < HAND_HIERARCHY.PAIR && Math.random() < 0.5) { // If high card, sometimes bluff a pair
                declaredValue = HAND_HIERARCHY.PAIR;
            }
        } else if (roll < 0.9) { // Bluff
            declaredValue = Math.min(cpuActualHand.numericValue + Math.floor(Math.random() * 3) + 1, HAND_HIERARCHY.ROYAL_FLUSH);
        } else { // Sandbag (declare lower)
            declaredValue = Math.max(cpuActualHand.numericValue - Math.floor(Math.random() * 2) -1, HAND_HIERARCHY.HIGH_CARD);
        }

        // Ensure declaration is valid if improving
        if (currentPhase === 'RESPOND_IMPROVE') {
            if (declaredValue <= HAND_HIERARCHY[lastDeclaration.type]) {
                 // If can't improve truthfully or with small bluff, might pass or doubt
                if (cpuActualHand.numericValue > HAND_HIERARCHY[lastDeclaration.type]) { // Can actually improve
                    declaredValue = cpuActualHand.numericValue;
                } else { // Can't improve, might pass or doubt (simplified: pass)
                    cpuThoughtDisplay.textContent = "CPU pasa.";
                    roundResultMessage.textContent = `Jugador 2 (CPU) pasa. Jugador 1 gana la ronda.`;
                    player1Score++;
                    updateScores();
                    if (!checkWinCondition()) setTimeout(startNewRound, 2000);
                    return;
                }
            }
        }
        
        declaredTypeKey = Object.keys(HAND_HIERARCHY).find(key => HAND_HIERARCHY[key] === declaredValue) || 'HIGH_CARD';

        lastDeclaration = {
            player: 2,
            type: declaredTypeKey,
            details: "", // CPU doesn't use details for now
            // actualHandValue: cpuActualHand.numericValue
        };
        lastDeclarationMessage.textContent = `Jugador 2 (CPU) declara: ${formatHandName(declaredTypeKey)}`;
        cpuThoughtDisplay.textContent = `CPU está pensando... (Declaró ${formatHandName(declaredTypeKey)})`;
        
        currentPlayer = 1;
        currentPhase = 'RESPOND';
        updateTurnMessage();
        updateActionButtonVisibility();
    }

    function cpuRespond() {
        if (currentPlayer !== 2 || currentPhase !== 'RESPOND') return;

        const cpuActualHand = evaluateHand(player2Hand);
        const declaredByPlayer1Type = lastDeclaration.type;
        const declaredByPlayer1Value = HAND_HIERARCHY[declaredByPlayer1Type];
        
        // CPU Decision: Doubt, Improve, or Pass
        // Strategy:
        // 1. If CPU has a hand better than P1's declaration, 70% chance to Improve, 30% to Doubt (if P1 might be bluffing high)
        // 2. If CPU's hand is worse or equal:
        //    a. If P1 declared something high (e.g., Full House+): 60% Doubt, 40% Pass
        //    b. If P1 declared something mid (e.g., Straight, Flush): 50% Doubt, 30% Pass, 20% Bluff Improve
        //    c. If P1 declared something low (e.g., Pair, Two Pair): 30% Doubt, 20% Pass, 50% Bluff Improve

        const roll = Math.random();
        let action;

        if (cpuActualHand.numericValue > declaredByPlayer1Value) { // CPU has better hand
            if (roll < 0.7) action = 'IMPROVE';
            else action = 'DOUBT'; // Doubt if P1 is declaring high and CPU suspects bluff
        } else { // CPU hand is worse or equal
            if (declaredByPlayer1Value >= HAND_HIERARCHY.FULL_HOUSE) {
                if (roll < 0.6) action = 'DOUBT';
                else action = 'PASS';
            } else if (declaredByPlayer1Value >= HAND_HIERARCHY.STRAIGHT) {
                if (roll < 0.5) action = 'DOUBT';
                else if (roll < 0.8) action = 'PASS';
                else action = 'IMPROVE'; // Bluff improve
            } else {
                if (roll < 0.3) action = 'DOUBT';
                else if (roll < 0.5) action = 'PASS';
                else action = 'IMPROVE'; // Bluff improve
            }
        }
        
        // Override: if P1 declares Royal Flush, CPU almost always doubts (unless CPU has it)
        if (declaredByPlayer1Type === 'ROYAL_FLUSH' && cpuActualHand.type !== 'ROYAL_FLUSH') {
            action = 'DOUBT';
        }

        cpuThoughtDisplay.textContent = `CPU considera la declaración de ${formatHandName(declaredByPlayer1Type)}...`;

        setTimeout(() => {
            if (action === 'DOUBT') {
                cpuThoughtDisplay.textContent = "CPU dice: ¡Lo Dudo!";
                resolveDoubt(2); // CPU (Player 2) doubts Player 1
            } else if (action === 'IMPROVE') {
                cpuThoughtDisplay.textContent = "CPU dice: ¡Mejoro!";
                currentPhase = 'RESPOND_IMPROVE'; // CPU wants to improve
                currentPlayer = 2; // CPU's turn to declare improvement
                updateTurnMessage("Turno de CPU para mejorar.");
                updateActionButtonVisibility();
                setTimeout(cpuDeclare, 1500); 
            } else { // PASS
                cpuThoughtDisplay.textContent = "CPU dice: Paso.";
                roundResultMessage.textContent = `Jugador 2 (CPU) pasa. Jugador 1 gana la ronda.`;
                player1Score++;
                updateScores();
                if (!checkWinCondition()) {
                    setTimeout(startNewRound, 2000);
                }
            }
        }, 1500);
    }


    // --- Hand Evaluation (Simplified) ---
    // This is the most complex part. A full poker hand evaluator is non-trivial.
    // This version will be basic.
    function evaluateHand(hand) {
        if (!hand || hand.length !== 5) return { type: "INVALID", numericValue: 0, details: "" };

        const ranks = hand.map(card => card.value).sort((a, b) => a - b);
        const suits = hand.map(card => card.suit);
        const rankCounts = {};
        ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);

        const isFlush = new Set(suits).size === 1;
        // Check for straight (Ace can be low or high)
        let isStraight = false;
        const uniqueRanks = [...new Set(ranks)]; // Ranks are already sorted
        if (uniqueRanks.length === 5) {
            // Normal straight: 2-3-4-5-6 up to 10-J-Q-K-A
            isStraight = (uniqueRanks[4] - uniqueRanks[0] === 4);
            // Ace-low straight: A-2-3-4-5 (values 14,2,3,4,5 -> sorted 2,3,4,5,14)
            if (!isStraight && uniqueRanks[0] === 2 && uniqueRanks[1] === 3 && uniqueRanks[2] === 4 && uniqueRanks[3] === 5 && uniqueRanks[4] === 14) {
                isStraight = true;
                // For A-5 straight, Ace value is effectively 1 for ranking, high card is 5
            }
        }
        
        const counts = Object.values(rankCounts).sort((a, b) => b - a); // [3,1,1], [2,2,1], [2,1,1,1]
        let handType = "HIGH_CARD";
        let handDetails = `Carta alta ${RANKS[ranks[4]-2]}`; // -2 because RANKS is 0-indexed and values start at 2

        if (isFlush && isStraight) {
            if (ranks[0] === 10 && ranks[4] === 14) handType = "ROYAL_FLUSH"; // 10,J,Q,K,A
            else handType = "STRAIGHT_FLUSH";
        } else if (counts[0] === 4) {
            handType = "FOUR_OF_A_KIND";
        } else if (counts[0] === 3 && counts[1] === 2) {
            handType = "FULL_HOUSE";
        } else if (isFlush) {
            handType = "FLUSH";
        } else if (isStraight) {
            handType = "STRAIGHT";
        } else if (counts[0] === 3) {
            handType = "THREE_OF_A_KIND";
        } else if (counts[0] === 2 && counts[1] === 2) {
            handType = "TWO_PAIR";
        } else if (counts[0] === 2) {
            handType = "PAIR";
        }

        return { type: handType, numericValue: HAND_HIERARCHY[handType], details: handDetails /* Could add more detail here */ };
    }


    // --- UI Update Functions ---
    function updateScores() {
        score1Display.textContent = player1Score;
        score2Display.textContent = player2Score;
    }

    function updateDeckCount() {
        deckCountDisplay.textContent = deck.length;
    }

    function updateTurnMessage(customMessage = null) {
        if (customMessage) {
            currentTurnMessage.textContent = customMessage;
            return;
        }
        let message = `Turno: Jugador ${currentPlayer} `;
        if (currentPhase === 'DISCARD') message += "(Fase de Descarte)";
        else if (currentPhase === 'DECLARE') message += "(Fase de Declaración)";
        else if (currentPhase === 'RESPOND') message += "(Fase de Respuesta)";
        else if (currentPhase === 'RESPOND_IMPROVE') message += "(Mejorando Declaración)";
        currentTurnMessage.textContent = message;
    }
    
    function formatHandName(typeKey) {
        if (!typeKey) return "N/A";
        return typeKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }


    function updateActionButtonVisibility() {
        // Hide all first
        [discardButton, keepHandButton, declareActionButton, declareHandTypeSelect, declareHandDetailsInput, doubtActionButton, improveActionButton, passActionButton].forEach(btn => btn.style.display = 'none');
        declareHandDetailsInput.style.display = 'none'; // Keep details hidden mostly

        if (currentPhase === 'GAME_OVER') return;

        if (currentPlayer === 1) { // Player 1's turn
            if (currentPhase === 'DISCARD') {
                discardButton.style.display = 'inline-block';
                keepHandButton.style.display = 'inline-block';
            } else if (currentPhase === 'DECLARE' || currentPhase === 'RESPOND_IMPROVE') {
                declareHandTypeSelect.style.display = 'inline-block';
                // declareHandDetailsInput.style.display = 'inline-block'; // Optional
                declareActionButton.style.display = 'inline-block';
            } else if (currentPhase === 'RESPOND') {
                doubtActionButton.style.display = 'inline-block';
                improveActionButton.style.display = 'inline-block';
                passActionButton.style.display = 'inline-block';
            }
        }
        // CPU actions are handled by CPU logic, no buttons shown for CPU.
    }

    // --- Game Flow Control ---
    function initGame() {
        player1Score = 0;
        player2Score = 0;
        targetScore = parseInt(targetScoreInput.value) || 5;
        updateScores();
        gameArea.style.display = 'block';
        document.querySelector('.settings').style.display = 'none';
        resetGameButton.style.display = 'inline-block';
        startNewRound();
    }

    function startNewRound() {
        roundResultMessage.textContent = "";
        lastDeclarationMessage.textContent = "Última declaración: -";
        cpuThoughtDisplay.textContent = "";
        createDeck();
        shuffleDeck();
        dealCards();
        
        currentPhase = 'DISCARD';
        currentPlayer = 1; // Player 1 always starts discard phase
        
        renderCards(); // Render P1 cards, P2 cards hidden
        updateTurnMessage();
        updateActionButtonVisibility();
    }

    function checkWinCondition() {
        if (player1Score >= targetScore) {
            roundResultMessage.textContent = `¡Jugador 1 GANA EL JUEGO con ${player1Score} puntos!`;
            gameOver();
            return true;
        }
        if (player2Score >= targetScore) {
            roundResultMessage.textContent = `¡Jugador 2 (CPU) GANA EL JUEGO con ${player2Score} puntos!`;
            gameOver();
            return true;
        }
        return false;
    }

    function gameOver() {
        currentPhase = 'GAME_OVER';
        updateActionButtonVisibility(); // Hide all action buttons
        currentTurnMessage.textContent = "Juego Terminado";
        // Optionally show player 2's final hand
        player2CardsDiv.innerHTML = '';
        player2Hand.forEach((card, index) => {
            player2CardsDiv.appendChild(createCardDiv(card, index, 2, true));
        });
    }
    
    function resetGameFull() {
        gameArea.style.display = 'none';
        document.querySelector('.settings').style.display = 'block';
        resetGameButton.style.display = 'none';
        startGameButton.disabled = false;

        // Clear displays
        score1Display.textContent = "0";
        score2Display.textContent = "0";
        player1CardsDiv.innerHTML = "";
        player2CardsDiv.innerHTML = "";
        currentTurnMessage.textContent = "Turno: -";
        lastDeclarationMessage.textContent = "Última declaración: -";
        roundResultMessage.textContent = "";
        cpuThoughtDisplay.textContent = "";
        deckCountDisplay.textContent = "52";
    }


    // --- Event Listeners ---
    startGameButton.addEventListener('click', () => {
        startGameButton.disabled = true;
        initGame();
    });
    resetGameButton.addEventListener('click', resetGameFull);

    discardButton.addEventListener('click', handleDiscard);
    keepHandButton.addEventListener('click', handleKeepHand);
    declareActionButton.addEventListener('click', handleDeclareAction);
    doubtActionButton.addEventListener('click', handleDoubtAction);
    improveActionButton.addEventListener('click', handleImproveAction);
    passActionButton.addEventListener('click', handlePassAction);

});