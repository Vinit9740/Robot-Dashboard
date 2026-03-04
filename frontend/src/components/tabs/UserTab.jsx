import React, { useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/UserTab.css';
import { AppContext } from '../../App';

const UserTab = ({ token }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                if (!token) return;
                const decoded = jwtDecode(token);

                const mockExtendedData = {
                    'admin': {
                        organization: 'Global Nexus Command',
                        totalRobots: 24,
                        activeRobots: 18,
                        joinedDate: 'June 2023'
                    },
                    'user': {
                        organization: 'Sector 7 Operations',
                        totalRobots: 5,
                        activeRobots: 3,
                        joinedDate: 'January 2024'
                    }
                };

                const extended = mockExtendedData[decoded.role] || mockExtendedData['user'];

                setUser({
                    name: decoded.email ? decoded.email.split('@')[0].toUpperCase() : 'USER',
                    email: decoded.email || 'operator@nexus.io',
                    role: decoded.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'FIELD OPERATOR',
                    ...extended
                });
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, [token]);

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    };

    if (loading) {
        return (
            <div className="user-tab-v2 loading-state">
                <div className="loader"></div>
                <p>Establishing secure connection...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-tab-v2 error-state">
                <h2>⚠️ Access Denied</h2>
                <p>Could not retrieve profile telemetry.</p>
            </div>
        );
    }

    return (
        <div className="user-tab-v2">
            <div className="profile-grid-v2">
                {/* Profile Card */}
                <div className="profile-hero-v2 glass-card standout">
                    <div className="avatar-v2">
                        {getInitials(user.name)}
                    </div>
                    <div className="hero-info-v2">
                        <h2>{user.name}</h2>
                        <span className="role-tag-v2">{user.role}</span>
                        <p className="email-link-v2">{user.email}</p>
                    </div>
                    <div className="verified-badge-v2">
                        <span className="badge-check">⭐</span> Trusted Account
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stats-container-v3">
                    <div className="stat-box-v2 glass-card">
                        <label>Total Units</label>
                        <div className="val">{user.totalRobots}</div>
                    </div>
                    <div className="stat-box-v2 glass-card">
                        <label>Operational</label>
                        <div className="val online">{user.activeRobots}</div>
                    </div>
                    <div className="stat-box-v2 glass-card">
                        <label>Fleet Uptime</label>
                        <div className="val">
                            {user.activeRobots > 0 ? ((user.activeRobots / user.totalRobots) * 100).toFixed(0) : 0}%
                        </div>
                    </div>
                </div>

                {/* Organization Card */}
                <div className="content-card-v2 glass-card">
                    <h3>Organization Context</h3>
                    <div className="details-list-v2">
                        <div className="detail-row-v2">
                            <span className="label">Corporation</span>
                            <span className="value">{user.organization}</span>
                        </div>
                        <div className="detail-row-v2">
                            <span className="label">Access Level</span>
                            <span className="value">{user.role}</span>
                        </div>
                        <div className="detail-row-v2">
                            <span className="label">Enlistment Date</span>
                            <span className="value">{user.joinedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tab-actions-v2">
                <button
                    className="primary-glass-btn danger"
                    onClick={() => alert('Security Protocol Initialized: Deactivation requires higher clearance.')}
                >
                    Deactivate Control Node
                </button>
            </div>
        </div>
    );
};

export default UserTab;
