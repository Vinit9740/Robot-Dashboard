import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { createRobot } from '../../services/api';
import '../styles/HomeTab.css';

const HomeTab = ({ user, token }) => {
    const { robots, setRobots, navigateToTracker, showNotification } = useContext(AppContext);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', model: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null); // { robotName, apiKey }

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
            setRobots([...robots, newRobotData.robot]);
            setSuccessData({ robotName: newRobotData.robot.name, apiKey: newRobotData.apiKey });
            setFormData({ name: '', model: '' });
            setShowCreateForm(false);
            showNotification(`Robot ${newRobotData.robot.name} deployed successfully!`, 'success');
        } catch (err) {
            console.error('❌ Robot deployment failed:', err);
            setError(`Deployment Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showNotification('API Key copied to clipboard', 'success');
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
                        {robots.length > 0
                            ? `Managing ${robots.length} assigned unit${robots.length > 1 ? 's' : ''} in the Nexus.`
                            : 'Establishing secure link... Awaiting robot assignments.'}
                    </p>
                </div>
                {user?.app_metadata?.role === 'admin' && (
                    <button
                        className="create-robot-btn-v2"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <span>+</span> New Deployment
                    </button>
                )}
            </div>

            {/* Create Robot Modal */}
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

            {/* Success Modal (API Key) */}
            {successData && (
                <>
                    <div className="modal-overlay-v2" onClick={() => setSuccessData(null)}></div>
                    <div className="create-form-modal glass-card success-modal">
                        <div className="success-icon-v2">✅</div>
                        <h3>Deployment Successful</h3>
                        <p className="success-sub">Secure link established for <strong>{successData.robotName}</strong>.</p>

                        <div className="api-key-display-v2">
                            <label>Secure API Key (Simulation/Hardware)</label>
                            <div className="key-box">
                                <code>{successData.apiKey}</code>
                                <button onClick={() => copyToClipboard(successData.apiKey)} title="Copy Key">📋</button>
                            </div>
                            <p className="warning-text">⚠️ Warning: This key is only shown once. Store it in a secure location.</p>
                        </div>

                        <button className="primary-btn" onClick={() => setSuccessData(null)}>
                            Understood
                        </button>
                    </div>
                </>
            )}

            <div className="robots-grid-v2">
                {robots.map((robot) => {
                    const healthScore = calculateHealthScore(robot);
                    const healthColor = getHealthColor(healthScore);

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
                                    onClick={() => navigateToTracker(robot.id)}
                                >
                                    Track Unit
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
