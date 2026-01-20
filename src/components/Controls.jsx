import React from 'react';

const Controls = ({
    isRunning,
    onToggleCamera,
    onResetBalls,
    engineStatus
}) => {
    return (
        <div className="controls-overlay">
            <div className="control-panel">
                <h1>Antigravity</h1>

                <div className="status-indicator">
                    <div className={`status-dot ${engineStatus.camera ? 'active' : ''}`}></div>
                    Camera

                    <div className={`status-dot ${engineStatus.handDetected ? 'active' : ''}`} style={{ marginLeft: '10px' }}></div>
                    Hand

                    <div className={`status-dot ${engineStatus.isPinching ? 'pinched' : ''}`} style={{ marginLeft: '10px' }}></div>
                    Pinch
                </div>

                <button onClick={onToggleCamera}>
                    {isRunning ? 'Stop Camera' : 'Start Camera'}
                </button>

                <button onClick={onResetBalls}>
                    Reset Balls
                </button>

                <p className="instructions">
                    1. Allow camera access.<br />
                    2. Raise your hand.<br />
                    3. Pinch thumb & index to grab balls.<br />
                    4. Release to throw.
                </p>
            </div>
        </div>
    );
};

export default Controls;
