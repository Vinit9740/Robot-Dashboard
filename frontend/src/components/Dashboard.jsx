import { useContext } from 'react';
import './Dashboard.css';
import HomeTab from './tabs/HomeTab';
import TrackerTab from './tabs/TrackerTab';
import UserTab from './tabs/UserTab';
import AdminVerification from './tabs/AdminVerification';
import { AppContext } from '../App';

export default function Dashboard({ token, onLogout }) {
    const { activeTab, setActiveTab, user } = useContext(AppContext);

    // Check admin status from user object in context
    const isAdmin = user?.app_metadata?.role === 'admin';

    const handleLogout = () => {
        onLogout();
    };

    return (
        <div className="dashboard-v2 sidebar-open">
            {/* Sidebar */}
            <aside className="sidebar glass-card">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text glow-text">RobotControl</span>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1 }}>
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
                    {isAdmin && (
                        <button
                            className={`nav-item ${activeTab === 'verify' ? 'active' : ''}`}
                            onClick={() => setActiveTab('verify')}
                        >
                            <span className="nav-icon">🛡️</span>
                            <span className="nav-label">Clearance</span>
                        </button>
                    )}
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
                            <span className="user-role-badge">{user.app_metadata?.role || 'operator'}</span>
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
                    <div className="viewport-title">
                        <h2>{activeTab === 'verify' ? 'Personnel Clearance' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    </div>
                </header>

                <div className="tab-render-area">
                    {activeTab === 'home' && <HomeTab token={token} user={user} />}
                    {activeTab === 'tracker' && <TrackerTab token={token} user={user} />}
                    {activeTab === 'verify' && isAdmin && <AdminVerification token={token} />}
                    {activeTab === 'user' && <UserTab token={token} />}
                </div>
            </main>
        </div>
    );
}
