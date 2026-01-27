import React, { useState } from 'react';

const Controls = ({
    isRunning,
    onToggleCamera,
    onResetBalls,
    engineStatus,
    mode = 'gravity',
    onSetMode = () => { }
}) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className="controls-overlay">
            {!isVisible ? (
                <button
                    onClick={() => setIsVisible(true)}
                    style={{
                        pointerEvents: 'auto',
                        padding: '8px 16px',
                        fontSize: '0.9em',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: '#cbd5e1'
                    }}
                >
                    Show Controls
                </button>
            ) : (
                <div className="control-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1>Gesture AI</h1>
                        <button
                            onClick={() => setIsVisible(false)}
                            style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                fontSize: '1.2em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px'
                            }}
                            title="Hide Controls"
                        >
                            ✕
                        </button>
                    </div>

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
            )}
        </div>
    );
};

export default Controls;
