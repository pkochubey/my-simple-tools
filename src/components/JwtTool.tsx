import { useState } from 'react'
import type { FC } from 'react'

interface JWTResult {
  success: boolean
  header?: Record<string, unknown>
  payload?: Record<string, unknown>
  error?: string
  expired?: boolean
  expiresAt?: string
  issuedAt?: string
}

const JwtTool: FC = () => {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<JWTResult | null>(null)

  const handleDecode = async () => {
    try {
      const res = await fetch('/api/jwt/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ success: false, error: 'Failed to decode token' })
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setToken(text)
    } catch (e) {
      console.error('Failed to read clipboard')
    }
  }

  const renderJson = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return null
    return (
      <pre className="json-display">
        {JSON.stringify(obj, null, 2)}
      </pre>
    )
  }

  return (
    <div className="tool-container">
      <h2>JWT Decoder</h2>

      <div className="form-group">
        <label>JWT Token:</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT token here..."
          rows={4}
        />
      </div>

      <div className="button-row">
        <button onClick={handleDecode} className="btn-primary">
          Decode
        </button>
        <button onClick={handlePaste} className="btn-secondary">
          Paste from Clipboard
        </button>
      </div>

      {result && (
        <div className="jwt-result">
          {result.success ? (
            <>
              {result.expired !== undefined && (
                <div className={`status-badge ${result.expired ? 'expired' : 'valid'}`}>
                  {result.expired ? 'EXPIRED' : 'VALID'}
                </div>
              )}

              {result.issuedAt && (
                <div className="time-info">
                  <strong>Issued at:</strong> {result.issuedAt}
                </div>
              )}

              {result.expiresAt && (
                <div className="time-info">
                  <strong>Expires at:</strong> {result.expiresAt}
                </div>
              )}

              <div className="json-section">
                <h4>Header</h4>
                {renderJson(result.header)}
              </div>

              <div className="json-section">
                <h4>Payload</h4>
                {renderJson(result.payload)}
              </div>
            </>
          ) : (
            <div className="result error">{result.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default JwtTool
