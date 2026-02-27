import { useState, useRef } from 'react'
import type { FC } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const DocxToMdTool: FC = () => {
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeImages, setIncludeImages] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PREVIEW_LIMIT = 50000

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setMarkdown('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('includeImages', includeImages.toString())

    try {
      // Use a controller to handle potential long waits
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

      const response = await fetch('/api/docx/convert', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()
      if (result.success) {
        setMarkdown(result.markdown)
      } else {
        setError(result.error || 'Failed to convert file')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Conversion timed out after 60 seconds.')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const copyToClipboard = () => {
    if (!markdown) return
    navigator.clipboard.writeText(markdown)
      .then(() => alert('Full markdown copied to clipboard!'))
      .catch(err => setError('Failed to copy: ' + err.message))
  }

  const downloadMarkdown = () => {
    if (!markdown) return
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const displayMarkdown = markdown.length > PREVIEW_LIMIT
    ? markdown.substring(0, PREVIEW_LIMIT) + '\n\n... (preview truncated, download for full content) ...'
    : markdown

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>DOCX to Markdown</h2>
        <p>Upload a .docx file to convert it to Markdown format. <b>Note:</b> Large files may take a few seconds to process.</p>
      </div>

      <div className="tool-section">
        <div className="drop-zone" onClick={() => !loading && fileInputRef.current?.click()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx"
            style={{ display: 'none' }}
          />
          <div className="drop-label">
            <div className="drop-icon">{loading ? '⌛' : '📄'}</div>
            <div className="drop-text">
              {loading ? 'Converting large document (please wait)...' : 'Click or drag .docx file here to convert'}
            </div>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={includeImages}
            onChange={(e) => setIncludeImages(e.target.checked)}
            disabled={loading}
            style={{ cursor: 'pointer' }}
          />
          Include images (as data URI)
        </label>
      </div>

      {error && (
        <div className="result error" style={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      )}

      {markdown && (
        <div className="tool-section results-section">
          <div className="section-header">
            <h3>Markdown Preview {markdown.length > PREVIEW_LIMIT && `(First ${PREVIEW_LIMIT.toLocaleString()} chars)`}</h3>
            <div className="button-row" style={{ marginBottom: 0 }}>
              <button className="btn-secondary" onClick={copyToClipboard}>Copy Full</button>
              <button className="btn-primary" onClick={downloadMarkdown}>Download Full .md</button>
            </div>
          </div>
          <div className="json-display" style={{ padding: 0 }}>
            <SyntaxHighlighter
              language="markdown"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '8px',
                fontSize: '0.9rem',
                maxHeight: '500px',
                background: 'transparent'
              }}
            >
              {displayMarkdown}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocxToMdTool
