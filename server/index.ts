import { dirname } from 'path'
import { loadConfig } from './config'

const config = loadConfig()
const PORT = config.app.port

// Check if we're running as server mode (via environment variable)
if (process.env.MST_SERVER_MODE === '1') {
  // Server mode: just import and run the server
  await import('./server-worker')
} else {
  // Launcher mode: start server subprocess + webview
  const { Webview, SizeHint } = await import('webview-bun')

  const basePath = dirname(process.execPath)

  // Start ourselves as server subprocess
  const serverProc = Bun.spawn([process.execPath], {
    cwd: basePath,
    stdout: 'ignore',
    stderr: 'ignore',
    stdin: 'ignore',
    env: { ...process.env, MST_SERVER_MODE: '1' },
  })

  // Wait for server to be ready by polling HTTP
  let ready = false
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/`)
      if (response.ok) {
        ready = true
        break
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 100))
  }

  if (!ready) {
    serverProc.kill()
    process.exit(1)
  }

  // Create webview
  const webview = new Webview(true)
  webview.title = 'My Simple Tools'
  webview.size = { width: 1280, height: 800, hint: SizeHint.NONE }
  webview.navigate(`http://localhost:${PORT}`)

  // Run webview (blocks until window is closed)
  webview.run()

  // Cleanup
  serverProc.kill()
  process.exit(0)
}
