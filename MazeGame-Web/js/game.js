// Main game controller
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    level: 1,
    lives: 10,
    score: 0,
    gameOver: false,
    levelComplete: false
};

let player;
let level;

function init() {
    gameState = {
        level: 1,
        lives: 10,
        score: 0,
        gameOver: false,
        levelComplete: false
    };
    player = new Player(50, 550);
    level = new Level(gameState.level);
    updateHUD();
    console.log('Game initialized - Level ' + gameState.level);
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState.gameOver && !gameState.levelComplete) {
        player.update();
        player.draw(ctx);
        
        level.draw(ctx);
        level.checkCollisions(player);
    }

    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    if (livesEl) livesEl.textContent = `Lives: ${gameState.lives}`;
    if (levelEl) levelEl.textContent = `Level: ${gameState.level}`;
}

function playerLoseLife() {
    gameState.lives--;
    updateHUD();
    console.log('Lost life. Lives left: ' + gameState.lives);
    
    if (gameState.lives <= 0) {
        endGame();
    } else {
        player.respawn();
    }
}

function playerGainLife() {
    gameState.lives = Math.min(gameState.lives + 1, 10);
    updateHUD();
}

function levelComplete() {
    gameState.levelComplete = true;
    const screen = document.getElementById('levelCompleteScreen');
    if (screen) screen.classList.remove('hidden');
    console.log('Level complete!');
}

function endGame() {
    gameState.gameOver = true;
    const screen = document.getElementById('gameOverScreen');
    if (screen) screen.classList.remove('hidden');
    console.log('Game over!');
}

function nextLevel() {
    gameState.level++;
    init();
    const screen = document.getElementById('levelCompleteScreen');
    if (screen) screen.classList.add('hidden');
}

// Start game
console.log('Starting Maze Pitfalls...');
init();
gameLoop();
