import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../App';
import '../styles/TrackerTab.css';

const TrackerTab = ({ user }) => {
    const { robots } = useContext(AppContext);
    const [selectedRobot, setSelectedRobot] = useState(null);
    const [mapBounds, setMapBounds] = useState({ minX: -50, maxX: 50, minY: -50, maxY: 50 });

    // Calculate bounds based on all robot positions
    useEffect(() => {
        if (robots.length === 0) return;

        const positions = robots
            .filter(r => r.telemetry?.pose)
            .map(r => ({
                x: r.telemetry.pose.x,
                y: r.telemetry.pose.y,
            }));

        if (positions.length === 0) return;

        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const padding = 15;
        setMapBounds({
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding,
        });
    }, [robots]);

    const mapWidth = 800;
    const mapHeight = 500;

    // Convert world coordinates to SVG coordinates
    const worldToSvg = (worldX, worldY) => {
        const svgX = ((worldX - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * mapWidth;
        const svgY = mapHeight - ((worldY - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * mapHeight;
        return { svgX, svgY };
    };

    const getStatusColor = (status) => {
        return status === 'ONLINE' ? 'var(--primary)' : '#666';
    };

    const onlineRobots = robots.filter(r => r.status === 'ONLINE' && r.telemetry?.pose);

    return (
        <div className="tracker-tab-v2">
            <div className="tracker-container-v2">
                <div className="map-section-v2 glass-card">
                    <div className="map-visualization-v2">
                        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="tracker-map-v2">
                            <defs>
                                <radialGradient id="robotGlow" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </radialGradient>
                                <marker
                                    id="modern-arrow"
                                    viewBox="0 0 10 10"
                                    refX="5"
                                    refY="5"
                                    markerWidth="4"
                                    markerHeight="4"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
                                </marker>
                            </defs>

                            {/* Grid background */}
                            <g className="grid-v2">
                                {Array.from({ length: 21 }).map((_, i) => {
                                    const x = (i / 20) * mapWidth;
                                    return (
                                        <line
                                            key={`vline-${i}`}
                                            x1={x} y1="0" x2={x} y2={mapHeight}
                                            stroke="rgba(255,255,255,0.03)"
                                        />
                                    );
                                })}
                                {Array.from({ length: 11 }).map((_, i) => {
                                    const y = (i / 10) * mapHeight;
                                    return (
                                        <line
                                            key={`hline-${i}`}
                                            x1="0" y1={y} x2={mapWidth} y2={y}
                                            stroke="rgba(255,255,255,0.03)"
                                        />
                                    );
                                })}
                            </g>

                            {/* Robot Heading Arrows */}
                            {onlineRobots.map((robot) => {
                                const pos = worldToSvg(robot.telemetry.pose.x, robot.telemetry.pose.y);
                                const theta = (robot.telemetry.pose.theta || 0) * (180 / Math.PI);

                                return (
                                    <g key={`heading-${robot.id}`} transform={`translate(${pos.svgX}, ${pos.svgY}) rotate(${-theta})`}>
                                        <line x1="0" y1="0" x2="25" y2="0" stroke="var(--primary)" strokeWidth="2" opacity="0.6" markerEnd="url(#modern-arrow)" />
                                    </g>
                                );
                            })}

                            {/* Robot Markers */}
                            {onlineRobots.map((robot) => {
                                const pos = worldToSvg(robot.telemetry.pose.x, robot.telemetry.pose.y);
                                const isSelected = selectedRobot?.id === robot.id;

                                return (
                                    <g
                                        key={`robot-${robot.id}`}
                                        className={`robot-node ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedRobot(robot)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <circle cx={pos.svgX} cy={pos.svgY} r="25" fill="url(#robotGlow)" className="glow-circle" />
                                        <circle cx={pos.svgX} cy={pos.svgY} r="8" fill="var(--primary)" stroke="white" strokeWidth="2" />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    <div className="map-controls-v2">
                        <div className="legend-v2">
                            <div className="legend-item-v2"><span className="dot online"></span> Active Unit</div>
                            <div className="legend-item-v2"><span className="dot offline"></span> Static Unit</div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="fleet-status-sidebar glass-card">
                    <h3>Fleet Live Status</h3>
                    <div className="fleet-metrics-v2">
                        <div className="fleet-stat-v2">
                            <label>Online</label>
                            <span className="val online">{onlineRobots.length}</span>
                        </div>
                        <div className="fleet-stat-v2">
                            <label>Standby</label>
                            <span className="val">{robots.length - onlineRobots.length}</span>
                        </div>
                    </div>

                    <div className="live-robot-list-v2">
                        {robots.map((robot) => (
                            <div
                                key={robot.id}
                                className={`live-robot-card-v2 ${selectedRobot?.id === robot.id ? 'active' : ''}`}
                                onClick={() => setSelectedRobot(robot)}
                            >
                                <div className="live-top">
                                    <span className={`status-dot-v2 ${robot.status === 'ONLINE' ? 'online' : ''}`}></span>
                                    <span className="name">{robot.name}</span>
                                </div>
                                {robot.status === 'ONLINE' && (
                                    <div className="live-stats">
                                        <span>🔋 {robot.telemetry?.battery}%</span>
                                        <span>🌡️ {robot.telemetry?.temperature}°</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {selectedRobot && (
                <div className="telemetry-detail-pane glass-card">
                    <div className="pane-header">
                        <h4>System Diagnostics: {selectedRobot.name}</h4>
                        <button onClick={() => setSelectedRobot(null)}>✕</button>
                    </div>
                    <div className="diagnostics-grid">
                        <div className="diag-item">
                            <label>Current Coordinates</label>
                            <p>{selectedRobot.telemetry?.pose?.x?.toFixed(2)}m, {selectedRobot.telemetry?.pose?.y?.toFixed(2)}m</p>
                        </div>
                        <div className="diag-item">
                            <label>Azimuth (Heading)</label>
                            <p>{(selectedRobot.telemetry?.pose?.theta * 180 / Math.PI)?.toFixed(1)}°</p>
                        </div>
                        <div className="diag-item">
                            <label>Processor Load</label>
                            <div className="mini-progress"><div style={{ width: `${selectedRobot.telemetry?.cpu}%`, background: 'var(--accent)' }}></div></div>
                        </div>
                        <div className="diag-item">
                            <label>Thermal State</label>
                            <p>{selectedRobot.telemetry?.temperature}°C</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackerTab;
