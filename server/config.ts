import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface ToolConfig {
  enabled: boolean
  label: string
  icon: string
}

export interface ToolsConfig {
  base64: ToolConfig
  jwt: ToolConfig
  xray: ToolConfig
  proxy: ToolConfig
}

export interface SSHConfig {
  host: string
  port: number
  username: string
  password: string
  configPath: string
}

export interface AppConfig {
  port: number
  openBrowser: boolean
}

export interface Base64Config {
  defaultOutputDir: string
  rememberLastFormat: boolean
  lastUsedFormat: string
}

export interface Config {
  tools: ToolsConfig
  ssh: SSHConfig
  app: AppConfig
  base64: Base64Config
}

function getConfigPath(): string {
  const devPath = join(process.cwd(), 'config.json')
  if (existsSync(devPath)) {
    return devPath
  }
  return join(process.execPath, '..', 'config.json')
}

export function loadConfig(): Config {
  try {
    const configPath = getConfigPath()
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content)

      // Override password from env if not set in config
      if (!config.ssh?.password && process.env.SSH_PASSWORD) {
        config.ssh = config.ssh || {}
        config.ssh.password = process.env.SSH_PASSWORD
      }

      return config
    }
  } catch (e) {
    console.error('Error loading config:', e)
  }

  return getDefaultConfig()
}

export function getDefaultConfig(): Config {
  return {
    tools: {
      base64: { enabled: true, label: 'Base64', icon: '📄' },
      jwt: { enabled: true, label: 'JWT Decoder', icon: '🔑' },
      xray: { enabled: true, label: 'XRay Config', icon: '⚙️' }
    },
    ssh: {
      host: '192.168.1.1',
      port: 222,
      username: 'root',
      password: process.env.SSH_PASSWORD || '',
      configPath: '/opt/etc/xray/configs/05_routing.json'
    },
    app: {
      port: 3000,
      openBrowser: true
    },
    base64: {
      defaultOutputDir: './output',
      rememberLastFormat: true,
      lastUsedFormat: 'bin'
    }
  }
}

export function saveConfig(config: Config): void {
  try {
    const configPath = getConfigPath()
    writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {
    console.error('Error saving config:', e)
  }
}
