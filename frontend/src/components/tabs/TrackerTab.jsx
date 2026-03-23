import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../App';
import { getMaps } from '../../services/mapService';
import { getRoutesByMap } from '../../services/routeService';
import MapUpload from '../Tracker/MapUpload';
import RouteEditor from '../Tracker/RouteEditor';
import MissionControls from '../Tracker/MissionControls';
import TeleopControls from '../Tracker/TeleopControls';
import LidarViewer from '../Tracker/LidarViewer';
import CameraFeed from '../Tracker/CameraFeed';
import SensorDiagnostics from '../Tracker/SensorDiagnostics';
import EmergencyStopButton from '../Tracker/EmergencyStopButton';
import '../styles/TrackerTab.css';
import '../Tracker/MissionPlanner.css';

const TrackerTab = ({ user }) => {
    const { t } = useTranslation();
    const { robots, sendCommand, selectedRobotId, setSelectedRobotId, showNotification } = useContext(AppContext);

    // ── Existing telemetry state ──────────────────────────────────────
    const [selectedRobot, setSelectedRobotLocal] = useState(null);
    const [mapBounds, setMapBounds] = useState({ minX: -50, maxX: 50, minY: -50, maxY: 50 });

    // ── Mission planning state ────────────────────────────────────────
    const [maps, setMaps] = useState([]);
    const [activeMap, setActiveMap] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeMission, setActiveMission] = useState(null);
    // Live robot poses on the canvas (pixel coords mapped from telemetry)
    const [robotsOnCanvas, setRobotsOnCanvas] = useState([]);
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [missionPlannerCollapsed, setMissionPlannerCollapsed] = useState(false);
    const canvasWrapperRef = useRef(null);
    const [canvasWidth, setCanvasWidth] = useState(700);
    const [isAutonomous, setIsAutonomous] = useState(false);
    const [advancedPanelOpen, setAdvancedPanelOpen] = useState(true);

    // Derive org_id from first robot or from the JWT user payload
    const orgId = user?.app_metadata?.org_id || robots[0]?.org_id || null;
    const isAdmin = user?.app_metadata?.role === 'admin';

    // ── Existing: sync global robot selection ─────────────────────────
    useEffect(() => {
        if (selectedRobotId) {
            const robot = robots.find(r => r.id === selectedRobotId);
            if (robot) setSelectedRobotLocal(robot);
        }
    }, [selectedRobotId, robots]);

    const setSelectedRobot = (robot) => {
        setSelectedRobotLocal(robot);
        setSelectedRobotId(robot ? robot.id : null);
    };

    // ── Existing: auto-calculate SVG bounds from telemetry ───────────
    useEffect(() => {
        if (robots.length === 0) return;
        const positions = robots.filter(r => r.telemetry?.pose).map(r => ({ x: r.telemetry.pose.x, y: r.telemetry.pose.y }));
        if (positions.length === 0) return;
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        const padding = 20;
        setMapBounds({ minX: Math.min(...xs) - padding, maxX: Math.max(...xs) + padding, minY: Math.min(...ys) - padding, maxY: Math.max(...ys) + padding });
    }, [robots]);

    const mapWidth = 800;
    const mapHeight = 500;

    const worldToSvg = (worldX, worldY) => ({
        svgX: ((worldX - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * mapWidth,
        svgY: mapHeight - ((worldY - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * mapHeight,
    });

    // ── Mission planning: load maps on mount ─────────────────────────
    useEffect(() => {
        if (!orgId) return;
        getMaps(orgId).then(setMaps).catch(err => console.warn('Could not load maps:', err.message));
    }, [orgId]);

    // ── Live robots → canvas-pose conversion (when a map is active) ───
    useEffect(() => {
        if (!activeMap) {
            setRobotsOnCanvas([]);
            return;
        }

        const mapAspectRatio = activeMap.height / activeMap.width;
        const canvasHeight = canvasWidth * mapAspectRatio;

        // Map telemetry world coords proportionally onto canvas pixels.
        // World: [-50, 50] -> Canvas [0, canvasWidth]
        const poses = robots
            .filter(r => r.status === 'ONLINE' && r.telemetry?.pose)
            .map(r => {
                const { x: wx, y: wy } = r.telemetry.pose;
                const cx = ((wx + 50) / 100) * canvasWidth;
                const cy = ((50 - wy) / 100) * canvasHeight;

                return {
                    id: r.id,
                    name: r.name,
                    x: cx,
                    y: cy,
                    isMissionRobot: activeMission?.robot_id === r.id,
                    isSelected: selectedRobotId === r.id
                };
            });

        setRobotsOnCanvas(poses);

        // If a mission is active, ensure we "follow" its robot if it's not already selected
        if (activeMission && !selectedRobotId) {
            setSelectedRobotId(activeMission.robot_id);
        }
    }, [robots, activeMap, canvasWidth, activeMission, selectedRobotId]);

    // ── Measure canvas container for responsive Stage sizing ─────────
    useEffect(() => {
        if (!canvasWrapperRef.current) return;
        const observer = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect?.width;
            if (w) setCanvasWidth(w);
        });
        observer.observe(canvasWrapperRef.current);
        return () => observer.disconnect();
    }, []);

    // ── Load routes when active map changes ───────────────────────────
    useEffect(() => {
        if (!activeMap) { setSavedRoutes([]); return; }
        getRoutesByMap(activeMap.id).then(setSavedRoutes).catch(() => { });
    }, [activeMap]);

    const handleMapUploaded = (map) => {
        setMaps(prev => [map, ...prev]);
        setActiveMap(map);
        setWaypoints([]);
        setIsEditMode(true);
        showNotification(`Map "${map.name}" uploaded!`, 'success');
    };

    const handleWaypointAdd = useCallback((pt) => {
        setWaypoints(prev => {
            const nextIdx = prev.length + 1;
            const name = `P${nextIdx}`;
            return [...prev, { ...pt, name }];
        });
    }, []);

    const handleRouteSelect = (routeId) => {
        if (!routeId) {
            setWaypoints([]);
            return;
        }
        const route = savedRoutes.find(r => r.id === routeId);
        if (route && route.path_json) {
            // Path JSON might be world coords or canvas coords. 
            // The service returns path_json as saved.
            // If it's world coords, we need to convert back to canvas coords for RouteEditor.
            // Let's assume path_json stores the raw points saved.
            const canvasPoints = route.path_json.map(pt => {
                // Calculate canvas height based on aspect ratio
                const mapAspectRatio = activeMap ? activeMap.height / activeMap.width : 0.6;
                const canvasHeight = canvasWidth * mapAspectRatio;

                const cx = ((pt.x + 50) / 100) * canvasWidth;
                const cy = ((50 - pt.y) / 100) * canvasHeight;
                return { x: cx, y: cy, name: pt.name || `P${waypoints.length + 1}` };
            });
            setWaypoints(canvasPoints);
            showNotification(`Loaded route: ${route.name}`, 'info');
        }
    };

    // Refresh saved routes list (called after save or delete)
    const refreshRoutes = useCallback(() => {
        if (!activeMap) return;
        getRoutesByMap(activeMap.id).then(setSavedRoutes).catch(() => { });
    }, [activeMap]);

    // Robots with pose data — shown on SVG map
    const onlineRobots = robots.filter(r => r.status === 'ONLINE' && r.telemetry?.pose);
    // All ONLINE robots — used for the sidebar stats counter
    const onlineCount = robots.filter(r => r.status === 'ONLINE').length;

    // Convert pixel waypoints to world coordinates for the robot
    const worldWaypoints = waypoints.map(pt => {
        const cx = pt.x;
        const cy = pt.y;

        // Calculate canvas height based on aspect ratio
        const mapAspectRatio = activeMap ? activeMap.height / activeMap.width : 0.6;
        const canvasHeight = canvasWidth * mapAspectRatio;

        const wx = (cx / canvasWidth) * 100 - 50;
        const wy = 50 - (cy / canvasHeight) * 100;
        return { x: wx, y: wy, name: pt.name };
    });

    return (
        <div className="tracker-tab-v2">
            <div className="tracker-layout-v2">
                {/* ── Mission Planner Main Area ─────────────────────────── */}
                <div className="mp-mission-section">
                    {/* Section header / toggle */}
                    <div className="mp-section-header glass-card">
                        <div className="mp-section-title">
                            <span>🧭</span>
                            <strong>{t('mission_planner')}</strong>
                            {activeMap && <span className="mp-active-map-tag">{activeMap.name}</span>}
                        </div>
                        <div className="mp-section-header-actions">
                            {/* Map selector (from previously uploaded maps) */}
                            {maps.length > 0 && (
                                <select
                                    className="mp-select mp-select-sm"
                                    value={activeMap?.id || ''}
                                    onChange={e => {
                                        const m = maps.find(m => m.id === e.target.value);
                                        setActiveMap(m || null);
                                        setWaypoints([]);
                                        setIsEditMode(false);
                                    }}
                                >
                                    <option value="">— {t('select_map')} —</option>
                                    {maps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            )}
                            {/* Upload new map */}
                            {orgId && <MapUpload orgId={orgId} onMapUploaded={handleMapUploaded} />}
                            {/* Edit mode toggle */}
                            {activeMap && (
                                <button
                                    className={`mp-edit-toggle ${isEditMode ? 'active' : ''}`}
                                    onClick={() => setIsEditMode(v => !v)}
                                    disabled={!!activeMission}
                                >
                                    ✏️ {isEditMode ? t('drawing') : t('edit_route')}
                                    {waypoints.length > 0 && (
                                        <span className="mp-waypoint-count">({waypoints.length} pts)</span>
                                    )}
                                </button>
                            )}
                            {/* Clear waypoints */}
                            {waypoints.length > 0 && !activeMission && (
                                <button
                                    className="mp-btn mp-btn-clear"
                                    style={{ height: 32, fontSize: '0.75rem', padding: '0 10px' }}
                                    onClick={() => setWaypoints([])}
                                    title={t('remove_all_waypoints')}
                                >
                                    ✕ {t('clear')}
                                </button>
                            )}
                            <button
                                className="mp-edit-toggle"
                                onClick={() => setMissionPlannerCollapsed(v => !v)}
                                title={missionPlannerCollapsed ? 'Expand planner' : 'Collapse planner'}
                            >
                                {missionPlannerCollapsed ? '⬇️ Expand' : '⬆️ Collapse'}
                            </button>
                            {selectedRobot && (
                                <EmergencyStopButton 
                                    robotId={selectedRobot.id} 
                                    sendCommand={sendCommand} 
                                />
                            )}
                        </div>
                    </div>

                    {/* Planner body (collapsible) */}
                    {!missionPlannerCollapsed && (
                        <>
                            {/* Mission controls bar */}
                            <MissionControls
                                robots={robots}
                                activeMap={activeMap}
                                waypoints={worldWaypoints}
                                orgId={orgId}
                                isAdmin={isAdmin}
                                activeMission={activeMission}
                                onMissionStart={setActiveMission}
                                onMissionStop={() => setActiveMission(null)}
                                sendCommand={sendCommand}
                                showNotification={showNotification}
                                onWaypointsClear={() => setWaypoints([])}
                                savedRoutes={savedRoutes}
                                onRouteSelect={handleRouteSelect}
                                onRouteSaved={refreshRoutes}
                                onRouteDeleted={refreshRoutes}
                            />

                            {/* Canvas map view */}
                            <div className="map-section-v2 glass-card mp-map-card" ref={canvasWrapperRef}>
                                <div className="map-overlay-controls">
                                    <div className="mode-toggle glass-card">
                                        <button 
                                            className={!isAutonomous ? 'active' : ''} 
                                            onClick={() => setIsAutonomous(false)}
                                        >
                                            🕹️ Manual
                                        </button>
                                        <button 
                                            className={isAutonomous ? 'active' : ''} 
                                            onClick={() => setIsAutonomous(true)}
                                        >
                                            🤖 Autonomous
                                        </button>
                                    </div>
                                </div>
                                <RouteEditor
                                    activeMap={activeMap}
                                    waypoints={waypoints}
                                    onWaypointAdd={handleWaypointAdd}
                                    isEditMode={isEditMode}
                                    robotPoses={robotsOnCanvas}
                                    containerWidth={canvasWidth}
                                />
                            </div>

                            {/* Advanced Monitoring Sidebar (Collapsible) */}
                            {selectedRobot && !missionPlannerCollapsed && (
                                <div className={`advanced-robot-panel ${advancedPanelOpen ? 'open' : 'collapsed'}`}>
                                    <div className="panel-toggle" onClick={() => setAdvancedPanelOpen(!advancedPanelOpen)}>
                                        {advancedPanelOpen ? '▶' : '◀'}
                                    </div>
                                    <div className="panel-content">
                                        <h3>{selectedRobot.name} - Advanced</h3>
                                        
                                        {!isAutonomous ? (
                                            <TeleopControls 
                                                robotId={selectedRobot.id} 
                                                sendCommand={sendCommand} 
                                            />
                                        ) : (
                                            <div className="autonomous-status glass-card">
                                                <p>📍 Navigation Stack Active</p>
                                                <p>Using Waypoints from Editor</p>
                                            </div>
                                        )}

                                        <LidarViewer scanData={selectedRobot.lidarScan} />
                                        <CameraFeed robotId={selectedRobot.id} />
                                        <SensorDiagnostics sensors={selectedRobot.sensors} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>


                {/* Sidebar */}
                <aside className="fleet-status-sidebar glass-card">
                    <h3>{t('fleet_live_status')}</h3>
                    <div className="fleet-metrics-v2">
                        <div className="fleet-stat-v2"><label>{t('online')}</label><span className="val online">{onlineCount}</span></div>
                        <div className="fleet-stat-v2"><label>{t('total')}</label><span className="val">{robots.length}</span></div>
                        <div className="fleet-stat-v2"><label>{t('standby')}</label><span className="val">{robots.length - onlineCount}</span></div>
                        <div className="fleet-stat-v2"><label>{t('tracking')}</label><span className="val online">{onlineRobots.length}</span></div>
                    </div>
                    <div className="live-robot-list-v2">
                        {robots.map((robot) => (
                            <div key={robot.id} className={`live-robot-card-v2 ${selectedRobot?.id === robot.id ? 'active' : ''}`} onClick={() => setSelectedRobot(robot)}>
                                <div className="live-top">
                                    <span className={`status-dot-v2 ${robot.status === 'ONLINE' ? 'online' : ''}`}></span>
                                    <span className="name">{robot.name}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 600, color: robot.status === 'ONLINE' ? 'var(--primary)' : 'var(--text-muted)' }}>
                                        {robot.status}
                                    </span>
                                </div>
                                {robot.status === 'ONLINE' && robot.telemetry ? (
                                    <div className="live-stats">
                                        <span>🔋 {robot.telemetry.battery ?? '--'}%</span>
                                        <span>🌡️ {robot.telemetry.temperature ?? '--'}°</span>
                                        {robot.telemetry.pose && (
                                            <span>📍 {robot.telemetry.pose.x?.toFixed(1)}, {robot.telemetry.pose.y?.toFixed(1)}</span>
                                        )}
                                    </div>
                                ) : robot.status === 'ONLINE' ? (
                                    <div className="live-stats" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Awaiting telemetry…
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TrackerTab;
