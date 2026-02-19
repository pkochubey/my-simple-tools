import { serve } from 'bun'
import { join, dirname, extname } from 'path'
import { existsSync } from 'fs'
import { loadConfig, saveConfig, type Config } from './config'
import { readXrayConfig, writeXrayConfig, testSSHConnection, xkeenAction } from './ssh'
import { decodeJWT } from './jwt'
import { convertBase64ToFile, extractBase64FromText, detectFileFormat, convertFileToBase64 } from './base64'
import { formatJson, minifyJson, type FormatOptions } from './json'
import { getProxyStatus, setProxyPort, addProxyRoute, removeProxyRoute, editProxyRoute, toggleProxyRoute, startProxy, stopProxy, clearProxyLogs, repeatProxyRequest } from './proxy'

const config = loadConfig()
const PORT = config.app.port

function getFrontendPath(): string {
  const devPath = join(process.cwd(), 'dist', 'frontend')
  if (existsSync(devPath)) {
    return devPath
  }
  const basePath = dirname(process.execPath)
  const prodPath1 = join(basePath, 'frontend')
  if (existsSync(prodPath1)) {
    return prodPath1
  }
  return join(basePath, 'dist', 'frontend')
}

function getMimeType(path: string): string {
  const ext = extname(path).slice(1).toLowerCase()
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

const frontendPath = getFrontendPath()

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname

  if (path.startsWith('/api/')) {
    return handleAPI(req, path)
  }

  return serveStatic(path)
}

async function handleAPI(req: Request, path: string): Promise<Response> {
  const method = req.method

  try {
    if (path === '/api/config' && method === 'GET') {
      const cfg = loadConfig()
      return Response.json({ success: true, config: cfg })
    }

    if (path === '/api/config' && method === 'POST') {
      const body = await req.json()
      saveConfig(body as Config)
      return Response.json({ success: true })
    }

    if (path === '/api/jwt/decode' && method === 'POST') {
      const body = await req.json() as { token: string }
      const result = decodeJWT(body.token)
      return Response.json(result)
    }

    if (path === '/api/base64/extract' && method === 'POST') {
      const body = await req.json() as { text: string }
      const extracted = extractBase64FromText(body.text)
      const withFormats = extracted.map(b64 => ({
        base64: b64,
        detectedFormat: detectFileFormat(b64)
      }))
      return Response.json({ success: true, items: withFormats })
    }

    if (path === '/api/base64/convert' && method === 'POST') {
      const body = await req.json() as { base64: string; format: string; fileName?: string }
      const result = convertBase64ToFile(body.base64, body.format, body.fileName)
      return Response.json(result)
    }

    if (path === '/api/file-to-base64/convert' && method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) {
        return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = convertFileToBase64(buffer, file.name)
      return Response.json(result)
    }

    if (path === '/api/ssh/test' && method === 'POST') {
      const result = await testSSHConnection()
      return Response.json(result)
    }

    if (path === '/api/xray/read' && method === 'GET') {
      const result = await readXrayConfig()
      return Response.json(result)
    }

    if (path === '/api/xray/write' && method === 'POST') {
      const body = await req.json() as { content: string }
      const result = await writeXrayConfig(body.content)
      return Response.json(result)
    }

    if (path === '/api/xkeen' && method === 'POST') {
      const body = await req.json() as { action: 'start' | 'stop' | 'restart' }
      const result = await xkeenAction(body.action)
      return Response.json(result)
    }

    // Proxy tool endpoints
    if (path === '/api/proxy/status' && method === 'GET') {
      return Response.json({ success: true, ...getProxyStatus() })
    }

    if (path === '/api/proxy/port' && method === 'POST') {
      const body = await req.json() as { port: number }
      const result = setProxyPort(body.port)
      return Response.json(result)
    }

    if (path === '/api/proxy/route' && method === 'POST') {
      const body = await req.json() as { pathPrefix: string; targetBaseUrl: string }
      const result = addProxyRoute(body.pathPrefix, body.targetBaseUrl)
      return Response.json(result)
    }

    if (path === '/api/proxy/route' && method === 'DELETE') {
      const body = await req.json() as { routeId: string }
      const result = removeProxyRoute(body.routeId)
      return Response.json(result)
    }

    if (path === '/api/proxy/route' && method === 'PUT') {
      const body = await req.json() as { routeId: string; pathPrefix: string; targetBaseUrl: string }
      const result = editProxyRoute(body.routeId, body.pathPrefix, body.targetBaseUrl)
      return Response.json(result)
    }

    if (path === '/api/proxy/route/toggle' && method === 'POST') {
      const body = await req.json() as { routeId: string }
      const result = toggleProxyRoute(body.routeId)
      return Response.json(result)
    }

    if (path === '/api/proxy/start' && method === 'POST') {
      const result = startProxy()
      return Response.json(result)
    }

    if (path === '/api/proxy/stop' && method === 'POST') {
      const result = stopProxy()
      return Response.json(result)
    }

    if (path === '/api/proxy/logs/clear' && method === 'POST') {
      clearProxyLogs()
      return Response.json({ success: true })
    }

    if (path === '/api/proxy/repeat' && method === 'POST') {
      const body = await req.json() as { logId: string }
      const result = await repeatProxyRequest(body.logId)
      return Response.json(result)
    }

    // JSON Formatter endpoints
    if (path === '/api/json/format' && method === 'POST') {
      const body = await req.json() as { input: string; options?: FormatOptions }
      const result = formatJson(body.input, body.options)
      return Response.json(result)
    }

    if (path === '/api/json/minify' && method === 'POST') {
      const body = await req.json() as { input: string }
      const result = minifyJson(body.input)
      return Response.json(result)
    }

    return Response.json({ success: false, error: 'Unknown API endpoint' }, { status: 404 })
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function serveStatic(path: string): Response {
  let filePath: string
  if (path === '/' || path === '') {
    filePath = join(frontendPath, 'index.html')
  } else {
    filePath = join(frontendPath, path.slice(1))
  }

  if (!existsSync(filePath)) {
    filePath = join(frontendPath, 'index.html')
    if (!existsSync(filePath)) {
      return new Response('Frontend not found', { status: 404 })
    }
  }

  const file = Bun.file(filePath)
  const mimeType = getMimeType(filePath)
  return new Response(file, { headers: { 'Content-Type': mimeType } })
}

const server = serve({
  port: PORT,
  fetch: handleRequest,
  hostname: '127.0.0.1',
})

console.log(`Server started on port ${PORT}`)
