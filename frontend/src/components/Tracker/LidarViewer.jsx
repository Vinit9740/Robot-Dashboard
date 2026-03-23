import React, { useRef, useEffect } from 'react';

const LidarViewer = ({ scanData }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background grid (Radar style)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(125, 82, 244, 0.1)';
        ctx.setLineDash([5, 5]);
        for (let i = 1; i <= 4; i++) {
            ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
        }
        ctx.setLineDash([]);

        // Draw axes
        ctx.strokeStyle = 'rgba(125, 82, 244, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();

        // Draw robot marker
        ctx.fillStyle = '#7d52f4';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        if (!scanData || !scanData.ranges) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Awaiting scan data...', centerX, centerY + 30);
            return;
        }

        // Draw scan points
        ctx.fillStyle = '#ff4444';
        const { angle_min, angle_increment, ranges } = scanData;

        ranges.forEach((range, i) => {
            if (range === null || isNaN(range) || range === Infinity) return;
            
            const angle = angle_min + (i * angle_increment);
            // Convert polar to cartesian
            // Note: ROS coordinate system has X forward, Y left. 
            // In canvas, we typically want forward (X) to be UP.
            const x = centerX + (range * 50) * Math.cos(angle - Math.PI/2);
            const y = centerY + (range * 50) * Math.sin(angle - Math.PI/2);

            // Only draw if within reasonable bounds
            if (Math.hypot(x - centerX, y - centerY) < radius) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

    }, [scanData]);

    return (
        <div className="lidar-viewer glass-card">
            <h4>📡 {t => 'LIDAR Scan'}</h4>
            <div className="canvas-container" style={{ background: '#0f172a', borderRadius: '12px', padding: '10px' }}>
                <canvas 
                    ref={canvasRef} 
                    width={260} 
                    height={260} 
                    style={{ width: '100%', height: 'auto' }}
                />
            </div>
            <style jsx>{`
                .lidar-viewer {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .lidar-viewer h4 {
                    margin: 0;
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default LidarViewer;
