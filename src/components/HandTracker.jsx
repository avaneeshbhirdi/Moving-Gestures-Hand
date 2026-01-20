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
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (handsRef.current && videoElement.readyState === 4) { // HAVE_ENOUGH_DATA
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
       if (cameraRef.current) {
           // Cleanup if needed
       }
        const video = videoRef.current;
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [isRunning]); // Re-run if isRunning changes

  const onResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Index finger tip (8) and Thumb tip (4)
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      // Calculate distance (simple Euclidean in normalized coordinates, assuming roughly square aspect ratio or corrected later)
      // Actually normalized coordinates: x, y are [0, 1].
      const dx = indexTip.x - thumbTip.x;
      const dy = indexTip.y - thumbTip.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Threshold for pinch (tune this) -> 0.05 is roughly 5% of screen width
      const isPinch = distance < 0.08; 

      // Center point of pinch
      const centerX = (indexTip.x + thumbTip.x) / 2;
      const centerY = (indexTip.y + thumbTip.y) / 2;

      onHandUpdate({
        detected: true,
        x: 1 - centerX, // Mirror horizontally for intuitive interaction
        y: centerY,
        isPinching: isPinch,
        rawDistance: distance,
        landmarks: landmarks // For drawing if needed
      });
    } else {
      onHandUpdate({ detected: false });
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
