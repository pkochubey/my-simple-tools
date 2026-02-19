import { useState, useEffect } from 'react'
import type { FC } from 'react'
import cronstrue from 'cronstrue'

const CronTool: FC = () => {
  const [cron, setCron] = useState('*/15 8-17 * * *')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!cron.trim()) {
      setExplanation('')
      setError('')
      return
    }

    try {
      const result = cronstrue.toString(cron, { use24HourTimeFormat: true })
      setExplanation(result)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid cron expression')
      setExplanation('')
    }
  }, [cron])

  const examples = [
    { label: 'Every 15 mins (business hours)', value: '*/15 8-17 * * *' },
    { label: 'Every midnight', value: '0 0 * * *' },
    { label: 'Every Monday at 9AM', value: '0 9 * * 1' },
    { label: 'First day of month', value: '0 0 1 * *' },
    { label: 'Complex example', value: '0 0 1,15 * 1-5' },
  ]

  return (
    <div className="tool-container">
      <h2>Cron Expression Explainer</h2>

      <div className="cron-input-section">
        <label>Enter Cron Expression:</label>
        <input 
          type="text" 
          value={cron} 
          onChange={(e) => setCron((e.target as HTMLInputElement).value)}
          placeholder="* * * * *"
          className="proxy-input"
        />
      </div>

      <div className={`explanation-card ${error ? 'error' : ''}`}>
        {error ? (
          <div className="error-text">
            <span>⚠️</span> {error}
          </div>
        ) : explanation ? (
          <div className="success-text">
            <h3>Description</h3>
            <p>{explanation}</p>
          </div>
        ) : (
          <p className="placeholder">Enter a valid cron expression to see the explanation</p>
        )}
      </div>

      <div className="cron-examples">
        <h3>Common Examples</h3>
        <div className="example-chips">
          {examples.map((ex, i) => (
            <button key={i} onClick={() => setCron(ex.value)} className="chip">
              <span className="chip-label">{ex.label}</span>
              <code>{ex.value}</code>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .cron-input-section {
          margin-bottom: 2rem;
        }
        .cron-input {
          font-family: 'Consolas', monospace;
          font-size: 1.5rem !important;
          text-align: center;
          padding: 1rem !important;
          letter-spacing: 2px;
        }
        .explanation-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 2rem;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .explanation-card.error {
          border-color: rgba(255, 80, 80, 0.3);
          background: rgba(255, 80, 80, 0.05);
        }
        .success-text h3 {
          margin-top: 0;
          color: #aaa;
          font-size: 0.9rem;
          text-transform: uppercase;
        }
        .success-text p {
          font-size: 1.25rem;
          color: #fff;
          margin-bottom: 0;
        }
        .error-text {
          color: #ff6b6b;
        }
        .placeholder {
          color: #666;
        }
        .cron-examples h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .example-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .chip {
          background: #333;
          border: 1px solid #444;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.2s;
        }
        .chip:hover {
          background: #444;
          border-color: #555;
        }
        .chip-label {
          font-size: 0.75rem;
          color: #aaa;
          margin-bottom: 2px;
        }
        .chip code {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  )
}

export default CronTool
