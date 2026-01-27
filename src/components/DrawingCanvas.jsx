import React, { useRef, useEffect, useState, useCallback } from 'react';

const DrawingCanvas = ({ handData }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    // Game State
    const shapesRef = useRef([]); // Array of completed shapes (arrays of points)
    const currentShapeRef = useRef([]); // Current shape being drawn (array of points)
    const lastPinchStateRef = useRef(false); // To detect pinch "click"

    // Hand smoothing
    const prevHandPosRef = useRef({ x: 0, y: 0 });

    // Handle Resize
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Save current content? Shapes are in ref, so we just redraw
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Main Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 50;

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 1. Process Hand Input
        let handX = 0, handY = 0;
        if (handData.detected) {
            handX = handData.x * width;
            handY = handData.y * height;
        }

        // Steady/Straight Line Logic (Axis Snapping)
        let effectiveX = handX;
        let effectiveY = handY;

        if (handData.detected && handData.isSteady && currentShapeRef.current.length > 0) {
            const lastPoint = currentShapeRef.current[currentShapeRef.current.length - 1];
            const dx = Math.abs(handX - lastPoint.x);
            const dy = Math.abs(handY - lastPoint.y);

            if (dx > dy) {
                effectiveY = lastPoint.y; // Snap to Horizontal
            } else {
                effectiveX = lastPoint.x; // Snap to Vertical
            }
        }

        // Update handX/Y variables for drawing logic usage
        // But we want to keep raw handX for cursor, and use effective for Shape
        // So let's use effective coordinates for logic below

        // Detect Pinch "Click" (Rising Edge)
        const isPinching = handData.detected && handData.isPinching;
        const pinchTriggered = isPinching && !lastPinchStateRef.current;
        lastPinchStateRef.current = isPinching;

        // 2. Logic
        const SNAP_DISTANCE = 30; // Pixels to snap to start point
        let isSnapRadius = false;

        if (handData.detected) {
            // Check for snapping to start of current shape to close it
            if (currentShapeRef.current.length > 2) {
                const startPoint = currentShapeRef.current[0];
                const dx = effectiveX - startPoint.x;
                const dy = effectiveY - startPoint.y;
                if (Math.sqrt(dx * dx + dy * dy) < SNAP_DISTANCE) {
                    isSnapRadius = true;
                }
            }

            if (pinchTriggered) {
                if (isSnapRadius) {
                    // Close the shape
                    shapesRef.current.push([...currentShapeRef.current]);
                    currentShapeRef.current = [];
                } else {
                    // Add point
                    currentShapeRef.current.push({ x: effectiveX, y: effectiveY });
                }
            }
        }

        // 3. Drawing
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Completed Shapes
        shapesRef.current.forEach((shape, index) => {
            if (shape.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(shape[0].x, shape[0].y);
            for (let i = 1; i < shape.length; i++) {
                ctx.lineTo(shape[i].x, shape[i].y);
            }
            ctx.closePath(); // Always close completed shapes
            ctx.strokeStyle = `hsl(${index * 60}, 100%, 60%)`;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = `hsl(${index * 60}, 100%, 60%, 0.2)`;
            ctx.fill();
        });

        // Draw Current Shape
        if (currentShapeRef.current.length > 0) {
            const points = currentShapeRef.current;

            // Draw established segments
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw points
            ctx.fillStyle = '#fff';
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw active line to hand if not pinching/just clicked
            if (handData.detected) {
                const lastPoint = points[points.length - 1];

                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);

                // Snap visual
                if (isSnapRadius) {
                    ctx.lineTo(points[0].x, points[0].y);
                    ctx.strokeStyle = '#00ff88'; // Green for closing
                    ctx.lineWidth = 4;
                } else {
                    ctx.lineTo(effectiveX, effectiveY);
                    ctx.strokeStyle = handData.isSteady ? '#00ccff' : 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                }

                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw Cursor/Hand Indicators
        if (handData.detected) {
            // Text Hint
            if (isSnapRadius) {
                ctx.fillStyle = '#00ff88';
                ctx.font = '16px Outfit';
                ctx.fillText('Pinch to Close', handX + 20, handY);

                ctx.beginPath();
                ctx.arc(currentShapeRef.current[0].x, currentShapeRef.current[0].y, 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#00ff88';
                ctx.stroke();
            } else if (currentShapeRef.current.length === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = '14px Outfit';
                ctx.fillText('Pinch to Start Shape', handX + 20, handY);
            }

            // Hand Cursor
            const indexTip = handData.landmarks ? handData.landmarks[8] : null;
            if (indexTip) {
                // Draw pinch connector if needed or just circle
            }

            ctx.strokeStyle = isPinching ? '#00ff88' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handX, handY, 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = isPinching ? '#00ff88' : '#ffffff';
            ctx.beginPath();
            ctx.arc(handX, handY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [handData]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
};

export default DrawingCanvas;
