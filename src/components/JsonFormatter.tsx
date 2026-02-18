import { useState, useRef } from 'react'
import type { FC } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FormatResult {
  success: boolean
  formatted?: string
  original?: string
  error?: string
}

const JsonFormatter: FC = () => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleScroll = () => {
    if (textareaRef.current) {
      setScrollTop((textareaRef.current as any).scrollTop)
      setScrollLeft((textareaRef.current as any).scrollLeft)
    }
  }

  const handleFormat = async () => {
    if (!input.trim()) {
      setError('Please enter JSON to format')
      return
    }

    try {
      const res = await fetch('/api/json/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          options: { indent, sortKeys }
        }),
      })
      const data = await res.json() as FormatResult

      if (data.success) {
        setInput(data.formatted || '')
        setError('')
      } else {
        setError(data.error || 'Failed to format JSON')
      }
    } catch (e) {
      setError('Failed to format JSON')
    }
  }

  const handleMinify = async () => {
    if (!input.trim()) {
      setError('Please enter JSON to minify')
      return
    }

    try {
      const res = await fetch('/api/json/minify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json() as FormatResult

      if (data.success) {
        setInput(data.formatted || '')
        setError('')
      } else {
        setError(data.error || 'Failed to minify JSON')
      }
    } catch (e) {
      setError('Failed to minify JSON')
    }
  }

  const displayJson = input || '// Paste your JSON here...'

  return (
    <div className="json-formatter-container">
      <div className="json-formatter-header">
        <h2>JSON Formatter</h2>

        <div className="json-options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys((e.target as any).checked)}
            />
            Sort keys
          </label>

          <div className="indent-selector">
            <label>Indent:</label>
            <select
              value={indent}
              onChange={(e) => setIndent(Number((e.target as any).value))}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>
        </div>
      </div>

      <div className="json-textarea-wrapper">
        <div className="json-editor-container">
          {/* Highlighted code in background */}
          <div
            ref={highlightRef}
            className="json-highlight"
            style={{
              transform: `translate(-${scrollLeft}px, -${scrollTop}px)`
            }}
          >
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                background: 'transparent',
                padding: '12px',
                margin: 0,
                fontFamily: "'Consolas', 'Monaco', monospace",
                fontSize: '0.9rem',
                lineHeight: '1.5',
                minHeight: '300px'
              }}
              codeTagProps={{
                style: {
                  fontFamily: "'Consolas', 'Monaco', monospace",
                  fontSize: '0.9rem'
                }
              }}
            >
              {displayJson}
            </SyntaxHighlighter>
          </div>

          {/* Transparent textarea for editing */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput((e.target as any).value)}
            onScroll={handleScroll}
            placeholder=""
            className="json-input-overlay"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      <div className="json-formatter-footer">
        {error && (
          <div className="result error">
            {error}
          </div>
        )}

        {!error && (
          <div className="status-spacer" />
        )}

        <div className="json-button-row">
          <button onClick={handleFormat} className="btn-primary">
            Format
          </button>
          <button onClick={handleMinify} className="btn-secondary">
            Minify
          </button>
        </div>
      </div>
    </div>
  )
}

export default JsonFormatter
