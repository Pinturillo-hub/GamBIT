/**
 * Chess Study - PWA Juego de Lógica
 * Vanilla JS - Sin dependencias externas
 */

// ==================== DEFINICIÓN DE PIEZAS ====================

const PIEZAS = [
    { nombre: 'Rey', simbolo: '♚' },
    { nombre: 'Dama', simbolo: '♛' },
    { nombre: 'Torre', simbolo: '♜' },
    { nombre: 'Alfil', simbolo: '♝' },
    { nombre: 'Caballo', simbolo: '♞' }
];

// ==================== ESTADO DEL JUEGO ====================

// Tablero 3x3: null = vacío, string = emoji de pieza
const board = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
];

let timeRemaining = 60;
let timerInterval = null;
let isClockRunning = false;
let isAnimating = false;

// ==================== GENERACIÓN DE TARJETAS ====================

/**
 * Genera una tarjeta aleatoria con 5 piezas en posiciones aleatorias.
 */
function generarTarjeta() {
    const posiciones = Array.from({ length: 9 }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = posiciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posiciones[i], posiciones[j]] = [posiciones[j], posiciones[i]];
    }

    // Vaciar tablero
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            board[r][c] = null;
        }
    }

    // Colocar las 5 piezas
    for (let i = 0; i < PIEZAS.length; i++) {
        const pos = posiciones[i];
        const fila = Math.floor(pos / 3);
        const col = pos % 3;
        board[fila][col] = PIEZAS[i].simbolo;
    }

    renderBoard();
}

// ==================== ELEMENTOS DOM ====================

const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const btnStart = document.getElementById('btn-start');
const boardEl = document.getElementById('board');
const cells = document.querySelectorAll('.cell');

const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');
const btnMirrorH = document.getElementById('btn-mirror-h');
const btnMirrorV = document.getElementById('btn-mirror-v');

const btnClock = document.getElementById('btn-clock');
const clockIcon = document.getElementById('clock-icon');
const clockText = document.getElementById('clock-text');
const btnNext = document.getElementById('btn-next');
const timeOverlay = document.getElementById('time-overlay');

// ==================== NAVEGACIÓN DE PANTALLAS ====================

function showGameScreen() {
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    generarTarjeta();
}

// ==================== RENDERIZADO DEL TABLERO ====================

function renderBoard() {
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        cell.textContent = board[row][col] || '';
    });
}

// ==================== ANIMACIÓN DEL TABLERO ====================

/**
 * Ejecuta una animación en el tablero y aplica la transformación al datos.
 * @param {string} animationClass - Clase CSS de animación
 * @param {Function} transformFn - Función que transforma el board
 */
function animateBoard(animationClass, transformFn) {
    if (isAnimating) return;

    isAnimating = true;
    setControlsDisabled(true);

    boardEl.classList.add('animating', animationClass);

    boardEl.addEventListener('animationend', function handler() {
        boardEl.removeEventListener('animationend', handler);

        transformFn();
        renderBoard();

        boardEl.classList.remove('animating', animationClass);

        isAnimating = false;
        setControlsDisabled(false);
    });
}

/**
 * Habilita/deshabilita controles durante animación
 */
function setControlsDisabled(disabled) {
    const allBtns = [btnRotateLeft, btnRotateRight, btnMirrorH, btnMirrorV, btnNext];
    allBtns.forEach(btn => btn.disabled = disabled);
}

// ==================== ROTACIÓN Y ESPEJO ====================

function rotateLeft() {
    animateBoard('rotate-left', () => {
        const temp = [
            [board[0][2], board[1][2], board[2][2]],
            [board[0][1], board[1][1], board[2][1]],
            [board[0][0], board[1][0], board[2][0]]
        ];
        copyBoard(temp);
    });
}

function rotateRight() {
    animateBoard('rotate-right', () => {
        const temp = [
            [board[2][0], board[1][0], board[0][0]],
            [board[2][1], board[1][1], board[0][1]],
            [board[2][2], board[1][2], board[0][2]]
        ];
        copyBoard(temp);
    });
}

function mirrorHorizontal() {
    animateBoard('flip-horizontal', () => {
        const temp = board.map(row => [...row].reverse());
        copyBoard(temp);
    });
}

function mirrorVertical() {
    animateBoard('flip-vertical', () => {
        const temp = board.map(row => [...row]).reverse();
        copyBoard(temp);
    });
}

function copyBoard(source) {
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            board[r][c] = source[r][c];
        }
    }
}

// ==================== CRONÓMETRO ====================

function toggleClock() {
    if (isClockRunning) {
        stopClock();
    } else {
        startClock();
    }
}

function startClock() {
    isClockRunning = true;
    timeRemaining = 60;

    timeOverlay.classList.add('hidden');
    clockIcon.classList.add('hidden');
    clockText.classList.remove('hidden');
    clockText.classList.remove('danger');
    updateClockDisplay();

    btnClock.classList.add('running');
    btnClock.classList.remove('time-out');

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateClockDisplay();

        if (timeRemaining <= 10) {
            clockText.classList.add('danger');
        }

        if (timeRemaining <= 0) {
            stopClock();
            btnClock.classList.remove('running');
            btnClock.classList.add('time-out');
            showTimeOverlay();
        }
    }, 1000);
}

function stopClock() {
    isClockRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
}

function showTimeOverlay() {
    timeOverlay.classList.remove('hidden');
    setTimeout(() => {
        timeOverlay.classList.add('hidden');
    }, 2000);
}

function updateClockDisplay() {
    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    clockText.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ==================== EVENT LISTENERS ====================

btnStart.addEventListener('click', showGameScreen);

btnRotateLeft.addEventListener('click', rotateLeft);
btnRotateRight.addEventListener('click', rotateRight);
btnMirrorH.addEventListener('click', mirrorHorizontal);
btnMirrorV.addEventListener('click', mirrorVertical);

btnClock.addEventListener('click', toggleClock);

btnNext.addEventListener('click', () => {
    generarTarjeta();
});

// ==================== SERVICE WORKER ====================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.log('Error SW:', err));
}
