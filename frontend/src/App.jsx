import { useState, useEffect, createContext, useRef } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import { healthCheck, getRobots } from './services/api'
import { supabase } from './services/supabaseClient'

export const AppContext = createContext()

function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [backendConnected, setBackendConnected] = useState(false)
  const [checkingBackend, setCheckingBackend] = useState(true)
  const [robots, setRobots] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [selectedRobotId, setSelectedRobotId] = useState(null)
  const [notification, setNotification] = useState(null) // { message, type }
  const wsRef = useRef(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const decodeAndSetUser = (accessToken) => {
    try {
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setUser(payload);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      setUser(null);
    }
  };

  // ── Restore session from Supabase on mount ─────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const connected = await healthCheck()
        setBackendConnected(connected)
      } catch (error) {
        console.error('Error checking backend connectivity:', error);
        setBackendConnected(false)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
        decodeAndSetUser(session.access_token)
      }
      setCheckingBackend(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token)
        decodeAndSetUser(session.access_token)
      } else {
        setToken(null)
        setUser(null)
        setRobots([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── WebSocket & Data Management ────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchRobots();
      const ws = new WebSocket(`ws://127.0.0.1:5000?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'telemetry') {
          setRobots(p => p.map(r => r.id === data.robotId ? { ...r, telemetry: data.telemetry } : r));
        } else if (data.type === 'status_update') {
          setRobots(p => p.map(r => r.id === data.robotId ? { ...r, status: data.status } : r));
        } else if (data.type === 'assignments_updated') {
          fetchRobots();
        }
      };

      ws.onopen = () => console.log('🟢 Tracker WebSocket Connected');
      ws.onclose = () => {
        console.log('🔴 Tracker WebSocket Disconnected');
        wsRef.current = null;
      };
      ws.onerror = (err) => console.error('WS Error:', err);
      return () => ws.close();
    }
  }, [token])

  const sendCommand = (robotId, command, params = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'robot_command', robotId, command, params }));
      showNotification(`Command Sent: ${command}`, 'success');
      return true;
    }
    showNotification('System Offline: Link establishment failed.', 'error');
    return false;
  };

  const fetchRobots = async () => {
    try {
      const data = await getRobots(token)
      setRobots(data)
    } catch (err) {
      console.error('Error fetching robots:', err)
    }
  }

  const handleLoginSuccess = (accessToken) => {
    setToken(accessToken)
    decodeAndSetUser(accessToken)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
    setRobots([])
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
  }

  const navigateToTracker = (robotId) => {
    setSelectedRobotId(robotId);
    setActiveTab('tracker');
  };

  if (checkingBackend) return <div className="loading">Establishing secure connection...</div>

  if (!backendConnected) {
    return (
      <div className="error-container">
        <h1>⚠️ Subsystem Disconnected</h1>
        <p>Operational node at port 5000 is unreachable.</p>
        <button onClick={() => window.location.reload()}>Re-initialize</button>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      robots, setRobots, token, user, activeTab, setActiveTab,
      selectedRobotId, setSelectedRobotId, sendCommand, showNotification,
      navigateToTracker
    }}>
      {token ? <Dashboard token={token} onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}

      {notification && (
        <div className={`global-notification-v2 ${notification.type}`}>
          <div className="noti-content">
            <span className="noti-icon">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="noti-msg">{notification.message}</span>
          </div>
          <button className="noti-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}
    </AppContext.Provider>
  )
}

export default App
