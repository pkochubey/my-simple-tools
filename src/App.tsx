import { useState, useEffect } from 'react'
import type { FC } from 'react'
import Base64Tool from './components/Base64Tool'
import FileToBase64Tool from './components/FileToBase64Tool'
import JwtTool from './components/JwtTool'
import JsonFormatter from './components/JsonFormatter'
import XrayConfig from './components/XrayConfig'
import ProxyTool from './components/ProxyTool'
import GeneratorTool from './components/GeneratorTool'
import TimestampTool from './components/TimestampTool'
import CronTool from './components/CronTool'
import BarcodeTool from './components/BarcodeTool'
import DocxToMdTool from './components/DocxToMdTool'
import Updater from './components/Updater'

type Tab = 'base64' | 'fileToBase64' | 'jwt' | 'jsonFormatter' | 'xray' | 'proxy' | 'generator' | 'timestamp' | 'cron' | 'barcode' | 'docxToMd'

interface ToolConfig {
  enabled: boolean
  label: string
  icon: string
}

interface Config {
  tools: {
    base64: ToolConfig
    fileToBase64: ToolConfig
    jwt: ToolConfig
    jsonFormatter: ToolConfig
    xray: ToolConfig
    proxy: ToolConfig
    generator: ToolConfig
    timestamp: ToolConfig
    cron: ToolConfig
    barcode: ToolConfig
    docxToMd: ToolConfig
  }
}

const App: FC = () => {
  const [config, setConfig] = useState<Config | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('base64')

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        const configData = data as { success: boolean; config: Config }
        if (configData.success && configData.config) {
          setConfig(configData.config)
          // Set first enabled tab as active
          const tools = configData.config.tools
          if (tools.base64?.enabled) setActiveTab('base64')
          else if (tools.fileToBase64?.enabled) setActiveTab('fileToBase64')
          else if (tools.jwt?.enabled) setActiveTab('jwt')
          else if (tools.jsonFormatter?.enabled) setActiveTab('jsonFormatter')
          else if (tools.xray?.enabled) setActiveTab('xray')
          else if (tools.proxy?.enabled) setActiveTab('proxy')
          else if (tools.generator?.enabled) setActiveTab('generator')
          else if (tools.timestamp?.enabled) setActiveTab('timestamp')
          else if (tools.cron?.enabled) setActiveTab('cron')
          else if (tools.barcode?.enabled) setActiveTab('barcode')
          else if (tools.docxToMd?.enabled) setActiveTab('docxToMd')
        }
      })
      .catch(() => {
        // Use defaults if config fails to load
        setConfig({
          tools: {
            base64: { enabled: true, label: 'Base64 to File', icon: '📄' },
            fileToBase64: { enabled: true, label: 'File to Base64', icon: '📁' },
            jwt: { enabled: true, label: 'JWT Decoder', icon: '🔑' },
            jsonFormatter: { enabled: true, label: 'JSON Formatter', icon: '📝' },
            xray: { enabled: true, label: 'XRay Config', icon: '⚙️' },
            proxy: { enabled: true, label: 'Proxy', icon: '🔀' },
            generator: { enabled: true, label: 'Generator', icon: '🎲' },
            timestamp: { enabled: true, label: 'Timestamp', icon: '🕒' },
            cron: { enabled: true, label: 'Cron Explainer', icon: '📅' },
            barcode: { enabled: true, label: 'Barcode', icon: '🔲' },
            docxToMd: { enabled: true, label: 'DOCX to MD', icon: '📝' }
          }
        })
      })
  }, [])

  if (!config) {
    return <div className="loading">Loading...</div>
  }

  const tools = config.tools

  return (
    <>
      <Updater />
      <div className="app">
        <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Tools</h1>
        </div>
        <nav className="sidebar-nav">
          {tools.base64?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'base64' ? 'active' : ''}`}
              onClick={() => setActiveTab('base64')}
            >
              <span className="tab-icon">{tools.base64.icon || '📄'}</span>
              <span className="tab-label">{tools.base64.label || 'Base64'}</span>
            </button>
          )}
          {tools.fileToBase64?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'fileToBase64' ? 'active' : ''}`}
              onClick={() => setActiveTab('fileToBase64')}
            >
              <span className="tab-icon">{tools.fileToBase64.icon || '📁'}</span>
              <span className="tab-label">{tools.fileToBase64.label || 'File to Base64'}</span>
            </button>
          )}
          {tools.jwt?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'jwt' ? 'active' : ''}`}
              onClick={() => setActiveTab('jwt')}
            >
              <span className="tab-icon">{tools.jwt.icon || '🔑'}</span>
              <span className="tab-label">{tools.jwt.label || 'JWT Decoder'}</span>
            </button>
          )}
          {tools.jsonFormatter?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'jsonFormatter' ? 'active' : ''}`}
              onClick={() => setActiveTab('jsonFormatter')}
            >
              <span className="tab-icon">{tools.jsonFormatter.icon || '📝'}</span>
              <span className="tab-label">{tools.jsonFormatter.label || 'JSON Formatter'}</span>
            </button>
          )}
          {tools.xray?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'xray' ? 'active' : ''}`}
              onClick={() => setActiveTab('xray')}
            >
              <span className="tab-icon">{tools.xray.icon || '⚙️'}</span>
              <span className="tab-label">{tools.xray.label || 'XRay Config'}</span>
            </button>
          )}
          {tools.proxy?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'proxy' ? 'active' : ''}`}
              onClick={() => setActiveTab('proxy')}
            >
              <span className="tab-icon">{tools.proxy.icon || '🔀'}</span>
              <span className="tab-label">{tools.proxy.label || 'Proxy'}</span>
            </button>
          )}
          {tools.generator?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <span className="tab-icon">{tools.generator.icon || '🎲'}</span>
              <span className="tab-label">{tools.generator.label || 'Generator'}</span>
            </button>
          )}
          {tools.timestamp?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'timestamp' ? 'active' : ''}`}
              onClick={() => setActiveTab('timestamp')}
            >
              <span className="tab-icon">{tools.timestamp.icon || '🕒'}</span>
              <span className="tab-label">{tools.timestamp.label || 'Timestamp'}</span>
            </button>
          )}
          {tools.cron?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'cron' ? 'active' : ''}`}
              onClick={() => setActiveTab('cron')}
            >
              <span className="tab-icon">{tools.cron.icon || '📅'}</span>
              <span className="tab-label">{tools.cron.label || 'Cron'}</span>
            </button>
          )}
          {tools.barcode?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'barcode' ? 'active' : ''}`}
              onClick={() => setActiveTab('barcode')}
            >
              <span className="tab-icon">{tools.barcode.icon || '🔲'}</span>
              <span className="tab-label">{tools.barcode.label || 'Barcode'}</span>
            </button>
          )}
          {tools.docxToMd?.enabled && (
            <button
              className={`sidebar-tab ${activeTab === 'docxToMd' ? 'active' : ''}`}
              onClick={() => setActiveTab('docxToMd')}
            >
              <span className="tab-icon">{tools.docxToMd.icon || '📝'}</span>
              <span className="tab-label">{tools.docxToMd.label || 'DOCX to MD'}</span>
            </button>
          )}
        </nav>
      </aside>

      <main className={`main-content ${activeTab === 'jsonFormatter' ? 'full-height' : ''}`}>
        {activeTab === 'base64' && tools.base64?.enabled && <Base64Tool />}
        {activeTab === 'fileToBase64' && tools.fileToBase64?.enabled && <FileToBase64Tool />}
        {activeTab === 'jwt' && tools.jwt?.enabled && <JwtTool />}
        {activeTab === 'jsonFormatter' && tools.jsonFormatter?.enabled && <JsonFormatter />}
        {activeTab === 'xray' && tools.xray?.enabled && <XrayConfig />}
        {activeTab === 'proxy' && tools.proxy?.enabled && <ProxyTool />}
        {activeTab === 'generator' && tools.generator?.enabled && <GeneratorTool />}
        {activeTab === 'timestamp' && tools.timestamp?.enabled && <TimestampTool />}
        {activeTab === 'cron' && tools.cron?.enabled && <CronTool />}
        {activeTab === 'barcode' && tools.barcode?.enabled && <BarcodeTool />}
        {activeTab === 'docxToMd' && tools.docxToMd?.enabled && <DocxToMdTool />}
      </main>
      </div>
    </>
  )
}

export default App
