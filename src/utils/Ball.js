export class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
        this.vy = Math.random() * -2 - 1; // Initial upward velocity
        this.isGrabbed = false;
        this.grabOffset = { x: 0, y: 0 };
        this.history = []; // For trail effect (optional)
    }

    update(width, height, gravity = -0.05, friction = 0.99) {
        if (this.isGrabbed) return;

        // Apply gravity (antigravity if negative)
        this.vy += gravity;

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Apply friction/air resistance
        this.vx *= friction;
        this.vy *= friction;

        // Wall collisions
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -0.8; // Bounciness
        } else if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx *= -0.8;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -0.8;
        } else if (this.y + this.radius > height) {
            this.y = height - this.radius;
            this.vy *= -0.8;
        }

        // Add slight random drift
        this.vx += (Math.random() - 0.5) * 0.1;
    }

    draw(ctx) {
        ctx.beginPath();
        // Radial gradient for 3D/Glowing effect
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.1,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, '#ffffff'); // Highlight
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)'); // Edge

        ctx.fillStyle = this.color; // Fallback or base
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
        ctx.closePath();

        if (this.isGrabbed) {
            // Draw grabbing indicator
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Check if a point is inside the ball (with some margin)
    isHit(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius + 15; // Extra margin for easy grabbing
    }
}
