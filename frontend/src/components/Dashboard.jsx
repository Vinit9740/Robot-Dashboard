import { useState, useEffect } from 'react';
import './Dashboard.css';
import HomeTab from './tabs/HomeTab';
import TrackerTab from './tabs/TrackerTab';
import UserTab from './tabs/UserTab';
import { jwtDecode } from 'jwt-decode';

export default function Dashboard({ token, onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }
    }, [token]);

    const handleLogout = () => {
        onLogout();
    };

    return (
        <div className={`dashboard-v2 ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className="sidebar glass-card">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text glow-text">RobotControl</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                        onClick={() => setActiveTab('home')}
                    >
                        <span className="nav-icon">🏠</span>
                        <span className="nav-label">Fleet Overview</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracker')}
                    >
                        <span className="nav-icon">📍</span>
                        <span className="nav-label">Live Tracker</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => setActiveTab('user')}
                    >
                        <span className="nav-icon">👤</span>
                        <span className="nav-label">My Profile</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    {user && (
                        <div className="user-info">
                            <span className="user-role-badge">{user.app_metadata?.role || 'user'}</span>
                            <span className="user-email">{user.email || 'Admin User'}</span>
                        </div>
                    )}
                    <button className="logout-action-btn" onClick={handleLogout}>
                        <span className="logout-icon">🚪</span>
                        <span className="logout-text">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-viewport">
                <header className="viewport-header">
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                    <div className="viewport-title">
                        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    </div>
                </header>

                <div className="tab-render-area">
                    {activeTab === 'home' && <HomeTab token={token} user={user} />}
                    {activeTab === 'tracker' && <TrackerTab token={token} user={user} />}
                    {activeTab === 'user' && <UserTab token={token} />}
                </div>
            </main>
        </div>
    );
}
