import React from 'react';

const Controls = ({
    isRunning,
    onToggleCamera,
    onResetBalls,
    engineStatus,
    mode = 'gravity',
    onSetMode = () => { }
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
                    {mode === 'gravity' ? (
                        <>
                            3. Pinch thumb & index to grab balls.<br />
                            4. Release to throw.
                        </>
                    ) : (
                        <>
                            3. Pinch to place a point.<br />
                            4. Pinch start point to close shape.
                        </>
                    )}
                </p>

                <div className="mode-selector">
                    <span style={{ color: '#94a3b8', fontSize: '0.9em', fontWeight: '600' }}>MODE</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => onSetMode('gravity')}
                            style={{
                                backgroundColor: mode === 'gravity' ? '#646cff' : 'rgba(255,255,255,0.05)',
                                borderColor: mode === 'gravity' ? '#646cff' : 'rgba(255,255,255,0.1)',
                                flex: 1,
                                fontSize: '0.9em',
                                padding: '0.6em'
                            }}
                        >
                            Gravity
                        </button>
                        <button
                            onClick={() => onSetMode('drawing')}
                            style={{
                                backgroundColor: mode === 'drawing' ? '#646cff' : 'rgba(255,255,255,0.05)',
                                borderColor: mode === 'drawing' ? '#646cff' : 'rgba(255,255,255,0.1)',
                                flex: 1,
                                fontSize: '0.9em',
                                padding: '0.6em'
                            }}
                        >
                            Drawing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;
