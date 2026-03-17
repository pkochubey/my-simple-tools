import { useState } from 'react'
import type { FC } from 'react'

interface CsvResult {
  success: boolean
  csv?: string
  error?: string
}

const JsonToCsvTool: FC = () => {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [result, setResult] = useState<CsvResult | null>(null)
  const [loading, setLoading] = useState(false)

  const delimiters = [
    { value: ',', label: 'Comma (,)' },
    { value: ';', label: 'Semicolon (;)' },
    { value: '\t', label: 'Tab (\\t)' },
  ]

  const handleConvert = async () => {
    if (!input.trim()) {
      setResult({ success: false, error: 'Please enter JSON array' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/json/to-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, delimiter }),
      })
      const data = await res.json() as CsvResult
      setResult(data)
    } catch (e) {
      setResult({ success: false, error: 'Failed to convert JSON to CSV' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result?.csv) return
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    if (!result?.csv) return
    navigator.clipboard.writeText(result.csv)
  }

  return (
    <div className="tool-container">
      <h2>JSON Array to CSV Converter</h2>

      <div className="form-group">
        <label>Input JSON Array of Objects:</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
          rows={10}
          className="mono-text"
        />
      </div>

      <div className="button-row">
        <div className="delimiter-selector">
          <label>Delimiter:</label>
          <select 
            value={delimiter} 
            onChange={(e) => setDelimiter(e.target.value)}
            className="format-select"
            style={{ marginLeft: '10px' }}
          >
            {delimiters.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleConvert} 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Converting...' : 'Convert to CSV'}
        </button>
      </div>

      {result && !result.success && (
        <div className="result error">
          {result.error}
        </div>
      )}

      {result && result.success && (
        <div className="csv-result-container">
          <div className="result success">
            Successfully converted to CSV!
          </div>
          
          <div className="form-group">
            <label>Result CSV:</label>
            <textarea
              value={result.csv}
              readOnly
              rows={10}
              className="mono-text"
            />
          </div>

          <div className="button-row">
            <button onClick={handleDownload} className="btn-secondary">
              Download CSV
            </button>
            <button onClick={handleCopy} className="btn-secondary">
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JsonToCsvTool
