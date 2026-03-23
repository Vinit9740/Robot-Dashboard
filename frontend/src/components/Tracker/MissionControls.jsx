import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoute, deleteRoute } from '../../services/routeService';
import { createMission, startMission, cancelMission } from '../../services/missionService';
import './MissionPlanner.css';

/**
 * MissionControls toolbar — Save Route / Start Mission / Stop Mission.
 *
 * Props:
 *   robots         {Array}    - full robot list from AppContext
 *   activeMap      {Object}   - currently loaded map row
 *   waypoints      {Array}    - [{x, y}] route waypoints from RouteEditor
 *   orgId          {string}   - current user's org_id
 *   isAdmin        {boolean}  - gates Start/Stop mission buttons
 *   activeMission  {Object|null}
 *   onMissionStart {Function} - called with mission object when started
 *   onMissionStop  {Function} - called when mission cancelled
 *   sendCommand    {Function} - AppContext WS command sender
 *   showNotification {Function}
 *   onWaypointsClear {Function} - clear waypoints after save
 *   onRouteSaved   {Function} - called after a route is saved/reused to refresh list
 *   onRouteDeleted {Function} - called after a route is deleted to refresh list
 */
const MissionControls = ({
    robots,
    activeMap,
    waypoints,
    orgId,
    isAdmin,
    activeMission,
    onMissionStart,
    onMissionStop,
    sendCommand,
    showNotification,
    onWaypointsClear,
    savedRoutes,
    onRouteSelect,
    onRouteSaved,
    onRouteDeleted,
}) => {
    const { t } = useTranslation();
    const [selectedRobotId, setSelectedRobotId] = useState('');
    const [routeName, setRouteName] = useState('Route 1');
    const [savedRoute, setSavedRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSavedRouteId, setSelectedSavedRouteId] = useState('');

    const onlineRobots = robots.filter(r => r.status === 'ONLINE');

    const handleSaveRoute = async () => {
        if (!activeMap) return showNotification('Upload a map first.', 'error');
        if (waypoints.length < 2) return showNotification('Add at least 2 waypoints.', 'error');
        if (!routeName.trim()) return showNotification('Enter a route name.', 'error');

        setLoading(true);
        try {
            const { route, alreadyExisted } = await createRoute(activeMap.id, orgId, routeName.trim(), waypoints);
            setSavedRoute(route);
            if (alreadyExisted) {
                showNotification(`Route "${route.name}" already exists — loaded it for you.`, 'info');
            } else {
                showNotification(`Route "${route.name}" saved!`, 'success');
            }
            onRouteSaved?.();
        } catch (err) {
            showNotification(`Save failed: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = async (routeId, routeNameStr) => {
        if (!window.confirm(`Delete route "${routeNameStr}"?`)) return;
        setLoading(true);
        try {
            await deleteRoute(routeId);
            showNotification(`Route "${routeNameStr}" deleted.`, 'success');
            // If the deleted route was the currently saved one, clear it
            if (savedRoute?.id === routeId) {
                setSavedRoute(null);
                setRouteName('Route 1');
                onWaypointsClear?.();
            }
            onRouteDeleted?.();
        } catch (err) {
            showNotification(`Delete failed: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartMission = async () => {
        if (!savedRoute) return showNotification('Save the route before starting a mission.', 'error');
        if (!selectedRobotId) return showNotification('Select a robot to assign.', 'error');

        setLoading(true);
        try {
            // 1. Create mission record (pending)
            const mission = await createMission(selectedRobotId, savedRoute.id);
            // 2. Activate it in DB
            const activatedMission = await startMission(mission.id);
            // 3. Send route to robot over WebSocket
            sendCommand(selectedRobotId, 'start_mission', { route: waypoints });
            onMissionStart(activatedMission);
            showNotification('Mission started! Route sent to robot.', 'success');
        } catch (err) {
            showNotification(`Mission failed: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStopMission = async () => {
        if (!activeMission) return;
        setLoading(true);
        try {
            await cancelMission(activeMission.id);
            sendCommand(activeMission.robot_id, 'STOP');
            onMissionStop();
            showNotification('Mission cancelled.', 'info');
        } catch (err) {
            showNotification(`Stop failed: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mp-controls-bar glass-card">
            {/* Robot selector */}
            <div className="mp-control-group">
                <label className="mp-control-label">🤖 {t('robot')}</label>
                <select
                    className="mp-select"
                    value={selectedRobotId}
                    onChange={e => setSelectedRobotId(e.target.value)}
                    disabled={!!activeMission}
                >
                    <option value="">{t('select_robot')}…</option>
                    {onlineRobots.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            {/* Saved Route Selector with delete */}
            <div className="mp-control-group">
                <label className="mp-control-label">🛣️ {t('saved_routes')}</label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select
                        className="mp-select"
                        value={selectedSavedRouteId}
                        onChange={e => {
                            setSelectedSavedRouteId(e.target.value);
                            onRouteSelect(e.target.value);
                        }}
                        disabled={!!activeMission}
                        style={{ flex: 1 }}
                    >
                        <option value="">{t('new_route')} / {t('select_route')}…</option>
                        {savedRoutes && savedRoutes.map(route => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                    </select>
                    {selectedSavedRouteId && !activeMission && (
                        <button
                            className="mp-btn mp-btn-clear"
                            style={{ height: 32, fontSize: '0.7rem', padding: '0 8px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                                const route = savedRoutes.find(r => r.id === selectedSavedRouteId);
                                if (route) {
                                    handleDeleteRoute(route.id, route.name);
                                    setSelectedSavedRouteId('');
                                }
                            }}
                            title="Delete selected route"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* Route name */}
            <div className="mp-control-group">
                <label className="mp-control-label">📋 {t('route_name')}</label>
                <input
                    className="mp-input"
                    type="text"
                    value={routeName}
                    onChange={e => setRouteName(e.target.value)}
                    placeholder="e.g. Patrol Alpha"
                    disabled={!!savedRoute || !!activeMission}
                />
            </div>

            {/* Action buttons */}
            <div className="mp-btn-group">
                <button
                    className="mp-btn mp-btn-save"
                    onClick={handleSaveRoute}
                    disabled={loading || !!savedRoute || waypoints.length < 2 || !activeMap}
                    title={savedRoute ? t('route_already_saved') : t('save_current_waypoints')}
                >
                    💾 {t('save_route')}
                </button>

                {savedRoute && (
                    <button
                        className="mp-btn mp-btn-clear"
                        onClick={() => { setSavedRoute(null); setRouteName('Route 1'); onWaypointsClear?.(); }}
                        disabled={loading || !!activeMission}
                        title={t('clear_waypoints_start_new')}
                    >
                        🗑️ {t('new_route')}
                    </button>
                )}

                {isAdmin && (
                    <>
                        {!activeMission ? (
                            <button
                                className="mp-btn mp-btn-start"
                                onClick={handleStartMission}
                                disabled={loading || !savedRoute || !selectedRobotId}
                                title={t('assign_route_start_mission')}
                            >
                                🚀 {t('start_mission')}
                            </button>
                        ) : (
                            <button
                                className="mp-btn mp-btn-stop"
                                onClick={handleStopMission}
                                disabled={loading}
                                title={t('cancel_active_mission')}
                            >
                                🛑 {t('stop_mission')}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Active mission indicator */}
            {activeMission && (
                <div className="mp-mission-badge">
                    <span className="mp-mission-pulse" />
                    {t('mission_active')}
                </div>
            )}
        </div>
    );
};

export default MissionControls;
