import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import './MissionPlanner.css';

/**
 * RouteEditor — canvas-based map renderer using react-konva.
 * 
 * Renders:
 * 1. Base map image
 * 2. Dashed route line
 * 3. Waypoint markers (numbered)
 * 4. Robot markers for all online robots
 * 
 * Props:
 *   activeMap      {Object|null} - map row from DB
 *   waypoints      {Array}       - [{x, y}] array of canvas coordinates
 *   onWaypointAdd  {Function}    - handler for adding waypoints
 *   isEditMode     {boolean}     - whether in drawing mode
 *   robotPoses     {Array}       - [{id, name, x, y, isMissionRobot, isSelected}]
 *   containerWidth {number}      - for responsive scaling
 */
const RouteEditor = ({ activeMap, waypoints = [], onWaypointAdd, isEditMode, robotPoses = [], containerWidth }) => {
    const [mapImg, imageStatus] = useImage(activeMap?.image_url || '', 'anonymous');
    const [stageSize, setStageSize] = useState({ width: 700, height: 450 });

    // For pulsar animation
    const pulsarRef = useRef(null);
    const [pulsarScale, setPulsarScale] = useState(1);

    useEffect(() => {
        if (!activeMap) return;
        const w = containerWidth || 700;

        if (mapImg?.naturalWidth) {
            const aspect = mapImg.naturalHeight / mapImg.naturalWidth;
            setStageSize({ width: w, height: Math.max(300, Math.round(w * aspect)) });
        } else if (activeMap.width && activeMap.height) {
            const aspect = activeMap.height / activeMap.width;
            setStageSize({ width: w, height: Math.max(300, Math.round(w * aspect)) });
        } else {
            setStageSize({ width: w, height: Math.round(w * 0.6) });
        }
    }, [mapImg, activeMap, containerWidth]);

    // Simple pulsar animation loop
    useEffect(() => {
        let frame;
        const animate = (time) => {
            const scale = 1 + Math.sin(time / 200) * 0.2;
            setPulsarScale(scale);
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleStageClick = (e) => {
        if (!isEditMode) return;
        if (e.target !== e.target.getStage() && e.target.attrs?.name === 'waypoint') return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        onWaypointAdd?.({ x: Math.round(pos.x), y: Math.round(pos.y) });
    };

    const linePoints = waypoints.flatMap(p => [p.x, p.y]);

    if (!activeMap) {
        return (
            <div className="mp-canvas-wrapper">
                <div className="mp-canvas-placeholder">
                    <span className="mp-placeholder-icon">🗺️</span>
                    <p>Upload a facility map to start planning routes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mp-canvas-wrapper" style={{ cursor: isEditMode ? 'crosshair' : 'default' }}>
            {imageStatus === 'loading' && (
                <div className="mp-canvas-loading">
                    <span className="mp-spinner" />
                    <span>Loading map…</span>
                </div>
            )}

            {imageStatus === 'failed' && (
                <div className="mp-canvas-placeholder">
                    <span className="mp-placeholder-icon">⚠️</span>
                    <p>Could not load map image. Check Supabase Storage permissions.</p>
                </div>
            )}

            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
                style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: imageStatus === 'loading' ? 'none' : 'block',
                }}
            >
                <Layer>
                    <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="#e8ecf1" />
                    {mapImg && <KonvaImage image={mapImg} x={0} y={0} width={stageSize.width} height={stageSize.height} />}
                </Layer>

                <Layer>
                    {/* Route */}
                    {linePoints.length >= 4 && (
                        <Line
                            points={linePoints}
                            stroke="#7d52f4"
                            strokeWidth={3}
                            dash={[10, 5]}
                            opacity={0.8}
                            tension={0.2}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* Waypoints */}
                    {waypoints.map((pt, idx) => (
                        <Group key={`wp-${idx}`} x={pt.x} y={pt.y} name="waypoint">
                            <Circle radius={12} fill="rgba(125,82,244,0.15)" stroke="#7d52f4" strokeWidth={1} />
                            <Circle radius={6} fill="#7d52f4" stroke="white" strokeWidth={1.5} shadowBlur={4} shadowColor="black" />
                            <Text
                                text={String(idx + 1)}
                                fontSize={9}
                                fill="white"
                                fontStyle="bold"
                                offsetX={idx < 9 ? 2.5 : 4.5}
                                offsetY={12}
                            />
                            {/* Waypoint Name Label */}
                            {pt.name && (
                                <Group y={-24} x={-20}>
                                    <Rect
                                        width={40}
                                        height={16}
                                        fill="rgba(0,0,0,0.6)"
                                        cornerRadius={4}
                                    />
                                    <Text
                                        text={pt.name}
                                        fontSize={10}
                                        fill="white"
                                        width={40}
                                        align="center"
                                        padding={3}
                                        fontStyle="bold"
                                    />
                                </Group>
                            )}
                        </Group>
                    ))}

                    {/* Robots */}
                    {robotPoses.map((pose) => (
                        <Group key={`robot-${pose.id}`} x={pose.x} y={pose.y}>
                            {/* Mission Pulsar */}
                            {pose.isMissionRobot && (
                                <Circle
                                    radius={20}
                                    fill="rgba(255, 68, 68, 0.2)"
                                    scaleX={pulsarScale}
                                    scaleY={pulsarScale}
                                />
                            )}

                            {/* Selection Halo */}
                            {pose.isSelected && (
                                <Circle
                                    radius={24}
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    dash={[4, 2]}
                                />
                            )}

                            {/* Robot Body & Direction Indicator */}
                            <Group rotation={(pose.theta || 0) * (180 / Math.PI)}>
                                <Circle
                                    radius={10}
                                    fill={pose.isMissionRobot ? "#ff4444" : "#7d52f4"}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    shadowBlur={10}
                                    shadowColor={pose.isMissionRobot ? "#ff4444" : "#7d52f4"}
                                />
                                {/* Heading Arrow */}
                                <Line
                                    points={[0, -5, 8, 0, 0, 5]}
                                    fill="white"
                                    closed={true}
                                    x={4}
                                />
                            </Group>

                            {/* Label */}
                            <Text
                                text={pose.name}
                                fontSize={10}
                                fill="#2c3e50"
                                fontStyle="bold"
                                align="center"
                                y={14}
                                x={-25}
                                width={50}
                            />
                        </Group>
                    ))}
                </Layer>
            </Stage>

            {isEditMode && imageStatus === 'loaded' && (
                <div className="mp-edit-hint">
                    Click to add waypoints
                </div>
            )}
        </div>
    );
};

export default RouteEditor;
