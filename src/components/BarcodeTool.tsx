import { useState, useEffect, useRef } from 'react'
import type { FC } from 'react'
import bwipjs from 'bwip-js'

const BarcodeTool: FC = () => {
  const [text, setText] = useState('')
  const [format, setFormat] = useState('qrcode')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !text) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      return
    }

    try {
      const options: any = {
        bcid: format,
        text: text,
        scale: 3,
      }
      
      if (format === 'code128') {
        options.height = 10
        options.includetext = true
        options.textxalign = 'center'
      }

      bwipjs.toCanvas(canvasRef.current, options)
    } catch (e) {
      console.error(e)
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [text, format])

  const downloadImage = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `barcode-${format}.png`
    link.href = url
    link.click()
  }

  return (
    <div className="tool-container">
      <h2>Barcode Generator</h2>
      
      <div className="barcode-content">
        <div className="input-group">
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            className="proxy-input"
            style={{ flex: '0 0 150px' }}
          >
            <option value="qrcode">QR Code</option>
            <option value="datamatrix">DataMatrix</option>
            <option value="code128">Code 128</option>
          </select>
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Text or URL to encode..."
            className="proxy-input"
            maxLength={format === 'code128' ? 40 : 2048}
          />
        </div>
        
        <div className="canvas-container">
          <canvas ref={canvasRef} id="mycanvas" />
        </div>
        <div className="group-buttons">
            <button onClick={downloadImage} className="btn-primary" disabled={!text}>
            Save as PNG
            </button>
        </div>
      </div>
      
      <style>{`
         .group-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .group-buttons button {
          min-width: 120px;
        }
        .barcode-content {
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          min-height: 200px;
        }
        .input-group {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        .input-group input {
          flex: 1;
        }
        .input-group input, .input-group select {
          font-family: inherit;
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          color: white;
        }
        .input-group input:focus, .input-group select:focus {
          outline: none;
          border-color: #646cff;
        }
        .input-group select option {
          background: #1a1a1a;
          color: white;
        }
      `}</style>
    </div>
  )
}

export default BarcodeTool
