import { Client } from 'ssh2'
import { loadConfig } from './config'

export interface SSHResult {
  success: boolean
  data?: string
  error?: string
}

function execSSH(cmd: string): Promise<SSHResult> {
  return new Promise((resolve) => {
    const config = loadConfig()
    const conn = new Client()

    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end()
          resolve({ success: false, error: err.message })
          return
        }
        let stdout = ''
        let stderr = ''
        stream.on('close', () => {
          conn.end()
          resolve(stderr ? { success: false, error: stderr } : { success: true, data: stdout })
        }).on('data', (chunk: Buffer) => {
          stdout += chunk.toString()
        }).stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString()
        })
      })
    }).on('error', (err) => {
      resolve({ success: false, error: err.message })
    }).connect({
      host: config.ssh.host,
      port: config.ssh.port,
      username: config.ssh.username,
      password: config.ssh.password,
      readyTimeout: 10000,
    })
  })
}

export function readXrayConfig(): Promise<SSHResult> {
  const { ssh } = loadConfig()
  return execSSH(`cat ${ssh.configPath}`)
}

export function writeXrayConfig(content: string): Promise<SSHResult> {
  const { ssh } = loadConfig()
  const escapedContent = content.replace(/'/g, "'\\''")
  return execSSH(`echo '${escapedContent}' | cat > ${ssh.configPath}`)
}

export function testSSHConnection(): Promise<SSHResult> {
  return new Promise((resolve) => {
    const config = loadConfig()
    const conn = new Client()

    conn.on('ready', () => {
      conn.end()
      resolve({ success: true, data: 'Connection successful' })
    }).on('error', (err) => {
      resolve({ success: false, error: err.message })
    }).connect({
      host: config.ssh.host,
      port: config.ssh.port,
      username: config.ssh.username,
      password: config.ssh.password,
      readyTimeout: 10000,
    })
  })
}

export function xkeenAction(action: 'start' | 'stop' | 'restart'): Promise<SSHResult> {
  const command = `xkeen -${action}`
  return execSSH(command)
}
