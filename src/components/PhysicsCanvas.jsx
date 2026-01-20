import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball } from '../utils/Ball';

const COLORS = [
    '#FF0080', '#7928CA', '#FF4D4D', '#F5A623',
    '#0070F3', '#00DFD8', '#50E3C2', '#ABD2FA'
];

const PhysicsCanvas = ({ handData, resetKey }) => {
    const canvasRef = useRef(null);
    const ballsRef = useRef([]);
    const requestRef = useRef();
    const draggedBallIndexRef = useRef(-1);
    const prevHandPosRef = useRef({ x: 0, y: 0 });
    const handVelocityRef = useRef({ vx: 0, vy: 0 });

    // Initialize balls
    const initBalls = useCallback((width, height) => {
        const balls = [];
        const numBalls = 10;
        for (let i = 0; i < numBalls; i++) {
            const radius = 25 + Math.random() * 20;
            const x = Math.random() * (width - radius * 2) + radius;
            const y = Math.random() * (height - radius * 2) + radius;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            balls.push(new Ball(x, y, radius, color));
        }
        ballsRef.current = balls;
    }, []);

    // Resize handler
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (ballsRef.current.length === 0) {
                initBalls(canvas.width, canvas.height);
            }
        }
    }, [initBalls]);

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
        } else {
            // Release if holding
            if (draggedBallIndexRef.current !== -1) {
                const ball = ballsRef.current[draggedBallIndexRef.current];
                ball.isGrabbed = false;
                ball.vx = handVelocityRef.current.vx;
                ball.vy = handVelocityRef.current.vy;
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
        ballsRef.current.forEach(ball => {
            ball.update(width, height);
            ball.draw(ctx);
        });

        requestRef.current = requestAnimationFrame(animate);
    }, [handData]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
};

export default PhysicsCanvas;
