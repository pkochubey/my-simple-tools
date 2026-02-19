import { useState, useEffect, useRef } from 'react'
import type { FC } from 'react'

interface ProxyRoute {
  id: string
  pathPrefix: string
  targetBaseUrl: string
  enabled: boolean
}

interface ProxyLogEntry {
  id: string
  timestamp: number
  method: string
  path: string
  targetUrl: string
  status: number
  duration: number
  routeId: string
  requestHeaders?: Record<string, string>
  requestBody?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
}

const ProxyTool: FC = () => {
  const [running, setRunning] = useState(false)
  const [port, setPort] = useState(8080)
  const [portInput, setPortInput] = useState('8080')
  const [routes, setRoutes] = useState<ProxyRoute[]>([])
  const [logs, setLogs] = useState<ProxyLogEntry[]>([])

  const [newPathPrefix, setNewPathPrefix] = useState('/')
  const [newTargetUrl, setNewTargetUrl] = useState('http://')

  const [editingRouteId, setEditingRouteId] = useState<string | null>(null)
  const [editPathPrefix, setEditPathPrefix] = useState('')
  const [editTargetUrl, setEditTargetUrl] = useState('')

  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/proxy/status')
      const data = await res.json() as { 
        success: boolean; 
        running: boolean; 
        port: number; 
        routes: ProxyRoute[]; 
        logs: ProxyLogEntry[] 
      }
      if (data.success) {
        setRunning(data.running)
        setPort(data.port)
        setRoutes(data.routes)
        setLogs(data.logs)
        if (!data.running) {
          setPortInput(String(data.port))
        }
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Poll logs while running
  useEffect(() => {
    if (running) {
      pollRef.current = setInterval(fetchStatus, 2000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [running])

  const setProxyPort = async () => {
    const p = parseInt(portInput, 10)
    if (isNaN(p) || p < 1 || p > 65535) {
      setResult({ success: false, message: 'Invalid port number' })
      return
    }
    try {
      const res = await fetch('/api/proxy/port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: p }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setPort(p)
        setResult({ success: true, message: `Port set to ${p}` })
      } else {
        setResult({ success: false, message: data.error || 'Failed to set port' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
  }

  const addRoute = async () => {
    if (!newPathPrefix.startsWith('/')) {
      setResult({ success: false, message: 'Path prefix must start with /' })
      return
    }
    if (!newTargetUrl.startsWith('http://') && !newTargetUrl.startsWith('https://')) {
      setResult({ success: false, message: 'Target URL must start with http:// or https://' })
      return
    }
    try {
      const res = await fetch('/api/proxy/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathPrefix: newPathPrefix, targetBaseUrl: newTargetUrl }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setNewPathPrefix('/')
        setNewTargetUrl('http://')
        setResult({ success: true, message: 'Route added' })
        await fetchStatus()
      } else {
        setResult({ success: false, message: data.error || 'Failed to add route' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
  }

  const removeRoute = async (routeId: string) => {
    try {
      const res = await fetch('/api/proxy/route', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        await fetchStatus()
      } else {
        setResult({ success: false, message: data.error || 'Failed to remove route' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
  }

  const toggleRoute = async (routeId: string) => {
    try {
      const res = await fetch('/api/proxy/route/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        await fetchStatus()
      } else {
        setResult({ success: false, message: data.error || 'Failed to toggle route' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
  }

  const startEditRoute = (route: ProxyRoute) => {
    setEditingRouteId(route.id)
    setEditPathPrefix(route.pathPrefix)
    setEditTargetUrl(route.targetBaseUrl)
  }

  const cancelEditRoute = () => {
    setEditingRouteId(null)
    setEditPathPrefix('')
    setEditTargetUrl('')
  }

  const saveEditRoute = async () => {
    if (!editingRouteId) return
    if (!editPathPrefix.startsWith('/')) {
      setResult({ success: false, message: 'Path prefix must start with /' })
      return
    }
    if (!editTargetUrl.startsWith('http://') && !editTargetUrl.startsWith('https://')) {
      setResult({ success: false, message: 'Target URL must start with http:// or https://' })
      return
    }
    try {
      const res = await fetch('/api/proxy/route', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: editingRouteId, pathPrefix: editPathPrefix, targetBaseUrl: editTargetUrl }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setResult({ success: true, message: 'Route updated' })
        cancelEditRoute()
        await fetchStatus()
      } else {
        setResult({ success: false, message: data.error || 'Failed to update route' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
  }

  const startProxy = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/proxy/start', { method: 'POST' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setRunning(true)
        setResult({ success: true, message: `Proxy started on port ${port}` })
      } else {
        setResult({ success: false, message: data.error || 'Failed to start proxy' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
    setLoading(false)
  }

  const stopProxy = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/proxy/stop', { method: 'POST' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setRunning(false)
        setResult({ success: true, message: 'Proxy stopped' })
      } else {
        setResult({ success: false, message: data.error || 'Failed to stop proxy' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
    setLoading(false)
  }

  const clearLogs = async () => {
    try {
      await fetch('/api/proxy/logs/clear', { method: 'POST' })
      setLogs([])
      setSelectedLogId(null)
    } catch {
      // ignore
    }
  }

  const repeatRequest = async (logId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/proxy/repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      })
      const data = await res.json() as { success: boolean; status?: number; error?: string; body?: string }
      if (data.success) {
        setResult({ success: true, message: `Request repeated. Status: ${data.status}` })
        await fetchStatus()
      } else {
        setResult({ success: false, message: data.error || 'Failed to repeat request' })
      }
    } catch {
      setResult({ success: false, message: 'Connection error' })
    }
    setLoading(false)
  }

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'var(--success)'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400 && status < 500) return 'var(--error)'
    return '#ef4444'
  }

  const getMethodColor = (method: string): string => {
    switch (method) {
      case 'GET': return 'var(--success)'
      case 'POST': return '#3b82f6'
      case 'PUT': return '#f59e0b'
      case 'PATCH': return '#8b5cf6'
      case 'DELETE': return 'var(--error)'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <div className="tool-container">
      <h2>Reverse Proxy</h2>

      {/* Server Control */}
      <div className="proxy-control-panel">
        <h3>Server</h3>
        <div className="proxy-server-row">
          <div className="proxy-port-group">
            <label>Port</label>
            <input
              type="number"
              className="proxy-input proxy-port-input"
              value={portInput}
              onChange={e => setPortInput(e.target.value)}
              disabled={running}
              min={1}
              max={65535}
              onBlur={setProxyPort}
              onKeyDown={e => e.key === 'Enter' && setProxyPort()}
            />
          </div>
          <div className="proxy-status-indicator">
            <span className={`proxy-dot ${running ? 'running' : 'stopped'}`} />
            <span>{running ? 'Running' : 'Stopped'}</span>
          </div>
          <div className="proxy-server-actions">
            {!running ? (
              <button className="btn-success" onClick={startProxy} disabled={loading || routes.length === 0}>
                ▶ Start
              </button>
            ) : (
              <button className="btn-danger" onClick={stopProxy} disabled={loading}>
                ■ Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Routes */}
      <div className="proxy-control-panel">
        <h3>Routes</h3>
        <div className="proxy-add-route">
          <div className="proxy-route-inputs">
            <div className="proxy-field">
              <label>Path Prefix</label>
              <input
                type="text"
                className="proxy-input"
                value={newPathPrefix}
                onChange={e => setNewPathPrefix(e.target.value)}
                placeholder="/api"
              />
            </div>
            <span className="proxy-arrow">→</span>
            <div className="proxy-field proxy-field-grow">
              <label>Target Base URL</label>
              <input
                type="text"
                className="proxy-input"
                value={newTargetUrl}
                onChange={e => setNewTargetUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
            </div>
            <button className="btn-primary proxy-add-btn" onClick={addRoute}>
              + Add
            </button>
          </div>
        </div>

        {routes.length === 0 && (
          <div className="proxy-empty">No routes configured. Add a route to get started.</div>
        )}

        {routes.map(route => (
          <div key={route.id} className={`proxy-route-item ${!route.enabled ? 'disabled' : ''}`}>
            {editingRouteId === route.id ? (
              <>
                <div className="proxy-route-edit-fields">
                  <input
                    type="text"
                    className="proxy-input proxy-edit-input"
                    value={editPathPrefix}
                    onChange={e => setEditPathPrefix(e.target.value)}
                  />
                  <span className="proxy-arrow-small">→</span>
                  <input
                    type="text"
                    className="proxy-input proxy-edit-input proxy-edit-input-grow"
                    value={editTargetUrl}
                    onChange={e => setEditTargetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEditRoute()}
                  />
                </div>
                <div className="proxy-route-actions">
                  <button className="btn-small btn-small-save" onClick={saveEditRoute} title="Save">✓</button>
                  <button className="btn-small" onClick={cancelEditRoute} title="Cancel">✕</button>
                </div>
              </>
            ) : (
              <>
                <div className="proxy-route-info">
                  <code className="proxy-route-path">{route.pathPrefix}</code>
                  <span className="proxy-arrow-small">→</span>
                  <code className="proxy-route-target">{route.targetBaseUrl}</code>
                </div>
                <div className="proxy-route-actions">
                  <button
                    className="btn-small"
                    onClick={() => startEditRoute(route)}
                    title="Edit route"
                  >
                    ✎
                  </button>
                  <button
                    className={`btn-small ${route.enabled ? '' : 'btn-small-off'}`}
                    onClick={() => toggleRoute(route.id)}
                    title={route.enabled ? 'Disable' : 'Enable'}
                  >
                    {route.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    className="btn-small btn-small-danger"
                    onClick={() => removeRoute(route.id)}
                    title="Remove route"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Result message */}
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}

          {/* Logs */}
      <div className="proxy-control-panel">
        <div className="proxy-logs-header">
          <h3>Request Log</h3>
          {logs.length > 0 && (
            <button className="btn-small" onClick={clearLogs}>Clear</button>
          )}
        </div>

        {logs.length === 0 && (
          <div className="proxy-empty">No requests logged yet.</div>
        )}

        {logs.length > 0 && (
          <div className="proxy-log-viewer">
            <div className="proxy-log-list">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className={`proxy-log-entry ${selectedLogId === log.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <span className="proxy-log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="proxy-log-method" style={{ color: getMethodColor(log.method) }}>
                    {log.method}
                  </span>
                  <span className="proxy-log-path">{log.path}</span>
                  <span className="proxy-log-status" style={{ color: getStatusColor(log.status) }}>
                    {log.status}
                  </span>
                  <span className="proxy-log-duration">{log.duration}ms</span>
                </div>
              ))}
            </div>

            {selectedLogId && logs.find(l => l.id === selectedLogId) && (
              <div className="proxy-log-details">
                {(() => {
                  const log = logs.find(l => l.id === selectedLogId)!
                  return (
                    <>
                      <div className="details-header">
                        <h4>Request Details</h4>
                        <button 
                          className="btn-primary btn-small"
                          onClick={() => repeatRequest(log.id)}
                          disabled={loading}
                        >
                          ↻ Repeat Request
                        </button>
                      </div>
                      
                      <div className="details-section">
                        <h5>Target URL</h5>
                        <code>{log.targetUrl}</code>
                      </div>

                      <div className="details-grid">
                        <div className="details-half">
                          <h5>Request Headers</h5>
                          <pre className="details-pre">
                            {log.requestHeaders ? JSON.stringify(log.requestHeaders, null, 2) : 'No headers'}
                          </pre>
                        </div>
                        <div className="details-half">
                          <h5>Response Headers</h5>
                          <pre className="details-pre">
                            {log.responseHeaders ? JSON.stringify(log.responseHeaders, null, 2) : 'No headers'}
                          </pre>
                        </div>
                      </div>

                      {log.requestBody && (
                        <div className="details-section">
                          <h5>Request Body</h5>
                          <pre className="details-pre">{log.requestBody}</pre>
                        </div>
                      )}

                      {log.responseBody && (
                        <div className="details-section">
                          <h5>Response Body</h5>
                          <pre className="details-pre">{log.responseBody}</pre>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .proxy-log-viewer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 600px;
        }
        .proxy-log-list {
          flex: 1;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .proxy-log-entry {
          display: flex;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          font-family: 'Consolas', monospace;
          font-size: 0.85rem;
          gap: 1rem;
          align-items: center;
        }
        .proxy-log-entry:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .proxy-log-entry.selected {
          background: rgba(var(--primary-rgb), 0.2);
          border-left: 3px solid var(--primary);
        }
        .proxy-log-time { color: #666; width: 80px; }
        .proxy-log-method { width: 50px; font-weight: bold; }
        .proxy-log-path { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .proxy-log-status { width: 40px; text-align: right; }
        .proxy-log-duration { width: 60px; text-align: right; color: #666; }

        .proxy-log-details {
          flex: 2;
          overflow-y: auto;
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1.5rem;
        }
        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #333;
          padding-bottom: 1rem;
        }
        .details-header h4 { margin: 0; }
        .details-section { margin-bottom: 1.5rem; }
        .details-section h5, .details-half h5 {
          margin: 0 0 0.5rem 0;
          color: #aaa;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        .details-grid {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .details-half { flex: 1; }
        .details-pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          max-height: 200px;
          overflow: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        code {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          word-break: break-all;
        }
      `}</style>
    </div>
  )
}

export default ProxyTool
