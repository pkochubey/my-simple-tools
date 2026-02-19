import { useState, useEffect } from 'react'
import type { FC } from 'react'

const TimestampTool: FC = () => {
  const [timestamp, setTimestamp] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))
  const [unit, setUnit] = useState<'s' | 'ms'>('s')

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / (unit === 's' ? 1000 : 1)))
    }, 1000)
    return () => clearInterval(timer)
  }, [unit])

  const handleTimestampChange = (val: string) => {
    setTimestamp(val)
    if (!val) {
      setDateStr('')
      return
    }

    try {
      const ts = parseInt(val)
      if (isNaN(ts)) throw new Error()
      
      const date = new Date(unit === 's' ? ts * 1000 : ts)
      if (isNaN(date.getTime())) throw new Error()
      
      setDateStr(date.toISOString().replace('T', ' ').replace('Z', ' UTC'))
    } catch (e) {
      setDateStr('Invalid Timestamp')
    }
  }

  const handleDateChange = (val: string) => {
    setDateStr(val)
    if (!val) {
      setTimestamp('')
      return
    }

    try {
      const date = new Date(val)
      if (isNaN(date.getTime())) throw new Error()
      
      const ts = unit === 's' ? Math.floor(date.getTime() / 1000) : date.getTime()
      setTimestamp(ts.toString())
    } catch (e) {
      setTimestamp('Invalid Date')
    }
  }

  const useCurrent = () => {
    const ts = unit === 's' ? Math.floor(Date.now() / 1000) : Date.now()
    handleTimestampChange(ts.toString())
  }

  return (
    <div className="tool-container">
      <h2>Unix Timestamp Converter</h2>

      <div className="current-now">
        Current Time: <strong>{now}</strong>
        <button onClick={useCurrent} className="btn-small">Use Current</button>
      </div>

      <div className="converter-grid">
        <div className="input-field">
          <label>Timestamp</label>
          <div className="input-group">
            <input 
              type="text" 
              value={timestamp} 
              onChange={(e) => handleTimestampChange(e.target.value)}
              placeholder="e.g. 1708368000"
              className="proxy-input"
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="unit-select">
              <option value="s">Seconds</option>
              <option value="ms">Milliseconds</option>
            </select>
          </div>
        </div>

        <div className="arrow">↔</div>

        <div className="input-field">
          <label>Date (ISO/Local)</label>
          <input 
            type="text" 
            value={dateStr} 
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder="e.g. 2024-02-19 22:00:00"
            className="proxy-input"
          />
        </div>
      </div>

      <div className="examples">
        <p>Supported formats for date: <code>ISO 8601</code>, <code>YYYY-MM-DD HH:mm:ss</code>, <code>RFC 2822</code></p>
      </div>

      <style>{`
        .current-now {
          background: rgba(var(--primary-rgb), 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(var(--primary-rgb), 0.2);
        }
        .converter-grid {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .input-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-field label {
          font-weight: bold;
          font-size: 0.9rem;
          color: #aaa;
        }
        .arrow {
          font-size: 2rem;
          padding-top: 1.5rem;
          color: #666;
        }
        .unit-select {
          background: #333;
          color: white;
          border: 1px solid #444;
          padding: 0 0.5rem;
          border-radius: 0 4px 4px 0;
        }
        .input-group {
          display: flex;
        }
        .input-group input {
          border-radius: 4px 0 0 4px;
          flex: 1;
        }
        .btn-small {
          padding: 0.2rem 0.6rem;
          font-size: 0.8rem;
          background: #444;
          border: none;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-small:hover {
          background: #555;
        }
        .examples {
          font-size: 0.85rem;
          color: #888;
        }
      `}</style>
    </div>
  )
}

export default TimestampTool
