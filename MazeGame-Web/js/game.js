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
    player = new Player(50, 50);
    level = new Level(gameState.level);
    updateHUD();
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
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
    document.getElementById('level').textContent = `Level: ${gameState.level}`;
}

function playerLoseLife() {
    gameState.lives--;
    updateHUD();
    
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
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
}

function endGame() {
    gameState.gameOver = true;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function nextLevel() {
    gameState.level++;
    init();
    document.getElementById('levelCompleteScreen').classList.add('hidden');
}

// Start game
init();
gameLoop();
