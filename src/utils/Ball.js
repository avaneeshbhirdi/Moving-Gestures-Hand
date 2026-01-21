export class Ball {
    constructor(x, y, radius, type = 'basketball') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
        this.vy = Math.random() * -2 - 1; // Initial upward velocity
        this.isGrabbed = false;
        this.grabOffset = { x: 0, y: 0 };
        this.history = []; // For trail effect (optional)
        this.rotation = Math.random() * Math.PI * 2;
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

        // Rotate based on movement (visual only)
        this.rotation += this.vx * 0.05;

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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.clip(); // Mask everything to circle

        if (this.type === 'basketball') {
            // Base
            ctx.fillStyle = '#FF8C00'; // Dark Orange
            ctx.fill();

            // Texture/Shading
            const grad = ctx.createRadialGradient(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.5, 0, 0, this.radius);
            grad.addColorStop(0, 'rgba(255, 165, 0, 0)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Lines
            ctx.strokeStyle = '#2d1e12';
            ctx.lineWidth = 2.5;

            // Horizontal curve
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.bezierCurveTo(-this.radius / 2, this.radius / 2, this.radius / 2, this.radius / 2, this.radius, 0);
            ctx.stroke();

            // Vertical curve (perpendicular)
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.bezierCurveTo(this.radius / 2, -this.radius / 2, this.radius / 2, this.radius / 2, 0, this.radius);
            ctx.stroke();

            // Side curves
            ctx.beginPath();
            ctx.arc(-this.radius * 0.7, -this.radius * 0.7, this.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();

        } else if (this.type === 'volleyball') {
            // Base White
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ddd';

            // 3 Sections pattern
            // Yellow
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2 / 3);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();

            // Blue
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, Math.PI * 2 / 3, Math.PI * 4 / 3);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();

            // White (already filled base, just fill segment to be sure)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, Math.PI * 4 / 3, Math.PI * 2);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();

            // Shading
            const grad = ctx.createRadialGradient(-this.radius * 0.3, -this.radius * 0.3, 0, 0, 0, this.radius);
            grad.addColorStop(0, 'rgba(255,255,255,0.2)');
            grad.addColorStop(1, 'rgba(0,0,0,0.1)');
            ctx.fillStyle = grad;
            ctx.fill();

        } else if (this.type === 'football') {
            // Base White
            ctx.fillStyle = '#f0f0f0';
            ctx.fill();

            // Pentagons (Black)
            ctx.fillStyle = '#1a1a1a';
            const drawPoly = (x, y, r, sides) => {
                ctx.beginPath();
                for (let i = 0; i < sides; i++) {
                    ctx.lineTo(x + r * Math.cos(2 * Math.PI * i / sides), y + r * Math.sin(2 * Math.PI * i / sides));
                }
                ctx.fill();
            }

            // Central pentagon
            drawPoly(0, 0, this.radius * 0.25, 5);

            // Surrounding parts (approximated)
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5;
                drawPoly(Math.cos(angle) * this.radius * 0.65, Math.sin(angle) * this.radius * 0.65, this.radius * 0.2, 5);
            }

            // Shading
            const grad = ctx.createRadialGradient(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.2, 0, 0, this.radius);
            grad.addColorStop(0, 'rgba(255,255,255,0.1)');
            grad.addColorStop(1, 'rgba(0,0,0,0.15)');
            ctx.fillStyle = grad;
            ctx.fill();
        } else if (this.type === 'tennis') {
            // Neon Green
            const tennisGreen = '#ccff00';
            ctx.fillStyle = tennisGreen;
            ctx.fill();

            // Texture
            const grad = ctx.createRadialGradient(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.5, 0, 0, this.radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = grad;
            ctx.fill();

            // White curve pattern
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.bezierCurveTo(-this.radius / 2, this.radius / 1.5, this.radius / 2, this.radius / 1.5, this.radius, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.bezierCurveTo(-this.radius / 2, -this.radius / 1.5, this.radius / 2, -this.radius / 1.5, this.radius, 0);
            ctx.stroke();

        } else if (this.type === 'tabletennis') {
            // Matte Orange
            ctx.fillStyle = '#ff9933';
            ctx.fill();

            // Simple shading
            const grad = ctx.createRadialGradient(-this.radius * 0.3, -this.radius * 0.4, 0, 0, 0, this.radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
            ctx.fillStyle = grad;
            ctx.fill();

        } else {
            // Fallback
            ctx.fillStyle = this.type; // Treat type as color
            ctx.fill();
        }

        ctx.restore();

        if (this.isGrabbed) {
            // Draw grabbing indicator
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
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
