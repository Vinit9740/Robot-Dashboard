import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { createRobot } from '../../services/api';
import '../styles/HomeTab.css';

const HomeTab = ({ user, token }) => {
    const { robots, setRobots } = useContext(AppContext);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', model: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const calculateHealthScore = (robot) => {
        if (!robot.telemetry) return 0;
        const battery = robot.telemetry.battery || 0;
        const cpu = 100 - (robot.telemetry.cpu || 0);
        const temp = Math.max(0, 100 - Math.abs(robot.telemetry.temperature - 50) * 2);
        return Math.round((battery + cpu + temp) / 3);
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'var(--primary)';
        if (score >= 60) return '#fbbf24';
        if (score >= 40) return '#ff9500';
        return '#ff3b30';
    };

    const handleCreateRobot = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const newRobotData = await createRobot(formData, token);
            // The backend returns { robot, apiKey }
            setRobots([...robots, newRobotData.robot]);
            setFormData({ name: '', model: '' });
            setShowCreateForm(false);
            alert(`Robot Created! API KEY: ${newRobotData.apiKey}\n\nSave this key, it won't be shown again.`);
        } catch (err) {
            console.error('❌ Robot deployment failed:', err);
            setError(`Deployment Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        return status === 'ONLINE' ? 'var(--primary)' : '#666';
    };

    return (
        <div className="home-tab-v2">
            <div className="home-header-v2">
                <div className="welcome-text">
                    <h1 className="glow-text">Fleet Overview</h1>
                    <p className="subtitle">
                        Managing <strong>{robots.length}</strong> active units in your organization.
                    </p>
                </div>
                {user?.app_metadata?.role === 'admin' && (
                    <button
                        className="create-robot-btn-v2"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        <span>+</span> New Deployment
                    </button>
                )}
            </div>

            {showCreateForm && (
                <>
                    <div className="modal-overlay-v2" onClick={() => setShowCreateForm(false)}></div>
                    <div className="create-form-modal glass-card">
                        <form onSubmit={handleCreateRobot} className="modern-form">
                            <h3>Deploy New Robot</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Codename</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Striker-1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Model Series</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., X-Wing"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <div className="form-actions-v2">
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? 'Initializing...' : 'Confirm Deployment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="secondary-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            <div className="robots-grid-v2">
                {robots.map((robot) => {
                    const healthScore = calculateHealthScore(robot);
                    const healthColor = getHealthColor(healthScore);
                    const statusColor = getStatusColor(robot.status);

                    return (
                        <div key={robot.id} className="robot-card-v2 glass-card">
                            <div className="card-top-v2">
                                <div className="robot-info-v2">
                                    <h3>{robot.name}</h3>
                                    <span className="model-tag-v2">{robot.model || 'Standard Unit'}</span>
                                </div>
                                <div
                                    className={`status-chip-v2 ${robot.status === 'ONLINE' ? 'online' : 'offline'}`}
                                >
                                    {robot.status}
                                </div>
                            </div>

                            <div className="health-display-v2">
                                <div className="health-label-row">
                                    <span>System Integrity</span>
                                    <span style={{ color: healthColor }}>{healthScore}%</span>
                                </div>
                                <div className="health-track-v2">
                                    <div
                                        className="health-bar-v2"
                                        style={{ width: `${healthScore}%`, backgroundColor: healthColor }}
                                    ></div>
                                </div>
                            </div>

                            <div className="stats-mini-grid-v2">
                                <div className="stat-pill-v2">
                                    <span className="stat-pill-icon">🔋</span>
                                    <span className="stat-pill-val">{robot.telemetry?.battery || 0}%</span>
                                </div>
                                <div className="stat-pill-v2">
                                    <span className="stat-pill-icon">🌡️</span>
                                    <span className="stat-pill-val">{robot.telemetry?.temperature || 0}°C</span>
                                </div>
                                <div className="stat-pill-v2">
                                    <span className="stat-pill-icon">📍</span>
                                    <span className="stat-pill-val">
                                        {robot.telemetry?.pose?.x?.toFixed(0)}, {robot.telemetry?.pose?.y?.toFixed(0)}
                                    </span>
                                </div>
                            </div>

                            <div className="card-footer-v2">
                                <span className="last-sync-v2">
                                    Synced: {new Date(robot.telemetry?.lastUpdate || Date.now()).toLocaleTimeString()}
                                </span>
                                <button
                                    className="inspect-btn-v2"
                                    onClick={() => alert(`Accessing deep diagnostics for ${robot.name}...\n\nStatus: ${robot.status}\nModel: ${robot.model}`)}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {robots.length === 0 && (
                <div className="empty-state-v2 glass-card">
                    <p className="empty-icon">🛰️</p>
                    <p className="empty-title">No Units Found</p>
                    <p className="empty-sub">Get started by deploying your first robot unit.</p>
                </div>
            )}
        </div>
    );
};

export default HomeTab;
