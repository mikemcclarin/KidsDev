// Level class and layouts
class Level {
    constructor(levelNum) {
        this.levelNum = levelNum;
        this.platforms = [];
        this.pits = [];
        this.spikes = [];
        this.goal = null;
        
        this.createLevel(levelNum);
    }

    createLevel(levelNum) {
        // Level 1 - Simple intro
        if (levelNum === 1) {
            // Platforms
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 }); // Ground
            this.platforms.push({ x: 100, y: 480, width: 150, height: 20 }); // Platform 1
            this.platforms.push({ x: 350, y: 420, width: 150, height: 20 }); // Platform 2
            this.platforms.push({ x: 600, y: 360, width: 150, height: 20 }); // Platform 3
            
            // Pits
            this.pits.push({ x: 250, y: 520, width: 80, height: 50 });
            this.pits.push({ x: 500, y: 470, width: 80, height: 50 });
            
            // Spikes
            this.spikes.push({ x: 280, y: 390, width: 40, height: 30 });
            
            // Goal
            this.goal = { x: 700, y: 530, width: 50, height: 40 };
        }
        // Level 2 - More challenging
        else if (levelNum === 2) {
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 });
            this.platforms.push({ x: 50, y: 480, width: 120, height: 20 });
            this.platforms.push({ x: 250, y: 420, width: 120, height: 20 });
            this.platforms.push({ x: 450, y: 380, width: 120, height: 20 });
            this.platforms.push({ x: 650, y: 320, width: 120, height: 20 });
            
            this.pits.push({ x: 170, y: 520, width: 80, height: 50 });
            this.pits.push({ x: 370, y: 460, width: 80, height: 50 });
            this.pits.push({ x: 570, y: 400, width: 80, height: 50 });
            
            this.spikes.push({ x: 200, y: 450, width: 50, height: 30 });
            this.spikes.push({ x: 400, y: 350, width: 50, height: 30 });
            
            this.goal = { x: 680, y: 270, width: 50, height: 40 };
        }
        // Default - Level 3+
        else {
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 });
            for (let i = 0; i < 5; i++) {
                this.platforms.push({
                    x: 50 + i * 150,
                    y: 500 - i * 70,
                    width: 120,
                    height: 20
                });
            }
            
            for (let i = 0; i < 4; i++) {
                this.pits.push({
                    x: 170 + i * 150,
                    y: 530 - i * 70,
                    width: 70,
                    height: 40
                });
            }
            
            this.goal = { x: 730, y: 50, width: 50, height: 40 };
        }
    }

    draw(ctx) {
        // Draw platforms (gray)
        ctx.fillStyle = '#888888';
        for (let platform of this.platforms) {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Draw pits (black/dark)
        ctx.fillStyle = '#000000';
        for (let pit of this.pits) {
            ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
        }

        // Draw spikes (yellow)
        ctx.fillStyle = '#ffff00';
        for (let spike of this.spikes) {
            ctx.fillRect(spike.x, spike.y, spike.width, spike.height);
        }

        // Draw goal (green)
        ctx.fillStyle = '#00ff00';
        if (this.goal) {
            ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('EXIT', this.goal.x + 5, this.goal.y + 25);
        }
    }

    checkCollisions(player) {
        // Check platform collisions
        for (let platform of this.platforms) {
            if (player.collidesWith(platform)) {
                if (player.velocityY > 0) { // Falling onto platform
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.jumping = false;
                }
            }
        }

        // Check pit collisions
        for (let pit of this.pits) {
            if (player.collidesWith(pit)) {
                playerLoseLife();
            }
        }

        // Check spike collisions
        for (let spike of this.spikes) {
            if (player.collidesWith(spike)) {
                playerLoseLife();
            }
        }

        // Check goal collision
        if (this.goal && player.collidesWith(this.goal)) {
            levelComplete();
        }
    }
}
