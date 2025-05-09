// Costanti e variabili principali
const ROWS = 20;
const COLS = 10;
const BOX_SIZE = 40; // Dimensione di ogni cella in pixel
const boxes = []; // Matrice di elementi DOM che rappresentano la griglia
let isDown = true; // Flag per inizializzare il primo blocco
let currentBlock = []; // Blocchi attivi (coordinate)
let fallInterval; // Timer per la caduta automatica
let fallSpeed = 500; // Velocità di caduta in millisecondi
const lockedCells = Array.from({ length: ROWS }, () => Array(COLS).fill(false)); // Celle occupate
let currentColor; // Colore del blocco attivo
let score = 0; // Punteggio del giocatore
let isGameOver = false; // Stato del gioco

// Blocchi disponibili (Tetris)
const shapes = {
	I: [[1, 1, 1, 1]],
	O: [[1, 1], [1, 1]],
	T: [[0, 1, 0], [1, 1, 1]],
	L: [[1, 0], [1, 0], [1, 1]],
	J: [[0, 1], [0, 1], [1, 1]],
	S: [[0, 1, 1], [1, 1, 0]],
	Z: [[1, 1, 0], [0, 1, 1]]
};

const shapeNames = Object.keys(shapes); // Nomi delle forme
let currentShapeMatrix = null; // Matrice della forma corrente

// Ruota una matrice 2D in senso orario
function rotateMatrix(matrix) {
	const rows = matrix.length;
	const cols = matrix[0].length;
	const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			rotated[x][rows - 1 - y] = matrix[y][x];
		}
	}
	return rotated;
}

// Verifica se un blocco può essere posizionato nella griglia
function canPlaceBlock(matrix, offsetX, offsetY) {
	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < matrix[y].length; x++) {
			if (matrix[y][x] === 1) {
				const gridX = offsetX + x;
				const gridY = offsetY + y;
				if (
					gridX < 0 || gridX >= COLS ||
					gridY >= ROWS ||
					lockedCells[gridY]?.[gridX]
				) return false;
			}
		}
	}
	return true;
}

// Rimuove la visualizzazione del blocco corrente
function clearCurrentBlock() {
	currentBlock.forEach(({ x, y }) => {
		boxes[y][x].style.backgroundColor = "#0d47a1";
	});
}

// Ridisegna il blocco corrente nella sua posizione
function drawCurrentBlock() {
	currentBlock.forEach(({ x, y }) => {
		boxes[y][x].style.backgroundColor = currentColor;
	});
}

// Muove il blocco nella direzione indicata (dx, dy)
function moveBlock(dx, dy) {
	const newBlock = currentBlock.map(({ x, y }) => ({ x: x + dx, y: y + dy }));

	if (newBlock.every(({ x, y }) => y < ROWS && x >= 0 && x < COLS && !lockedCells[y][x])) {
		clearCurrentBlock();
		currentBlock = newBlock;
		drawCurrentBlock();
	}
}

// Ruota il blocco corrente, se possibile
function rotateBlock() {
	const rotatedMatrix = rotateMatrix(currentShapeMatrix);
	const topLeftX = Math.min(...currentBlock.map(b => b.x));
	const topLeftY = Math.min(...currentBlock.map(b => b.y));

	if (!canPlaceBlock(rotatedMatrix, topLeftX, topLeftY)) return;

	clearCurrentBlock();
	currentBlock = [];

	for (let y = 0; y < rotatedMatrix.length; y++) {
		for (let x = 0; x < rotatedMatrix[y].length; x++) {
			if (rotatedMatrix[y][x] === 1) {
				currentBlock.push({ x: topLeftX + x, y: topLeftY + y });
			}
		}
	}

	currentShapeMatrix = rotatedMatrix;
	drawCurrentBlock();
}

// Ascolta i tasti freccia per controllare il blocco
window.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "ArrowLeft": moveBlock(-1, 0); break;
		case "ArrowRight": moveBlock(1, 0); break;
		case "ArrowDown": moveBlockDown(); break;
		case "ArrowUp": rotateBlock(); break;
	}
});

// Crea la griglia iniziale e genera il primo blocco
function createGrid() {
	const board = document.getElementById("game_board");

	for (let j = 0; j < ROWS; j++) {
		boxes[j] = [];
		for (let i = 0; i < COLS; i++) {
			const box = document.createElement("div");
			box.className = "box";
			box.style.left = i * BOX_SIZE + "px";
			box.style.top = j * BOX_SIZE + "px";
			board.appendChild(box);
			boxes[j][i] = box;
		}
	}

	if (isDown) {
		generateBlock();
		isDown = false;
	}
}

// Cancella le righe piene e aggiorna il punteggio
function clearFullLines() {
    let rowsToClear = [];

    // Passo 1: Identifica tutte le righe piene
    for (let y = ROWS - 1; y >= 0; y--) {
        if (lockedCells[y].every(cell => cell)) {
            rowsToClear.push(y);
        }
    }

    if (rowsToClear.length === 0) return;

    // Passo 2: Effetto visivo prima di cancellare
    rowsToClear.forEach(y => {
        for (let x = 0; x < COLS; x++) {
            boxes[y][x].style.backgroundColor = "red";
        }
    });

    setTimeout(() => {
        // Passo 3: Cancella le righe piene
        rowsToClear.forEach(y => {
            for (let x = 0; x < COLS; x++) {
                lockedCells[y][x] = false;
                boxes[y][x].style.backgroundColor = "#0d47a1";
            }
        });

        // Passo 4: Sposta tutte le righe sopra le righe cancellate verso il basso
        for (let y = rowsToClear.length - 1; y >= 0; y--) { // Inizia dalla riga cancellata più in basso
            const rowToClear = rowsToClear[y];
            for (let moveY = rowToClear; moveY > 0; moveY--) {
                for (let x = 0; x < COLS; x++) {
                    lockedCells[moveY][x] = lockedCells[moveY - 1][x];
                    boxes[moveY][x].style.backgroundColor = boxes[moveY - 1][x].style.backgroundColor;
                }
            }
        }

        // Passo 5: Pulisci le righe più in alto dopo che sono state spostate verso il basso
        for (let y = 0; y < rowsToClear.length; y++) {
            for (let x = 0; x < COLS; x++) {
                lockedCells[0][x] = false;
                boxes[0][x].style.backgroundColor = "#0d47a1";
            }
        }
    }, 200);
}

// Genera un nuovo blocco casuale al centro della griglia
function generateBlock() {
	const randomShapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
	const randomShape = shapes[randomShapeName];
	currentBlock = [];
	currentShapeMatrix = randomShape;

	// Colore specifico per ogni forma
	switch (randomShapeName) {
		case "I": currentColor = "red"; break;
		case "O": currentColor = "violet"; break;
		case "T": currentColor = "yellow"; break;
		case "L": currentColor = "white"; break;
		case "J": currentColor = "gold"; break;
		case "S": currentColor = "green"; break;
		case "Z": currentColor = "brown"; break;
		default: currentColor = "white";
	}

	const offsetX = Math.floor((COLS - randomShape[0].length) / 2);
	const offsetY = 0;

	// Crea blocchi iniziali in alto al centro
	for (let y = 0; y < randomShape.length; y++) {
		for (let x = 0; x < randomShape[y].length; x++) {
			if (randomShape[y][x] === 1) {
				const gridY = offsetY + y;
				const gridX = offsetX + x;

				// Se la cella è già occupata, termina il gioco
				if (lockedCells[gridY]?.[gridX]) {
					clearInterval(fallInterval);
					isGameOver = true;
					alert("Game Over!\nFinal Score: " + score);
					return;
				}

				boxes[gridY][gridX].style.backgroundColor = currentColor;
				currentBlock.push({ x: gridX, y: gridY });
			}
		}
	}

	if (fallInterval) clearInterval(fallInterval);
	fallInterval = setInterval(moveBlockDown, fallSpeed);
}

// Sposta il blocco verso il basso automaticamente
function moveBlockDown() {
	if (isGameOver) return;

	const canMove = currentBlock.every(({ x, y }) => {
		const nextY = y + 1;
		return nextY < ROWS && !isOccupied(nextY, x);
	});

	if (!canMove) {
		lockBlock();
		generateBlock();
		return;
	}

	clearCurrentBlock();
	currentBlock = currentBlock.map(({ x, y }) => ({ x, y: y + 1 }));
	drawCurrentBlock();
}

// Controlla se una cella è occupata
function isOccupied(y, x) {
	if (y >= ROWS || x < 0 || x >= COLS) return true;
	return lockedCells[y][x];
}

// Blocca il blocco corrente nella griglia
function lockBlock() {
	currentBlock.forEach(({ x, y }) => {
		boxes[y][x].style.backgroundColor = currentColor;
		lockedCells[y][x] = true;
	});
	clearFullLines();
}

// Riavvia il gioco
document.getElementById("restart_btn").addEventListener("click", restartGame);

function restartGame() {
	clearInterval(fallInterval);
	score = 0;
	isGameOver = false;
	document.getElementById("score_display").innerText = "0";

	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < COLS; x++) {
			boxes[y][x].style.backgroundColor = "#0d47a1";
			lockedCells[y][x] = false;
		}
	}
	generateBlock();
}
