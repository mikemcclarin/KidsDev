// Player class
class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.jumping = false;
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                this.velocityX = -this.speed;
                break;
            case 'ArrowRight':
            case 'd':
                this.velocityX = this.speed;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ':
                if (!this.jumping) {
                    this.velocityY = -15;
                    this.jumping = true;
                }
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'ArrowRight':
            case 'd':
                this.velocityX = 0;
                break;
        }
    }

    update() {
        // Apply gravity
        this.velocityY += 0.8; // gravity
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Collision with ground (simple platform)
        if (this.y + this.height >= canvas.height - 30) {
            this.y = canvas.height - 30 - this.height;
            this.velocityY = 0;
            this.jumping = false;
        }

        // Boundary check
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }

    draw(ctx) {
        ctx.fillStyle = '#ff0000'; // Red player
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    respawn() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.jumping = false;
    }

    collidesWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}
