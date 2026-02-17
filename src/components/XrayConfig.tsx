import { useState, useEffect } from 'react'
import type { FC } from 'react'

const XrayConfig: FC = () => {
  const [config, setConfig] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [xkeenAction, setXkeenAction] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ line: number; text: string }[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  const loadConfig = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/xray/read')
      const data = await res.json()
      if (data.success) {
        setConfig(data.data)
      } else {
        setResult({ success: false, message: data.error || 'Failed to load config' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Connection error' })
    }
    setLoading(false)
  }

  const saveConfig = async () => {
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch('/api/xray/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: config }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: 'Configuration saved successfully!' })
      } else {
        setResult({ success: false, message: data.error || 'Failed to save config' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Connection error' })
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/ssh/test', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: 'SSH connection successful!' })
      } else {
        setResult({ success: false, message: data.error || 'Connection failed' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Connection error' })
    }
    setTesting(false)
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(config)
      setConfig(JSON.stringify(parsed, null, 2))
      setResult({ success: true, message: 'JSON formatted!' })
    } catch (e) {
      setResult({ success: false, message: 'Invalid JSON format' })
    }
  }

  const handleXkeenAction = async (action: 'start' | 'stop' | 'restart') => {
    setXkeenAction(action)
    setResult(null)
    try {
      const res = await fetch('/api/xkeen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      setResult({ success: true, message: `Xkeen ${action}ed successfully!` })
    } catch (e) {
      setResult({ success: false, message: 'Connection error' })
    }
    setXkeenAction(null)
  }

  const performSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentMatchIndex(0)

    if (!query.trim() || !config) {
      setSearchResults([])
      return
    }

    const lines = config.split('\n')
    const results: { line: number; text: string }[] = []
    const lowerQuery = query.toLowerCase()

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        results.push({ line: index + 1, text: line.trim() })
      }
    })

    setSearchResults(results)
  }

  useEffect(() => {
    loadConfig()
  }, [])

  return (
    <div className="tool-container">
      <h2>XRay Routing Config Editor</h2>

      <div className="button-row">
        <button onClick={testConnection} disabled={testing} className="btn-secondary">
          {testing ? 'Testing...' : 'Test SSH Connection'}
        </button>
        <button onClick={loadConfig} disabled={loading} className="btn-secondary">
          {loading ? 'Loading...' : 'Reload Config'}
        </button>
        <button onClick={formatJson} className="btn-secondary">
          Format JSON
        </button>
        <button onClick={saveConfig} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Config'}
        </button>
      </div>

      <div className="xkeen-control-panel">
        <h3>Xkeen Control</h3>
        <div className="xkeen-buttons">
          <button
            onClick={() => handleXkeenAction('stop')}
            disabled={xkeenAction !== null}
            className="btn-danger"
          >
            {xkeenAction === 'stop' ? 'Stopping...' : 'Stop Xkeen'}
          </button>
          <button
            onClick={() => handleXkeenAction('start')}
            disabled={xkeenAction !== null}
            className="btn-success"
          >
            {xkeenAction === 'start' ? 'Starting...' : 'Start Xkeen'}
          </button>
          <button
            onClick={() => handleXkeenAction('restart')}
            disabled={xkeenAction !== null}
            className="btn-warning"
          >
            {xkeenAction === 'restart' ? 'Restarting...' : 'Restart Xkeen'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}

      <div className="form-group">
        <label>05_routing.json:</label>
        <div className="search-panel">
          <input
            type="text"
            placeholder="Search in config..."
            value={searchQuery}
            onChange={(e) => performSearch((e.target as HTMLInputElement).value)}
            className="search-input"
          />
          {searchQuery && (
            <span className="search-count">
              {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className={`search-result-item ${idx === currentMatchIndex ? 'active' : ''}`}
                onClick={() => setCurrentMatchIndex(idx)}
              >
                <span className="line-number">L{result.line}:</span>
                <span className="result-text">{result.text.slice(0, 100)}{result.text.length > 100 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={config}
          onChange={(e) => { setConfig((e.target as HTMLTextAreaElement).value); performSearch(searchQuery); }}
          placeholder="Loading configuration..."
          rows={20}
          className="code-editor"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export default XrayConfig
