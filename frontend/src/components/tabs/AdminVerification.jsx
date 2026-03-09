import React, { useState, useEffect } from 'react';
import '../styles/AdminVerification.css';

const AdminVerification = ({ token }) => {
    const [operatives, setOperatives] = useState([]);
    const [allRobots, setAllRobots] = useState([]);
    const [selectedRobots, setSelectedRobots] = useState({}); // { userId: [robotIds] }
    const [loading, setLoading] = useState(true);
    const [updatingMap, setUpdatingMap] = useState({}); // { userId: boolean }
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const usersRes = await fetch('http://127.0.0.1:5000/users/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!usersRes.ok) throw new Error('Failed to fetch operatives');
            const operativesData = await usersRes.json();
            setOperatives(operativesData);

            const initialSelection = {};
            operativesData.forEach(op => {
                initialSelection[op.id] = op.assignedRobots || [];
            });
            setSelectedRobots(initialSelection);

            const robotsRes = await fetch('http://127.0.0.1:5000/robots', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!robotsRes.ok) throw new Error('Failed to fetch robots');
            const robotsData = await robotsRes.json();
            setAllRobots(robotsData);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const toggleRobotSelection = (userId, robotId, reset = false) => {
        setSelectedRobots(prev => {
            if (reset) {
                const op = operatives.find(o => o.id === userId);
                return { ...prev, [userId]: op?.assignedRobots || [] };
            }

            const current = prev[userId] || [];
            if (current.includes(robotId)) {
                return { ...prev, [userId]: current.filter(id => id !== robotId) };
            } else {
                return { ...prev, [userId]: [...current, robotId] };
            }
        });
    };

    const handleUpdateClearance = async (userId) => {
        setError('');
        setSuccess('');
        setUpdatingMap(prev => ({ ...prev, [userId]: true }));
        const robotIds = selectedRobots[userId] || [];

        try {
            const res = await fetch('http://127.0.0.1:5000/users/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, robotIds })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');

            setSuccess(`Assignments for user updated successfully.`);
            await fetchData(true);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setUpdatingMap(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (loading) return (
        <div className="admin-v-loading">
            <div className="spinner"></div>
            <p>Scanning personnel roster...</p>
        </div>
    );

    const pendingOperatives = operatives.filter(op => !op.verified);
    const activeOperatives = operatives.filter(op => op.verified);

    return (
        <div className="admin-v-tab">
            <div className="admin-v-header">
                <div className="header-flex">
                    <div>
                        <h3>Personnel Management</h3>
                        <p>Track authorization levels and robot assignments across the fleet.</p>
                    </div>
                    <button className="refresh-btn" onClick={() => fetchData()}>🔄 Sync Roster</button>
                </div>
            </div>

            {error && <div className="admin-v-error">⚠️ {error}</div>}
            {success && <div className="admin-v-success">📡 {success}</div>}

            <div className="admin-v-list">
                <div className="admin-v-section">
                    <h4 className="section-title">Awaiting Authorization <span>{pendingOperatives.length}</span></h4>
                    {pendingOperatives.length === 0 ? (
                        <div className="no-data glass-card">No pending authorization requests.</div>
                    ) : (
                        pendingOperatives.map(op => (
                            <OperativeCard
                                key={op.id}
                                op={op}
                                allRobots={allRobots}
                                selectedRobots={selectedRobots}
                                toggleRobotSelection={toggleRobotSelection}
                                handleAction={handleUpdateClearance}
                                actionLabel="Grant Clearance"
                                isUpdating={updatingMap[op.id]}
                            />
                        ))
                    )}
                </div>

                <div className="admin-v-section">
                    <h4 className="section-title">Authorized Personnel <span>{activeOperatives.length}</span></h4>
                    {activeOperatives.length === 0 ? (
                        <div className="no-data glass-card">No active field operatives detected.</div>
                    ) : (
                        activeOperatives.map(op => (
                            <OperativeCard
                                key={op.id}
                                op={op}
                                allRobots={allRobots}
                                selectedRobots={selectedRobots}
                                toggleRobotSelection={toggleRobotSelection}
                                handleAction={handleUpdateClearance}
                                actionLabel="Update Assignments"
                                isActive={true}
                                isUpdating={updatingMap[op.id]}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const OperativeCard = ({ op, allRobots, selectedRobots, toggleRobotSelection, handleAction, actionLabel, isActive, isUpdating }) => {
    const [isEditing, setIsEditing] = useState(false);
    const currentSelection = selectedRobots[op.id] || [];
    const serverSelection = op.assignedRobots || [];

    const hasChanges = JSON.stringify([...currentSelection].sort()) !== JSON.stringify([...serverSelection].sort());

    const onSave = async () => {
        const success = await handleAction(op.id);
        if (success) setIsEditing(false);
    };

    const onCancel = () => {
        toggleRobotSelection(op.id, null, true);
        setIsEditing(false);
    };

    return (
        <div className={`pending-user-card glass-card ${isActive ? 'active-card' : ''} ${hasChanges ? 'has-unsaved' : ''} ${isEditing ? 'editing-mode' : ''}`}>
            <div className="card-top">
                <div className="user-info">
                    <span className="email">{op.email}</span>
                    <div className="meta-row">
                        <span className={`role-badge ${op.role}`}>{op.role.toUpperCase()}</span>
                        {op.user_metadata?.username && <span className="username">@{op.user_metadata.username}</span>}
                        {isActive && !isEditing && <span className="assignment-summary">{currentSelection.length} units assigned</span>}
                    </div>
                </div>

                <div className="card-actions">
                    {isActive && !isEditing ? (
                        <button className="edit-toggle-btn" onClick={() => setIsEditing(true)}>Edit Access</button>
                    ) : (
                        <div className="edit-actions">
                            {(isEditing || hasChanges) && (
                                <button className="cancel-btn" onClick={onCancel} disabled={isUpdating}>Cancel</button>
                            )}
                            <button
                                className={`action-btn ${isActive ? 'secondary' : 'primary'}`}
                                onClick={onSave}
                                disabled={isUpdating || (isActive && !hasChanges && !isEditing)}
                            >
                                {isUpdating ? 'Saving...' : (isActive ? 'Update Assignments' : actionLabel)}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {(isEditing || !isActive) && (
                <div className="assignment-area">
                    <label>
                        {isActive ? 'Modify Robot Access:' : 'Select Initial Assignments:'}
                        {hasChanges && <span className="change-indicator">* Unsaved Changes</span>}
                    </label>
                    <div className="robot-grid">
                        {allRobots.map(robot => (
                            <div
                                key={robot.id}
                                className={`robot-pill ${currentSelection.includes(robot.id) ? 'selected' : ''}`}
                                onClick={() => toggleRobotSelection(op.id, robot.id)}
                            >
                                <span className="icon">🤖</span>
                                <span className="name">{robot.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerification;
