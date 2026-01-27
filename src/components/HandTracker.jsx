import React, { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const HandTracker = ({ onHandUpdate, isRunning }) => {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('Initializing...');

  useEffect(() => {
    if (!isRunning) {
      if (cameraRef.current) {
        // cameraRef.current.stop(); // Camera utils doesn't always have a clean stop, but we can pause video
        const video = videoRef.current;
        if (video && video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          video.srcObject = null;
        }
      }
      setCameraStatus('Stopped');
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    setCameraStatus('Starting...');

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (handsRef.current && videoElement.readyState === 4) {
          await handsRef.current.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480
    });

    camera.start()
      .then(() => setCameraStatus('Running'))
      .catch(err => setCameraStatus(`Error: ${err.message}`));

    cameraRef.current = camera;

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
      const video = videoRef.current;
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isRunning]);

  const isHandOpen = (landmarks) => {
    // Simple heuristic: fingers extended
    // Tips: 8, 12, 16, 20. PIPs: 6, 10, 14, 18.
    // Check if Tips are above PIPs (y is smaller for higher) - assumes upright hand
    // Better: Check distance from wrist (0)

    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    // Check fingers 2-5
    const fingersOpen = tips.every((tipIdx, i) => {
      const pipIdx = pips[i];
      // Distance from wrist
      const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
      const dPip = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
      return dTip > dPip; // Extended
    });

    // Thumb (4) vs IP (3) or MCP (2)
    // Thumb is tricky depending on orientation, but let's check distance to wrist vs joint
    const dThumbTip = Math.hypot(landmarks[4].x - wrist.x, landmarks[4].y - wrist.y);
    const dThumbIp = Math.hypot(landmarks[3].x - wrist.x, landmarks[3].y - wrist.y);
    const thumbOpen = dThumbTip > dThumbIp;

    return fingersOpen && thumbOpen;
  };

  const onResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      let cursorLandmarks = results.multiHandLandmarks[0];
      let leftHandOpen = false;

      // Identify Hands
      if (results.multiHandedness) {
        results.multiHandedness.forEach((hand, index) => {
          if (hand.label === 'Right') {
            // MediaPipe "Right" hand is the user's Right hand (usually)
            // We use this for cursor
            cursorLandmarks = results.multiHandLandmarks[index];
          } else if (hand.label === 'Left') {
            // Check if Open
            if (isHandOpen(results.multiHandLandmarks[index])) {
              leftHandOpen = true;
            }
          }
        });
      }

      // Process Cursor Hand
      const landmarks = cursorLandmarks;
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const dx = indexTip.x - thumbTip.x;
      const dy = indexTip.y - thumbTip.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const isPinch = distance < 0.08;

      const centerX = (indexTip.x + thumbTip.x) / 2;
      const centerY = (indexTip.y + thumbTip.y) / 2;

      onHandUpdate({
        detected: true,
        x: 1 - centerX,
        y: centerY,
        isPinching: isPinch,
        rawDistance: distance,
        landmarks: landmarks,
        isSteady: leftHandOpen // Passing the flag
      });
    } else {
      onHandUpdate({ detected: false, isSteady: false });
    }
  };

  return (
    <div className="webcam-container" style={{ opacity: isRunning ? 1 : 0.5 }}>
      <video ref={videoRef} style={{ display: 'block' }} playsInline muted />
      <div style={{
        position: 'absolute',
        bottom: 5,
        left: 5,
        color: 'white',
        fontSize: '10px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '2px 4px',
        borderRadius: '4px'
      }}>
        {cameraStatus}
      </div>
    </div>
  );
};

export default HandTracker;
