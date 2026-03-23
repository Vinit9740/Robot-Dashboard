import React from 'react';

const EmergencyStopButton = ({ robotId, sendCommand }) => {
    const handleStop = () => {
        if (!robotId) return;
        sendCommand(robotId, 'emergency_stop');
    };

    return (
        <button className="e-stop-btn" onClick={handleStop}>
            🛑 EMERGENCY STOP
            <style jsx>{`
                .e-stop-btn {
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 800;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
                }
                .e-stop-btn:hover {
                    background: #cc0000;
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(255, 68, 68, 0.6);
                }
                .e-stop-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
        </button>
    );
};

export default EmergencyStopButton;
