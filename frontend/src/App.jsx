import { useState, useEffect, createContext } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import { healthCheck, getRobots } from './services/api'
import { supabase } from './services/supabaseClient'

export const AppContext = createContext()

function App() {
  const [token, setToken] = useState(null)
  const [backendConnected, setBackendConnected] = useState(false)
  const [checkingBackend, setCheckingBackend] = useState(true)
  const [robots, setRobots] = useState([])

  // ── Restore session from Supabase on mount ─────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Check backend connectivity first
      try {
        // The user's provided diff for this section was syntactically incorrect and changed the logic.
        // Assuming the intent was to change the healthCheck URL if it were inlined,
        // but since healthCheck is imported, it should be changed in api.js.
        // For now, I'm keeping the original call to healthCheck() as per the original file,
        // as the provided diff was not a valid replacement.
        const connected = await healthCheck()
        setBackendConnected(connected)
      } catch (error) { // Fixed catch block to log the error
        console.error('Error checking backend connectivity:', error);
        setBackendConnected(false)
      }

      // Restore Supabase session if one exists
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
        localStorage.setItem('token', session.access_token)
        localStorage.setItem('userEmail', session.user?.email || '')
      }

      setCheckingBackend(false)
    }

    init()

    // Listen for auth state changes (token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token)
        localStorage.setItem('token', session.access_token)
        localStorage.setItem('userEmail', session.user?.email || '')
      } else {
        setToken(null)
        setRobots([])
        localStorage.removeItem('token')
        localStorage.removeItem('userEmail')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch robots whenever we have a valid token ────────────────────────
  useEffect(() => {
    if (token) {
      fetchRobots();

      // Establish Real-time WebSocket connection
      const ws = new WebSocket(`ws://127.0.0.1:5000?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'telemetry') {
          setRobots(prevRobots => prevRobots.map(r =>
            r.id === data.robotId
              ? { ...r, telemetry: data.telemetry }
              : r
          ));
        } else if (data.type === 'status_update') {
          setRobots(prevRobots => prevRobots.map(r =>
            r.id === data.robotId
              ? { ...r, status: data.status }
              : r
          ));
        }
      };

      ws.onopen = () => console.log('🟢 Tracker WebSocket Connected');
      ws.onclose = () => console.log('🔴 Tracker WebSocket Disconnected');
      ws.onerror = (err) => console.error('WS Error:', err);

      return () => ws.close();
    }
  }, [token])

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
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setToken(null)
    setRobots([])
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
  }

  if (checkingBackend) {
    return <div className="loading">Checking backend connection...</div>
  }

  if (!backendConnected) {
    return (
      <div className="error-container">
        <h1>⚠️ Backend Not Connected</h1>
        <p>Please make sure the backend server is running on http://localhost:5000</p>
        <p>Run: <code>npm run dev</code> in the backend folder</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ robots, setRobots, token }}>
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </AppContext.Provider>
  )
}

export default App
