import { useState, useCallback } from 'react'
import type { FC } from 'react'

const GeneratorTool: FC = () => {
  const [uuid, setUuid] = useState('')
  const [password, setPassword] = useState('')
  const [passLength, setPassLength] = useState(16)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const generateUuid = useCallback(() => {
    setUuid(crypto.randomUUID())
  }, [])

  const generatePassword = useCallback(() => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let charset = lowercase
    if (includeUppercase) charset += uppercase
    if (includeNumbers) charset += numbers
    if (includeSymbols) charset += symbols

    let result = ''
    const array = new Uint32Array(passLength)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < passLength; i++) {
      result += charset[array[i] % charset.length]
    }
    setPassword(result)
  }, [passLength, includeSymbols, includeNumbers, includeUppercase])

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="tool-container">
      <h2>Generator</h2>
      
      <section className="generator-section">
        <h3>UUID (v4)</h3>
        <div className="input-group">
          <input 
            type="text" 
            value={uuid} 
            readOnly 
            placeholder="Generate a UUID..."
            className="proxy-input"
          />
          <button onClick={generateUuid} className="btn-primary">Generate</button>
          <button 
            onClick={() => copyToClipboard(uuid, 'uuid')} 
            className="btn-secondary"
            disabled={!uuid}
          >
            {copied === 'uuid' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>

      <section className="generator-section">
        <h3>Password / Secret Generator</h3>
        <div className="generator-options">
          <div className="option-row">
            <label>Length: {passLength}</label>
            <input 
              type="range" 
              min="8" 
              max="64" 
              value={passLength} 
              onChange={(e) => setPassLength(parseInt(e.target.value))}
            />
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={includeUppercase} 
                onChange={(e) => setIncludeUppercase(e.target.checked)} 
              />
              Uppercase (A-Z)
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={includeNumbers} 
                onChange={(e) => setIncludeNumbers(e.target.checked)} 
              />
              Numbers (0-9)
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={includeSymbols} 
                onChange={(e) => setIncludeSymbols(e.target.checked)} 
              />
              Symbols (!@#...)
            </label>
          </div>
        </div>
        <div className="input-group">
          <input 
            type="text" 
            value={password} 
            readOnly 
            placeholder="Generate a password..."
            className="proxy-input"
          />
          <button onClick={generatePassword} className="btn-primary">Generate</button>
          <button 
            onClick={() => copyToClipboard(password, 'pass')} 
            className="btn-secondary"
            disabled={!password}
          >
            {copied === 'pass' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>
      
      <style>{`
        .generator-section {
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 8px;
        }
        .generator-options {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .option-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .option-row input {
          flex: 1;
        }
        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .input-group {
          display: flex;
          gap: 0.5rem;
        }
        .input-group input {
          flex: 1;
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}

export default GeneratorTool
