import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball } from '../utils/Ball';

const PhysicsCanvas = ({ handData, resetKey, onSetMode }) => {
    const canvasRef = useRef(null);
    const ballsRef = useRef([]);
    const requestRef = useRef();
    const draggedBallIndexRef = useRef(-1);
    const prevHandPosRef = useRef({ x: 0, y: 0 });
    const handVelocityRef = useRef({ vx: 0, vy: 0 });
    const [allCleared, setAllCleared] = useState(false);

    // Initialize balls
    const initBalls = useCallback((width, height) => {
        const balls = [];
        const numBalls = 10;
        const types = ['basketball', 'volleyball', 'football', 'tennis', 'tabletennis'];

        for (let i = 0; i < numBalls; i++) {
            const radius = 30 + Math.random() * 15; // Slightly larger for detail
            const x = Math.random() * (width - radius * 2) + radius;
            const y = Math.random() * (height / 2); // Spawn in upper half
            const type = types[Math.floor(Math.random() * types.length)];
            balls.push(new Ball(x, y, radius, type));
        }
        ballsRef.current = balls;
        setAllCleared(false);
    }, []);

    // Resize handler
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (ballsRef.current.length === 0 && !allCleared) {
                initBalls(canvas.width, canvas.height);
            }
        }
    }, [initBalls, allCleared]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial setup
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Handle Reset
    useEffect(() => {
        if (canvasRef.current) {
            initBalls(canvasRef.current.width, canvasRef.current.height);
        }
    }, [resetKey, initBalls]);

    // Game Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Basket Dimensions
        const basketW = 140;
        const basketH = 120; // Longer net
        const basketX = width / 2 - basketW / 2;
        const basketY = height - basketH - 50;

        // 1. Draw Net (Back part)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Net vertical lines (narrowing down)
        const netBottomW = basketW * 0.4;
        const netBottomX = width / 2 - netBottomW / 2;

        for (let i = 0; i <= 6; i++) {
            const t = i / 6;
            const topX = basketX + t * basketW;
            const bottomX = netBottomX + t * netBottomW;
            ctx.moveTo(topX, basketY);
            ctx.lineTo(bottomX, basketY + basketH);
        }

        // Net horizontal hoop lines (curved downwards)
        for (let i = 1; i <= 4; i++) {
            const t = i / 5;
            const y = basketY + t * basketH;

            // Interpolate width at this height
            const currentW = basketW + (netBottomW - basketW) * t;
            const currentX = basketX + (netBottomX - basketX) * t;

            ctx.moveTo(currentX, y);
            // Simple curve approximation
            ctx.quadraticCurveTo(width / 2, y + 10, currentX + currentW, y);
        }
        ctx.stroke();


        // 2. Draw Rim (Back half)
        ctx.strokeStyle = '#d90429'; // Red
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(width / 2, basketY, basketW / 2, Math.PI, 0); // Top half (visually back)
        ctx.stroke();

        // Update hand velocity for throwing
        if (handData.detected) {
            const currentHandX = handData.x * width;
            const currentHandY = handData.y * height;

            handVelocityRef.current = {
                vx: (currentHandX - prevHandPosRef.current.x) * 0.5,
                vy: (currentHandY - prevHandPosRef.current.y) * 0.5
            };
            prevHandPosRef.current = { x: currentHandX, y: currentHandY };
        }

        // Interaction Logic
        const handX = handData.x * width;
        const handY = handData.y * height;

        if (handData.detected && handData.isPinching) {
            // Try to grab if not holding
            if (draggedBallIndexRef.current === -1) {
                let closestIndex = -1;
                let minDist = Infinity;

                ballsRef.current.forEach((ball, i) => {
                    if (ball.isHit(handX, handY)) {
                        const dx = ball.x - handX;
                        const dy = ball.y - handY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < minDist) {
                            minDist = dist;
                            closestIndex = i;
                        }
                    }
                });

                if (closestIndex !== -1) {
                    draggedBallIndexRef.current = closestIndex;
                    ballsRef.current[closestIndex].isGrabbed = true;
                }
            }

            // Update grabbed ball position
            if (draggedBallIndexRef.current !== -1) {
                const ball = ballsRef.current[draggedBallIndexRef.current];
                if (ball) {
                    const dx = handX - ball.x;
                    const dy = handY - ball.y;

                    // Spring-like effect for smoother grab
                    ball.x += dx * 0.2;
                    ball.y += dy * 0.2;
                    ball.vx = 0;
                    ball.vy = 0;

                    // Draw connector from hand to ball
                    ctx.beginPath();
                    ctx.moveTo(handX, handY);
                    ctx.lineTo(ball.x, ball.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        } else {
            // Release if holding
            if (draggedBallIndexRef.current !== -1) {
                const ball = ballsRef.current[draggedBallIndexRef.current];
                if (ball) {
                    ball.isGrabbed = false;
                    ball.vx = handVelocityRef.current.vx;
                    ball.vy = handVelocityRef.current.vy;
                }
                draggedBallIndexRef.current = -1;
            }

            // Hand cursor (open) - if landmarks not detecting or generic fallout
            if (handData.detected && !handData.landmarks) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(handX, handY, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Pinch Indicator (Line between thumb and index)
        if (handData.detected && handData.landmarks) {
            const indexTip = handData.landmarks[8];
            const thumbTip = handData.landmarks[4];

            // HandTracker mirrors X: (1 - x), so we must mirror landmarks too for consistency
            const ix = (1 - indexTip.x) * width;
            const iy = indexTip.y * height;
            const tx = (1 - thumbTip.x) * width;
            const ty = thumbTip.y * height;

            ctx.strokeStyle = handData.isPinching ? '#00ff88' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = handData.isPinching ? 4 : 2;

            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Draw points
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(ix, iy, 4, 0, Math.PI * 2);
            ctx.arc(tx, ty, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (handData.detected && handData.isPinching) {
            // Fallback pinch indicator if no landmarks (should not happen with HandTracker)
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(handX, handY, 15, 0, Math.PI * 2);
            ctx.stroke();
        }


        // Physics Update and Draw
        let ballsToRemove = [];
        ballsRef.current.forEach((ball, index) => {
            ball.update(width, height);
            ball.draw(ctx);

            // Check basket collision
            // Basket entry: simply center of ball is within the top opening rect of basket
            // Opening is at basketY, from basketX to basketX + basketW
            const distToBasketCenter = Math.abs(ball.x - (width / 2));
            const inBasketWidth = distToBasketCenter < (basketW / 2);
            const inBasketHeight = Math.abs(ball.y - (basketY + 20)) < 30; // Check near the rim

            // Or if it falls "inside"
            if (ball.y > basketY + 10 && inBasketWidth && !ball.isGrabbed) {
                // Shrink or suck in effect could go here, for now just remove
                ballsToRemove.push(index);
            }
        });

        // Remove balls
        if (ballsToRemove.length > 0) {
            ballsRef.current = ballsRef.current.filter((_, i) => !ballsToRemove.includes(i));
            if (draggedBallIndexRef.current !== -1) {
                // Reset drag if the dragged ball disappeared (unlikely but safe)
                draggedBallIndexRef.current = -1;
            }
        }

        // Check clear condition
        if (ballsRef.current.length === 0 && !allCleared) {
            // We need to trigger this outside render loop ideally, but setting state here checks diff
            setAllCleared(true);
        }

        // Draw Basket (Front Rim) to create depth
        ctx.strokeStyle = '#d90429'; // Red
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(width / 2, basketY, basketW / 2, 12, 0, 0, Math.PI * 2);
        ctx.stroke();


        requestRef.current = requestAnimationFrame(animate);
    }, [handData, allCleared]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    const handleGenerateMore = () => {
        if (canvasRef.current) {
            initBalls(canvasRef.current.width, canvasRef.current.height);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />

            {allCleared && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'auto'
                }}>
                    <h2 style={{
                        fontSize: '3em',
                        marginBottom: '20px',
                        background: 'linear-gradient(to right, #00ff88, #00DFD8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 30px rgba(0,255,136,0.3)'
                    }}>
                        All Clear!
                    </h2>
                    <button
                        onClick={handleGenerateMore}
                        style={{
                            padding: '1em 2em',
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            borderRadius: '50px',
                            border: 'none',
                            background: 'white',
                            color: '#0f172a',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Generate More
                    </button>

                    <button
                        onClick={() => onSetMode('drawing')}
                        style={{
                            padding: '1em 2em',
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            borderRadius: '50px',
                            border: '2px solid rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.borderColor = 'white';
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        Start Drawing
                    </button>
                </div>
            )}
        </div>
    );
};

export default PhysicsCanvas;
