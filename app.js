/**
 * Chess Study - Logic Game PWA
 * Vanilla JS - Zero dependencies
 */

'use strict';

// ==================== CONFIGURATION ====================

const CONFIG = {
    PIECES: [
        { name: 'King', src: 'assets/images/rey.svg' },
        { name: 'Queen', src: 'assets/images/dama.svg' },
        { name: 'Rook', src: 'assets/images/torre.svg' },
        { name: 'Bishop', src: 'assets/images/alfil.svg' },
        { name: 'Knight', src: 'assets/images/caballo.svg' },
    ],
    BOARD_SIZE: 3,
    PIECE_COUNT: 5,
    TIMER_SECONDS: 59,
    DANGER_THRESHOLD: 10,
    OVERLAY_DURATION: 2000,
    ROTATION_STEP: 90,
    ANIMATION_DURATION: 300,
    ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    CLONE_EXIT_DURATION: 350,
};

// ==================== SOUND ====================

const Sound = (() => {
    const paths = {
        music:   'assets/sounds/music.mp3',
        clock:   'assets/sounds/clock.mp3',
        timeout: 'assets/sounds/timeout.mp3',
        flip:    'assets/sounds/flip.mp3',
        rotate:  'assets/sounds/rotate.mp3',
    };

    let musicEl = null;
    let musicTimer = null;

    function play(name) {
        const a = new Audio(paths[name]);
        a.volume = 1;
        a.play().catch(() => {});
    }

    function playMusic(vol) {
        if (!musicEl) {
            musicEl = new Audio(paths.music);
            musicEl.loop = true;
        }
        musicEl.volume = vol ?? 0.3;
        musicEl.currentTime = 0;
        musicEl.play().catch(() => {});
    }

    function setMusicVolume(vol) {
        if (musicEl) musicEl.volume = vol;
    }

    function stopMusic() {
        if (musicEl) {
            musicEl.pause();
            musicEl.currentTime = 0;
        }
    }

    function startWelcomeMusic() {
        musicTimer = setTimeout(() => playMusic(0.1), 3000);
    }

    function onGameStart() {
        clearTimeout(musicTimer);
        musicTimer = null;
        if (musicEl) {
            musicEl.volume = 0.3;
        } else {
            playMusic(0.3);
        }
    }

    let isMuted = false;
    let lastVolume = 0.3;

    function toggleMute() {
        isMuted = !isMuted;
        if (isMuted) {
            lastVolume = musicEl ? musicEl.volume : 0.3;
            stopMusic();
        } else {
            playMusic(lastVolume);
        }
        return isMuted;
    }

    return { play, playMusic, setMusicVolume, stopMusic, startWelcomeMusic, onGameStart, toggleMute };
})();

// ==================== STATE ====================

const state = {
    board: Array.from({ length: CONFIG.BOARD_SIZE }, () =>
        Array(CONFIG.BOARD_SIZE).fill(null)
    ),
    timeRemaining: CONFIG.TIMER_SECONDS,
    timerInterval: null,
    isClockRunning: false,
    isAnimating: false,
    boardRotation: 0,
    overlayTimeout: null,
};

// ==================== DOM REFERENCES ====================

const dom = {
    welcomeScreen: document.getElementById('welcome-screen'),
    gameScreen: document.getElementById('game-screen'),
    btnStart: document.getElementById('btn-start'),
    board: document.getElementById('board'),
    cells: document.querySelectorAll('.cell'),
    btnRotateLeft: document.getElementById('btn-rotate-left'),
    btnRotateRight: document.getElementById('btn-rotate-right'),
    btnMirrorH: document.getElementById('btn-mirror-h'),
    btnMirrorV: document.getElementById('btn-mirror-v'),
    btnClock: document.getElementById('btn-clock'),
    clockIcon: document.getElementById('clock-icon'),
    clockText: document.getElementById('clock-text'),
    btnNext: document.getElementById('btn-next'),
    btnMute: document.getElementById('btn-mute'),
    timeOverlay: document.getElementById('time-overlay'),
    controlButtons: null,
};

dom.controlButtons = [
    dom.btnRotateLeft,
    dom.btnRotateRight,
    dom.btnMirrorH,
    dom.btnMirrorV,
    dom.btnNext,
];

// ==================== BOARD ====================

function generateCard() {
    state.boardRotation = 0;
    dom.board.style.transition = 'none';
    dom.board.style.transform = '';

    const positions = Array.from({ length: CONFIG.BOARD_SIZE ** 2 }, (_, i) => i);

    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    state.board.forEach(row => row.fill(null));

    for (let i = 0; i < CONFIG.PIECE_COUNT; i++) {
        const pos = positions[i];
        const row = Math.floor(pos / CONFIG.BOARD_SIZE);
        const col = pos % CONFIG.BOARD_SIZE;
        state.board[row][col] = CONFIG.PIECES[i].src;
    }

    renderBoard();
}

function renderBoard() {
    dom.cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const pieceSrc = state.board[row][col];

        cell.innerHTML = '';

        if (pieceSrc) {
            const img = document.createElement('img');
            img.className = 'piece';
            img.src = pieceSrc;
            img.alt = CONFIG.PIECES.find(p => p.src === pieceSrc)?.name || '';
            img.draggable = false;

            if (state.boardRotation !== 0) {
                img.style.transform = `rotateZ(${-state.boardRotation}deg)`;
            }

            cell.appendChild(img);
        }
    });
}

function copyBoard(source) {
    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
            state.board[r][c] = source[r][c];
        }
    }
}

// ==================== BOARD ANIMATION ====================

function setControlsDisabled(disabled) {
    dom.controlButtons.forEach(btn => { btn.disabled = disabled; });
}

function animateRotation(targetAngle) {
    if (state.isAnimating) return;
    state.isAnimating = true;
    setControlsDisabled(true);

    state.boardRotation = targetAngle;

    const pieces = dom.board.querySelectorAll('.piece');
    const duration = `${CONFIG.ANIMATION_DURATION}ms`;
    const easing = CONFIG.ANIMATION_EASING;
    const transition = `transform ${duration} ${easing}`;

    pieces.forEach(p => {
        p.style.transition = transition;
        p.style.transform = `rotateZ(${-targetAngle}deg)`;
    });

    dom.board.style.transition = transition;
    dom.board.style.transform = `rotateZ(${targetAngle}deg)`;

    const handler = (e) => {
    if (e && e.target !== dom.board) return;
    dom.board.removeEventListener('transitionend', handler);
    clearTimeout(backupTimeout); // Limpiamos el salvavidas
    dom.board.style.transition = '';
    pieces.forEach(p => { p.style.transition = ''; });
    state.isAnimating = false;
    setControlsDisabled(false);
};
    dom.board.addEventListener('transitionend', handler);
// Salvavidas: Si en 350ms no ha terminado, forzamos el final
    const backupTimeout = setTimeout(handler, CONFIG.ANIMATION_DURATION + 50);
}

function animateFlip(inverseTransform, transformFn, counterClass) {
    if (state.isAnimating) return;
    state.isAnimating = true;
    setControlsDisabled(true);

    state.boardRotation = 0;

    transformFn();
    renderBoard();

    if (counterClass) {
        dom.board.classList.add(counterClass);
    }

    const transition = `transform ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.ANIMATION_EASING}`;

    dom.board.style.transition = 'none';
    dom.board.style.transform = inverseTransform;
    dom.board.offsetHeight;

    dom.board.style.transition = transition;
    dom.board.style.transform = '';

 const handler = (e) => {
        // Si hay evento (no es el timeout) y el objetivo no es el tablero, ignoramos
        if (e && e.target !== dom.board) return; 
        
        dom.board.removeEventListener('transitionend', handler);
        clearTimeout(backupTimeout); // Limpiamos el salvavidas
        
        dom.board.style.transition = '';
        if (counterClass) {
            dom.board.classList.remove(counterClass);
        }
        
        state.isAnimating = false;
        setControlsDisabled(false);
    };

    dom.board.addEventListener('transitionend', handler);
    // Salvavidas de 350ms (ANIMATION_DURATION + 50)
    const backupTimeout = setTimeout(handler, CONFIG.ANIMATION_DURATION + 50);
}

// ==================== ROTATION & MIRROR ====================

function rotateLeft() {
    Sound.play('rotate');
    animateRotation(state.boardRotation - CONFIG.ROTATION_STEP);
}

function rotateRight() {
    Sound.play('rotate');
    animateRotation(state.boardRotation + CONFIG.ROTATION_STEP);
}

function mirrorHorizontal() {
    Sound.play('flip');
    animateFlip('rotateY(180deg)', () => {
        const temp = state.board.map(row => [...row].reverse());
        copyBoard(temp);
    }, 'flip-h');
}

function mirrorVertical() {
    Sound.play('flip');
    animateFlip('rotateX(180deg)', () => {
        const temp = [...state.board].reverse().map(row => [...row]);
        copyBoard(temp);
    }, 'flip-v');
}

// ==================== TIMER ====================

function toggleClock() {
    Sound.play('clock');
    if (state.isClockRunning) {
        stopClock();
    } else {
        startClock();
    }
}

function startClock() {
    state.isClockRunning = true;
    state.timeRemaining = CONFIG.TIMER_SECONDS;

    dom.timeOverlay.classList.add('hidden');
    dom.clockIcon.classList.add('hidden');
    dom.clockText.classList.remove('hidden');
    dom.clockText.classList.remove('danger');
    updateClockDisplay();

    dom.btnClock.classList.add('running');
    dom.btnClock.classList.remove('time-out');

    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateClockDisplay();

        if (state.timeRemaining <= CONFIG.DANGER_THRESHOLD) {
            dom.clockText.classList.add('danger');
        }

        if (state.timeRemaining <= 0) {
            stopClock();
            Sound.play('timeout');
            dom.btnClock.classList.remove('running');
            dom.btnClock.classList.add('time-out');
            showTimeOverlay();
        }
    }, 1000);
}

function stopClock() {
    state.isClockRunning = false;
    clearInterval(state.timerInterval);
    state.timerInterval = null;
}

function updateClockDisplay() {
    dom.clockText.textContent = state.timeRemaining;
}

function showTimeOverlay() {
    clearTimeout(state.overlayTimeout);
    dom.timeOverlay.classList.remove('hidden');
    state.overlayTimeout = setTimeout(() => {
        dom.timeOverlay.classList.add('hidden');
    }, CONFIG.OVERLAY_DURATION);
}

// ==================== SCREEN NAVIGATION ====================

function showGameScreen() {
    Sound.play('flip');
    Sound.onGameStart();
    dom.welcomeScreen.classList.add('hidden');
    dom.gameScreen.classList.remove('hidden');
    generateCard();

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        const requestFS = el.requestFullscreen || el.webkitRequestFullscreen;
        if (requestFS) {
            requestFS.call(el).catch(() => {});
        }
    }
}

function handleNext() {
    if (state.isAnimating) return;
    Sound.play('flip');
    state.isAnimating = true;
    setControlsDisabled(true);

    const clone = dom.board.cloneNode(true);
    clone.classList.add('board-clone');
    clone.removeAttribute('id');
    clone.style.cssText = '';
    dom.board.parentElement.appendChild(clone);

    generateCard();

    clone.offsetHeight;
    clone.classList.add('exit-left');

const handler = (e) => {
        // Aquí comprobamos contra 'clone', no contra 'dom.board'
        if (e && e.target !== clone) return;
        
        clone.removeEventListener('transitionend', handler);
        clearTimeout(backupTimeout); // Limpiamos el salvavidas
        
        clone.remove();
        state.isAnimating = false;
        setControlsDisabled(false);
    };

    clone.addEventListener('transitionend', handler);
    // Salvavidas de 400ms (CLONE_EXIT_DURATION + 50)
    const backupTimeout = setTimeout(handler, CONFIG.CLONE_EXIT_DURATION + 50);
}

// ==================== EVENT BINDING ====================

function toggleMute() {
    const muted = Sound.toggleMute();
    dom.btnMute.classList.toggle('muted', muted);
}

function bindEvents() {
    dom.btnStart.addEventListener('click', showGameScreen);
    dom.btnRotateLeft.addEventListener('click', rotateLeft);
    dom.btnRotateRight.addEventListener('click', rotateRight);
    dom.btnMirrorH.addEventListener('click', mirrorHorizontal);
    dom.btnMirrorV.addEventListener('click', mirrorVertical);
    dom.btnClock.addEventListener('click', toggleClock);
    dom.btnNext.addEventListener('click', handleNext);
    dom.btnMute.addEventListener('click', toggleMute);
}

// ==================== SERVICE WORKER ====================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.error('SW error:', err));
    }
}

// ==================== INIT ====================

bindEvents();
registerServiceWorker();
Sound.startWelcomeMusic();
