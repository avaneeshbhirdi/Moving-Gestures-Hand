import React, { useState, useCallback } from 'react';
import HandTracker from './components/HandTracker';
import PhysicsCanvas from './components/PhysicsCanvas';
import DrawingCanvas from './components/DrawingCanvas';
import Controls from './components/Controls';
import './index.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [mode, setMode] = useState('gravity'); // 'gravity' | 'drawing'
  const [handData, setHandData] = useState({
    detected: false,
    x: 0,
    y: 0,
    isPinching: false
  });

  const handleHandUpdate = useCallback((data) => {
    setHandData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const toggleCamera = () => {
    setIsRunning(prev => !prev);
  };

  const resetBalls = () => {
    setResetKey(prev => prev + 1);
  };

  const engineStatus = {
    camera: isRunning,
    handDetected: handData.detected,
    isPinching: handData.isPinching
  };

  return (
    <div className="App">
      <Controls
        isRunning={isRunning}
        onToggleCamera={toggleCamera}
        onResetBalls={resetBalls}
        engineStatus={engineStatus}
        mode={mode}
        onSetMode={setMode}
      />

      {mode === 'gravity' ? (
        <PhysicsCanvas
          handData={handData}
          resetKey={resetKey}
        />
      ) : (
        <DrawingCanvas
          handData={handData}
        />
      )}

      <HandTracker
        isRunning={isRunning}
        onHandUpdate={handleHandUpdate}
      />
    </div>
  );
}

export default App;
