import React from 'react';

const SensorDiagnostics = ({ sensors = [] }) => {
    // Default sensors if none provided
    const displaySensors = sensors.length > 0 ? sensors : [
        { name: 'LIDAR', status: 'OK' },
        { name: 'IMU', status: 'OK' },
        { name: 'Wheel Encoders', status: 'OK' },
        { name: 'Camera', status: 'OK' },
        { name: 'CPU', status: 'OK' },
        { name: 'Network', status: 'OK' }
    ];

    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case 'OK': return '#10b981';
            case 'WARNING': return '#f59e0b';
            case 'ERROR': return '#ef4444';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="sensor-diagnostics glass-card">
            <h4>🛠️ Sensor Diagnostics</h4>
            <div className="diag-list">
                {displaySensors.map((s, idx) => (
                    <div key={idx} className="diag-item">
                        <div className="diag-info">
                            <span className="dot" style={{ background: getStatusColor(s.status) }}></span>
                            <span className="label">{s.name}</span>
                        </div>
                        <span className="status-text" style={{ color: getStatusColor(s.status) }}>
                            {s.status}
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .sensor-diagnostics {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .diag-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .diag-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .diag-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .label {
                    font-size: 0.85rem;
                    color: var(--text-main);
                }
                .status-text {
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
};

export default SensorDiagnostics;
