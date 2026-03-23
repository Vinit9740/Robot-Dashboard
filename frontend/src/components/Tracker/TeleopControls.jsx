import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TeleopControls = ({ robotId, sendCommand }) => {
    const { t } = useTranslation();
    const [linearSpeed, setLinearSpeed] = useState(0.5);
    const [angularSpeed, setAngularSpeed] = useState(1.0);
    const [activeKeys, setActiveKeys] = useState(new Set());

    const emitMove = useCallback((linear, angular) => {
        if (!robotId) return;
        // Round to 2 decimal places to minimize payload and avoid floating point noise
        const l = Math.round(linear * 100) / 100;
        const a = Math.round(angular * 100) / 100;
        sendCommand(robotId, 'teleop', { linear: l, angular: a });
    }, [robotId, sendCommand]);

    const [isMovingStatus, setIsMovingStatus] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setActiveKeys(prev => {
                    if (prev.has(key)) return prev;
                    return new Set(prev).add(key);
                });
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setActiveKeys(prev => {
                    if (!prev.has(key)) return prev;
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    const lastVelocityRef = useRef({ l: 0, a: 0 });

    useEffect(() => {
        let interval;
        if (activeKeys.size > 0 || isMovingStatus) {
            interval = setInterval(() => {
                let l = 0, a = 0;
                if (activeKeys.has('w')) l += linearSpeed;
                if (activeKeys.has('s')) l -= linearSpeed;
                if (activeKeys.has('a')) a += angularSpeed;
                if (activeKeys.has('d')) a -= angularSpeed;

                // Clamp to prevent unbounded accumulation 
                l = Math.max(-linearSpeed, Math.min(linearSpeed, l));
                a = Math.max(-angularSpeed, Math.min(angularSpeed, a));

                const roundedL = Math.round(l * 100) / 100;
                const roundedA = Math.round(a * 100) / 100;

                // Send continuously (10Hz) to satisfy robot watchdog timers
                emitMove(roundedL, roundedA);
                lastVelocityRef.current = { l: roundedL, a: roundedA };
                setIsMovingStatus(roundedL !== 0 || roundedA !== 0);
            }, 100); 
        }
        return () => clearInterval(interval);
    }, [activeKeys, linearSpeed, angularSpeed, emitMove, isMovingStatus]);

        const addKey = (k) => setActiveKeys(prev => {
            if (prev.has(k)) return prev;
            return new Set(prev).add(k);
        });
        const removeKey = (k) => setActiveKeys(prev => {
            if (!prev.has(k)) return prev;
            const next = new Set(prev);
            next.delete(k);
            return next;
        });

    return (
        <div className="teleop-controls glass-card">
            <h4>🎮 {t('manual_control')}</h4>
            
            <div className="speed-sliders">
                <div className="slider-group">
                    <label>Linear: {linearSpeed} m/s</label>
                    <input 
                        type="range" min="0" max="1.5" step="0.1" 
                        value={linearSpeed} 
                        onChange={(e) => setLinearSpeed(parseFloat(e.target.value))} 
                    />
                </div>
                <div className="slider-group">
                    <label>Angular: {angularSpeed} rad/s</label>
                    <input 
                        type="range" min="0" max="2.0" step="0.1" 
                        value={angularSpeed} 
                        onChange={(e) => setAngularSpeed(parseFloat(e.target.value))} 
                    />
                </div>
            </div>

            <div className="control-pad">
                <button className={`cmd-btn ${activeKeys.has('w') ? 'active' : ''}`} onMouseDown={() => addKey('w')} onMouseUp={() => removeKey('w')} onMouseLeave={() => removeKey('w')}>W</button>
                <div className="middle-row">
                    <button className={`cmd-btn ${activeKeys.has('a') ? 'active' : ''}`} onMouseDown={() => addKey('a')} onMouseUp={() => removeKey('a')} onMouseLeave={() => removeKey('a')}>A</button>
                    <button className="cmd-btn stop" onClick={() => emitMove(0, 0)}>STOP</button>
                    <button className={`cmd-btn ${activeKeys.has('d') ? 'active' : ''}`} onMouseDown={() => addKey('d')} onMouseUp={() => removeKey('d')} onMouseLeave={() => removeKey('d')}>D</button>
                </div>
                <button className={`cmd-btn ${activeKeys.has('s') ? 'active' : ''}`} onMouseDown={() => addKey('s')} onMouseUp={() => removeKey('s')} onMouseLeave={() => removeKey('s')}>S</button>
            </div>

            <style jsx>{`
                .teleop-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: 16px;
                }
                .speed-sliders {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .slider-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .slider-group label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .control-pad {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .middle-row {
                    display: flex;
                    gap: 8px;
                }
                .control-pad .cmd-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    font-weight: bold;
                    transition: all 0.2s;
                }
                .control-pad .cmd-btn.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                    box-shadow: 0 0 10px var(--primary-glow);
                }
                .control-pad .cmd-btn.stop {
                    background: #ff444422;
                    color: #ff4444;
                    border-color: #ff444444;
                }
                .control-pad .cmd-btn.stop:hover {
                    background: #ff4444;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default TeleopControls;
