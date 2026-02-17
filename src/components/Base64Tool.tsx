import { useState } from 'react'
import type { FC } from 'react'

interface ExtractedItem {
  base64: string
  detectedFormat: string | null
}

const Base64Tool: FC = () => {
  const [inputText, setInputText] = useState('')
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [selectedFormat, setSelectedFormat] = useState('bin')
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const formats = [
    { value: 'bin', label: 'Binary (.bin)' },
    { value: 'png', label: 'PNG Image (.png)' },
    { value: 'jpg', label: 'JPEG Image (.jpg)' },
    { value: 'gif', label: 'GIF Image (.gif)' },
    { value: 'pdf', label: 'PDF Document (.pdf)' },
    { value: 'zip', label: 'ZIP Archive (.zip)' },
    { value: 'json', label: 'JSON (.json)' },
    { value: 'txt', label: 'Text (.txt)' },
    { value: 'exe', label: 'Executable (.exe)' },
    { value: 'mp3', label: 'MP3 Audio (.mp3)' },
    { value: 'mp4', label: 'MP4 Video (.mp4)' },
  ]

  const handleExtract = async () => {
    try {
      const res = await fetch('/api/base64/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      const data = await res.json()
      if (data.success) {
        setExtractedItems(data.items)
        setResult(null)
      }
    } catch (e) {
      setResult({ success: false, message: 'Failed to extract base64' })
    }
  }

  const handleConvert = async (item: ExtractedItem) => {
    setConverting(true)
    setResult(null)

    try {
      const res = await fetch('/api/base64/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: item.base64,
          format: item.detectedFormat || selectedFormat,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: `File saved to: ${data.filePath}`,
        })
      } else {
        setResult({ success: false, message: data.error || 'Conversion failed' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Conversion failed' })
    }

    setConverting(false)
  }

  return (
    <div className="tool-container">
      <h2>Base64 to File Converter</h2>

      <div className="form-group">
        <label>Input Text (JSON or raw base64):</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste JSON, base64 string, or text containing base64..."
          rows={8}
        />
      </div>

      <div className="button-row">
        <button onClick={handleExtract} className="btn-primary">
          Extract Base64
        </button>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="format-select"
        >
          {formats.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {extractedItems.length > 0 && (
        <div className="extracted-list">
          <h3>Found {extractedItems.length} item(s):</h3>
          {extractedItems.map((item, index) => (
            <div key={index} className="extracted-item">
              <div className="item-info">
                <span className="item-index">#{index + 1}</span>
                <span className="item-preview">
                  {item.base64.substring(0, 50)}...
                </span>
                {item.detectedFormat && (
                  <span className="detected-format">
                    Detected: {item.detectedFormat.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleConvert(item)}
                disabled={converting}
                className="btn-secondary"
              >
                Convert
              </button>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}

export default Base64Tool
