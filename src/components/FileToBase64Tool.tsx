import { useState } from 'react'
import type { FC } from 'react'

interface ConversionResult {
  base64: string
  dataUrl: string
  fileName: string
  mimeType: string
  size: number
}

const FileToBase64Tool: FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
      setError(null)
      setCopied(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
      setError(null)
      setCopied(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleConvert = async () => {
    if (!selectedFile) return

    setConverting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/file-to-base64/convert', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          base64: data.base64,
          dataUrl: data.dataUrl,
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.size,
        })
      } else {
        setError(data.error || 'Conversion failed')
      }
    } catch (e) {
      setError('Conversion failed')
    }

    setConverting(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.base64], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.fileName}.base64.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="tool-container">
      <h2>File to Base64 Converter</h2>

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          id="fileInput"
          onChange={handleFileSelect}
          className="file-input"
        />
        <label htmlFor="fileInput" className="drop-label">
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            {selectedFile ? (
              <>
                <strong>{selectedFile.name}</strong>
                <br />
                <span className="file-meta">
                  {formatSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                </span>
              </>
            ) : (
              <>
                Drop file here or click to browse
                <br />
                <span className="drop-hint">Supports any file type</span>
              </>
            )}
          </div>
        </label>
      </div>

      {selectedFile && (
        <div className="button-row">
          <button
            onClick={handleConvert}
            disabled={converting}
            className="btn-primary"
          >
            {converting ? 'Converting...' : 'Convert to Base64'}
          </button>
        </div>
      )}

      {error && (
        <div className="result error">
          {error}
        </div>
      )}

      {result && (
        <div className="conversion-result">
          <div className="result-header">
            <h3>Conversion Complete</h3>
            <div className="file-info-badge">
              {result.fileName} • {result.mimeType} • {formatSize(result.size)}
            </div>
          </div>

          <div className="output-sections">
            <div className="output-section">
              <div className="section-header">
                <h4>Base64 (plain)</h4>
                <div className="section-actions">
                  <button
                    onClick={() => handleCopy(result.base64)}
                    className="btn-small"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={handleDownload} className="btn-small">
                    Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={result.base64}
                rows={6}
                className="code-editor"
              />
            </div>

            <div className="output-section">
              <div className="section-header">
                <h4>Data URL</h4>
                <div className="section-actions">
                  <button
                    onClick={() => handleCopy(result.dataUrl)}
                    className="btn-small"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={result.dataUrl}
                rows={4}
                className="code-editor"
              />
            </div>
          </div>

          {result.mimeType.startsWith('image/') && (
            <div className="preview-section">
              <h4>Image Preview</h4>
              <img src={result.dataUrl} alt={result.fileName} className="image-preview" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileToBase64Tool
