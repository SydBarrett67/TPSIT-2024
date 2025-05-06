const ROWS = 20;
const COLS = 10;
const BOX_SIZE = 40;
const boxes = [];
let isDown = true;
let currentBlock = [];
let fallInterval;
let fallSpeed = 500;
const lockedCells = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
let currentColor;
let score = 0;
let isGameOver = false;

const shapes = {
    I: [[1, 1, 1, 1]],
    O: [
    [1, 1],
    [1, 1]
    ],
    T: [
    [0, 1, 0],
    [1, 1, 1]
    ],
    L: [
    [1, 0],
    [1, 0],
    [1, 1]
    ],
    J: [
    [0, 1],
    [0, 1],
    [1, 1]
    ],
    S: [
    [0, 1, 1],
    [1, 1, 0]
    ],
    Z: [
    [1, 1, 0],
    [0, 1, 1]
    ]
};

const shapeNames = Object.keys(shapes);

let currentShapeMatrix = null;

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

function clearCurrentBlock() {
    currentBlock.forEach(({ x, y }) => {
        boxes[y][x].style.backgroundColor = "#0d47a1";
    });
}

function drawCurrentBlock() {
    currentBlock.forEach(({ x, y }) => {
        boxes[y][x].style.backgroundColor = currentColor;
    });
}

function moveBlock(dx, dy) {
    const newBlock = currentBlock.map(({ x, y }) => ({ x: x + dx, y: y + dy }));

    if (newBlock.every(({ x, y }) => y < ROWS && x >= 0 && x < COLS && !lockedCells[y][x])) {
        clearCurrentBlock();
        currentBlock = newBlock;
        drawCurrentBlock();
    }
}

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

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowLeft":
            moveBlock(-1, 0);
            break;
        case "ArrowRight":
            moveBlock(1, 0);
            break;
        case "ArrowDown":
            moveBlockDown();
            break;
        case "ArrowUp":
            rotateBlock();
            break;
    }
});

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
function clearFullLines() {
    let rowsToClear = [];

    for (let y = ROWS - 1; y >= 0; y--) {
        if (lockedCells[y].every(cell => cell)) {
            rowsToClear.push(y);
        }
    }

    if (rowsToClear.length === 0) return;

    rowsToClear.forEach(y => {
        for (let x = 0; x < COLS; x++) {
            boxes[y][x].style.backgroundColor = "white";
        }
    });


    setTimeout(() => {
        rowsToClear.forEach(y => {
            for (let x = 0; x < COLS; x++) {
                boxes[y][x].style.backgroundColor = "#0d47a1";
            }

            for (let moveY = y; moveY > 0; moveY--) {
                for (let x = 0; x < COLS; x++) {
                    lockedCells[moveY][x] = lockedCells[moveY - 1][x];
                    boxes[moveY][x].style.backgroundColor = boxes[moveY - 1][x].style.backgroundColor;
                }
            }

            for (let x = 0; x < COLS; x++) {
                lockedCells[0][x] = false;
                boxes[0][x].style.backgroundColor = "#0d47a1";
            }
        });
    }, 300); // Flash delay in milliseconds

    if (rowsToClear.length > 0) {
        score += rowsToClear.length * 100;
        document.getElementById("score_display").innerText = score;
    }
}

function generateBlock() {
    const randomShapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
    const randomShape = shapes[randomShapeName];
    currentBlock = [];

    currentShapeMatrix = randomShape;

    switch (randomShapeName) {
    case "I":
        currentColor = "red"; break;
    case "O":
        currentColor = "violet"; break;
    case "T":
        currentColor = "yellow"; break;
    case "L":
        currentColor = "white"; break;
    case "J":
        currentColor = "gold"; break;
    case "S":
        currentColor = "green"; break;
    case "Z":
        currentColor = "brown"; break;
    default:
        currentColor = "white";
    }

    const offsetX = Math.floor((COLS - randomShape[0].length) / 2);
    const offsetY = 0;

    for (let y = 0; y < randomShape.length; y++) {
        for (let x = 0; x < randomShape[y].length; x++) {
            if (randomShape[y][x] === 1) {
                const gridY = offsetY + y;
                const gridX = offsetX + x;
    
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

    currentBlock.forEach(({ x, y }) => {
        boxes[y][x].style.backgroundColor = "#0d47a1";
    });

    currentBlock = currentBlock.map(({ x, y }) => ({ x, y: y + 1 }));

    currentBlock.forEach(({ x, y }) => {
    boxes[y][x].style.backgroundColor = currentColor;
    });
}

function isOccupied(y, x) {
    if (y >= ROWS || x < 0 || x >= COLS) return true;
    return lockedCells[y][x];
}

function lockBlock() {
    currentBlock.forEach(({ x, y }) => {
        boxes[y][x].style.backgroundColor = currentColor;
        lockedCells[y][x] = true;
    });

    clearFullLines();
}

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