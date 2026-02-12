// Level class and layouts
class Level {
    constructor(levelNum) {
        this.levelNum = levelNum;
        this.platforms = [];
        this.pits = [];
        this.spikes = [];
        this.goal = null;
        
        this.createLevel(levelNum);
        console.log('Level ' + levelNum + ' created with ' + this.platforms.length + ' platforms');
    }

    createLevel(levelNum) {
        // Level 1 - Simple intro
        if (levelNum === 1) {
            // Ground platform
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 });
            
            // Floating platforms
            this.platforms.push({ x: 80, y: 480, width: 120, height: 20 });
            this.platforms.push({ x: 280, y: 420, width: 120, height: 20 });
            this.platforms.push({ x: 480, y: 360, width: 120, height: 20 });
            this.platforms.push({ x: 680, y: 300, width: 100, height: 20 });
            
            // Pits (between platforms)
            this.pits.push({ x: 200, y: 530, width: 70, height: 40 });
            this.pits.push({ x: 400, y: 480, width: 70, height: 40 });
            this.pits.push({ x: 600, y: 420, width: 70, height: 40 });
            
            // Spikes
            this.spikes.push({ x: 320, y: 390, width: 50, height: 30 });
            this.spikes.push({ x: 520, y: 330, width: 50, height: 30 });
            
            // Goal
            this.goal = { x: 700, y: 260, width: 50, height: 40 };
        }
        // Level 2 - More challenging
        else if (levelNum === 2) {
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 });
            this.platforms.push({ x: 30, y: 500, width: 100, height: 20 });
            this.platforms.push({ x: 180, y: 450, width: 100, height: 20 });
            this.platforms.push({ x: 330, y: 400, width: 100, height: 20 });
            this.platforms.push({ x: 480, y: 350, width: 100, height: 20 });
            this.platforms.push({ x: 630, y: 300, width: 100, height: 20 });
            
            this.pits.push({ x: 130, y: 540, width: 50, height: 30 });
            this.pits.push({ x: 280, y: 490, width: 50, height: 30 });
            this.pits.push({ x: 430, y: 440, width: 50, height: 30 });
            this.pits.push({ x: 580, y: 390, width: 50, height: 30 });
            
            this.spikes.push({ x: 150, y: 420, width: 40, height: 30 });
            this.spikes.push({ x: 400, y: 370, width: 40, height: 30 });
            
            this.goal = { x: 700, y: 250, width: 50, height: 40 };
        }
        // Level 3+ - Progressive difficulty
        else {
            this.platforms.push({ x: 0, y: 570, width: 800, height: 30 });
            for (let i = 0; i < 6; i++) {
                this.platforms.push({
                    x: 40 + i * 120,
                    y: 500 - i * 60,
                    width: 100,
                    height: 20
                });
            }
            
            for (let i = 0; i < 5; i++) {
                this.pits.push({
                    x: 140 + i * 120,
                    y: 540 - i * 60,
                    width: 70,
                    height: 30
                });
            }
            
            this.goal = { x: 730, y: 50, width: 50, height: 40 };
        }
    }

    draw(ctx) {
        // Draw platforms (gray)
        ctx.fillStyle = '#888888';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let platform of this.platforms) {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Draw pits (black with red border)
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        for (let pit of this.pits) {
            ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
            ctx.strokeRect(pit.x, pit.y, pit.width, pit.height);
        }

        // Draw spikes (yellow)
        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        for (let spike of this.spikes) {
            ctx.fillRect(spike.x, spike.y, spike.width, spike.height);
            ctx.strokeRect(spike.x, spike.y, spike.width, spike.height);
        }

        // Draw goal (bright green)
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 3;
        if (this.goal) {
            ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
            ctx.strokeRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('EXIT', this.goal.x + 5, this.goal.y + 22);
        }
    }

    checkCollisions(player) {
        // Check platform collisions (landing on top)
        for (let platform of this.platforms) {
            if (player.collidesWith(platform)) {
                if (player.velocityY >= 0 && player.y + player.height - player.velocityY <= platform.y + 5) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.jumping = false;
                }
            }
        }

        // Check pit collisions (lose life)
        for (let pit of this.pits) {
            if (player.collidesWith(pit)) {
                playerLoseLife();
            }
        }

        // Check spike collisions (lose life)
        for (let spike of this.spikes) {
            if (player.collidesWith(spike)) {
                playerLoseLife();
            }
        }

        // Check goal collision (win)
        if (this.goal && player.collidesWith(this.goal)) {
            levelComplete();
        }
    }
}
