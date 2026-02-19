import { serve } from 'bun'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

export interface ProxyRoute {
  id: string
  pathPrefix: string
  targetBaseUrl: string
  enabled: boolean
}

export interface ProxyLogEntry {
  id: string
  timestamp: number
  method: string
  path: string
  targetUrl: string
  status: number
  duration: number
  routeId: string
  requestHeaders?: Record<string, string>
  requestBody?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
}

interface ProxyState {
  server: ReturnType<typeof serve> | null
  port: number
  routes: ProxyRoute[]
  logs: ProxyLogEntry[]
  maxLogs: number
}

const state: ProxyState = {
  server: null,
  port: 8080,
  routes: [],
  logs: [],
  maxLogs: 200,
}

// ---- Persistence ----

interface ProxySettings {
  port: number
  routes: ProxyRoute[]
}

function getSettingsPath(): string {
  const devPath = join(process.cwd(), 'proxy-config.json')
  if (existsSync(devPath) || existsSync(join(process.cwd(), 'config.json'))) {
    return devPath
  }
  return join(dirname(process.execPath), 'proxy-config.json')
}

function loadSettings(): void {
  try {
    const p = getSettingsPath()
    if (existsSync(p)) {
      const raw = readFileSync(p, 'utf-8')
      const data = JSON.parse(raw) as ProxySettings
      if (data.port) state.port = data.port
      if (Array.isArray(data.routes)) state.routes = data.routes
    }
  } catch (e) {
    console.error('Error loading proxy settings:', e)
  }
}

function saveSettings(): void {
  try {
    const p = getSettingsPath()
    const data: ProxySettings = { port: state.port, routes: state.routes }
    writeFileSync(p, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error saving proxy settings:', e)
  }
}

// Load on startup
loadSettings()

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function addLog(entry: Omit<ProxyLogEntry, 'id'>): void {
  state.logs.unshift({ ...entry, id: generateId() })
  if (state.logs.length > state.maxLogs) {
    state.logs.length = state.maxLogs
  }
}

function getMatchPrefix(pathPrefix: string): string {
  // If prefix ends with *, strip it to get the actual match part
  if (pathPrefix.endsWith('*')) {
    return pathPrefix.slice(0, -1)
  }
  return pathPrefix
}

function isWildcard(pathPrefix: string): boolean {
  return pathPrefix.endsWith('*')
}

function findMatchingRoute(path: string): ProxyRoute | null {
  // Sort routes by match prefix length descending for most specific match
  const sorted = state.routes
    .filter(r => r.enabled)
    .sort((a, b) => getMatchPrefix(b.pathPrefix).length - getMatchPrefix(a.pathPrefix).length)

  for (const route of sorted) {
    const matchPart = getMatchPrefix(route.pathPrefix)

    if (isWildcard(route.pathPrefix)) {
      // Wildcard: match if path starts with the prefix part (before *)
      if (path.startsWith(matchPart)) {
        return route
      }
    } else {
      // Exact prefix: match with trailing slash normalization
      const prefix = matchPart.endsWith('/') ? matchPart : matchPart + '/'
      const normalizedPath = path.endsWith('/') ? path : path + '/'
      if (normalizedPath.startsWith(prefix) || path === matchPart) {
        return route
      }
    }
  }
  return null
}

function buildTargetUrl(route: ProxyRoute, originalPath: string): string {
  let baseUrl = route.targetBaseUrl
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }

  if (isWildcard(route.pathPrefix)) {
    // Wildcard route: forward the full original path as-is
    return baseUrl + originalPath
  }

  // Standard route: strip the prefix from the path
  const prefix = route.pathPrefix
  let remainingPath = originalPath.substring(prefix.length)
  if (!remainingPath.startsWith('/')) {
    remainingPath = '/' + remainingPath
  }

  return baseUrl + remainingPath
}

async function handleProxyRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname
  const startTime = Date.now()

  const route = findMatchingRoute(path)
  
  // Capture request headers
  const reqHeaders: Record<string, string> = {}
  req.headers.forEach((v, k) => reqHeaders[k] = v)

  if (!route) {
    addLog({
      timestamp: Date.now(),
      method: req.method,
      path,
      targetUrl: '',
      status: 404,
      duration: Date.now() - startTime,
      routeId: '',
      requestHeaders: reqHeaders,
    })
    return new Response(JSON.stringify({ error: 'No matching route for path: ' + path }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const targetUrl = buildTargetUrl(route, path) + url.search
  
  // Build headers, removing hop-by-hop headers
  const forwardHeaders = new Headers()
  const hopByHop = new Set([
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
  ])
  
  req.headers.forEach((value, key) => {
    if (!hopByHop.has(key.toLowerCase())) {
      forwardHeaders.set(key, value)
    }
  })

  // Add X-Forwarded headers
  forwardHeaders.set('X-Forwarded-For', '127.0.0.1')
  forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''))
  forwardHeaders.set('X-Forwarded-Host', url.host)

  try {
    const rawBody = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer()
    let reqBodyStr: string | undefined
    
    if (rawBody && rawBody.byteLength < 100000) { // Limit to 100KB for logging
      try {
        reqBodyStr = new TextDecoder().decode(rawBody)
      } catch (e) {
        reqBodyStr = `[Binary data: ${rawBody.byteLength} bytes]`
      }
    } else if (rawBody) {
      reqBodyStr = `[Body too large: ${rawBody.byteLength} bytes]`
    }

    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: rawBody ? rawBody : undefined,
    })

    const duration = Date.now() - startTime
    
    // Capture response headers
    const resHeaders: Record<string, string> = {}
    proxyRes.headers.forEach((v, k) => resHeaders[k] = v)

    const responseBody = await proxyRes.arrayBuffer()
    let resBodyStr: string | undefined
    
    if (responseBody.byteLength < 100000) {
      try {
        const contentType = resHeaders['content-type'] || ''
        if (contentType.includes('json') || contentType.includes('text') || contentType.includes('xml') || contentType.includes('javascript')) {
          resBodyStr = new TextDecoder().decode(responseBody)
        } else {
          resBodyStr = `[Binary data: ${responseBody.byteLength} bytes]`
        }
      } catch (e) {
        resBodyStr = `[Error decoding: ${responseBody.byteLength} bytes]`
      }
    } else {
      resBodyStr = `[Body too large: ${responseBody.byteLength} bytes]`
    }

    addLog({
      timestamp: Date.now(),
      method: req.method,
      path,
      targetUrl,
      status: proxyRes.status,
      duration,
      routeId: route.id,
      requestHeaders: reqHeaders,
      requestBody: reqBodyStr,
      responseHeaders: resHeaders,
      responseBody: resBodyStr,
    })

    // Forward response headers, removing hop-by-hop
    const responseHeaders = new Headers()
    proxyRes.headers.forEach((value, key) => {
      if (!hopByHop.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })
    // Allow CORS from our main app
    responseHeaders.set('Access-Control-Allow-Origin', '*')

    return new Response(responseBody, {
      status: proxyRes.status,
      statusText: proxyRes.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown proxy error'

    addLog({
      timestamp: Date.now(),
      method: req.method,
      path,
      targetUrl,
      status: 502,
      duration,
      routeId: route.id,
      requestHeaders: reqHeaders,
    })

    return new Response(JSON.stringify({ error: 'Proxy error: ' + errorMsg }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function repeatProxyRequest(logId: string): Promise<{ success: boolean; status?: number; error?: string; body?: string }> {
  const log = state.logs.find(l => l.id === logId)
  if (!log) return { success: false, error: 'Log entry not found' }

  try {
    const headers = new Headers()
    if (log.requestHeaders) {
      Object.entries(log.requestHeaders).forEach(([k, v]) => headers.set(k, v))
    }

    const res = await fetch(log.targetUrl, {
      method: log.method,
      headers,
      body: log.requestBody && !['GET', 'HEAD'].includes(log.method) ? log.requestBody : undefined,
    })

    const body = await res.text()
    return { success: true, status: res.status, body }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to repeat request'
    return { success: false, error: msg }
  }
}

// ---- Public API ----

export function getProxyStatus() {
  return {
    running: state.server !== null,
    port: state.port,
    routes: state.routes,
    logs: state.logs,
  }
}

export function setProxyPort(port: number): { success: boolean; error?: string } {
  if (state.server) {
    return { success: false, error: 'Stop the proxy before changing port' }
  }
  if (port < 1 || port > 65535) {
    return { success: false, error: 'Port must be between 1 and 65535' }
  }
  state.port = port
  saveSettings()
  return { success: true }
}

export function addProxyRoute(pathPrefix: string, targetBaseUrl: string): { success: boolean; route?: ProxyRoute; error?: string } {
  if (!pathPrefix.startsWith('/')) {
    return { success: false, error: 'Path prefix must start with /' }
  }
  if (!targetBaseUrl.startsWith('http://') && !targetBaseUrl.startsWith('https://')) {
    return { success: false, error: 'Target URL must start with http:// or https://' }
  }

  const route: ProxyRoute = {
    id: generateId(),
    pathPrefix,
    targetBaseUrl,
    enabled: true,
  }
  state.routes.push(route)
  saveSettings()
  return { success: true, route }
}

export function removeProxyRoute(routeId: string): { success: boolean; error?: string } {
  const idx = state.routes.findIndex(r => r.id === routeId)
  if (idx === -1) {
    return { success: false, error: 'Route not found' }
  }
  state.routes.splice(idx, 1)
  saveSettings()
  return { success: true }
}

export function editProxyRoute(routeId: string, pathPrefix: string, targetBaseUrl: string): { success: boolean; error?: string } {
  const route = state.routes.find(r => r.id === routeId)
  if (!route) {
    return { success: false, error: 'Route not found' }
  }
  if (!pathPrefix.startsWith('/')) {
    return { success: false, error: 'Path prefix must start with /' }
  }
  if (!targetBaseUrl.startsWith('http://') && !targetBaseUrl.startsWith('https://')) {
    return { success: false, error: 'Target URL must start with http:// or https://' }
  }
  route.pathPrefix = pathPrefix
  route.targetBaseUrl = targetBaseUrl
  saveSettings()
  return { success: true }
}

export function toggleProxyRoute(routeId: string): { success: boolean; error?: string } {
  const route = state.routes.find(r => r.id === routeId)
  if (!route) {
    return { success: false, error: 'Route not found' }
  }
  route.enabled = !route.enabled
  saveSettings()
  return { success: true }
}

export function startProxy(): { success: boolean; error?: string } {
  if (state.server) {
    return { success: false, error: 'Proxy is already running' }
  }
  if (state.routes.length === 0) {
    return { success: false, error: 'Add at least one route before starting' }
  }

  try {
    state.server = serve({
      port: state.port,
      hostname: '0.0.0.0',
      fetch: handleProxyRequest,
    })
    console.log(`Proxy server started on port ${state.port}`)
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to start proxy'
    return { success: false, error: msg }
  }
}

export function stopProxy(): { success: boolean; error?: string } {
  if (!state.server) {
    return { success: false, error: 'Proxy is not running' }
  }

  try {
    state.server.stop(true)
    state.server = null
    console.log('Proxy server stopped')
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to stop proxy'
    return { success: false, error: msg }
  }
}

export function clearProxyLogs(): void {
  state.logs = []
}
