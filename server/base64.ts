import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { loadConfig } from './config'

export interface Base64Result {
  success: boolean
  filePath?: string
  error?: string
  detectedFormat?: string
}

const FORMAT_SIGNATURES: Record<string, number[][]> = {
  'png': [[0x89, 0x50, 0x4E, 0x47]],
  'jpg': [[0xFF, 0xD8, 0xFF]],
  'jpeg': [[0xFF, 0xD8, 0xFF]],
  'gif': [[0x47, 0x49, 0x46, 0x38]],
  'pdf': [[0x25, 0x50, 0x44, 0x46]],
  'zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  'rar': [[0x52, 0x61, 0x72, 0x21]],
  'exe': [[0x4D, 0x5A]],
  'mp3': [[0xFF, 0xFB], [0x49, 0x44, 0x33]],
  'mp4': [[0x66, 0x74, 0x79, 0x70]],
  'webp': [[0x52, 0x49, 0x46, 0x46]],
  'ico': [[0x00, 0x00, 0x01, 0x00]],
  'svg': [[0x3C, 0x3F, 0x78, 0x6D, 0x6C], [0x3C, 0x73, 0x76, 0x67]],
}

export function detectFileFormat(base64Data: string): string | null {
  try {
    const cleanBase64 = base64Data.replace(/\s/g, '').split(',').pop() || base64Data
    const buffer = Buffer.from(cleanBase64, 'base64')

    for (const [format, signatures] of Object.entries(FORMAT_SIGNATURES)) {
      for (const sig of signatures) {
        if (buffer.length >= sig.length) {
          const match = sig.every((byte, i) => buffer[i] === byte)
          if (match) return format
        }
      }
    }

    return null
  } catch {
    return null
  }
}

export function extractBase64FromText(text: string): string[] {
  const results: string[] = []

  const jsonBase64Pattern = /"(?:data|base64|content|file|image|document)":\s*"(data:[^"]+;base64,[^"]+|[A-Za-z0-9+/=]{20,})"/gi
  let match
  while ((match = jsonBase64Pattern.exec(text)) !== null) {
    if (match[1]) results.push(match[1])
  }

  const standalonePattern = /\b[A-Za-z0-9+/]{20,}={0,2}\b/g
  while ((match = standalonePattern.exec(text)) !== null) {
    if (!results.includes(match[0])) {
      results.push(match[0])
    }
  }

  const dataUrlPattern = /data:[^;]+;base64,[A-Za-z0-9+/=]+/gi
  while ((match = dataUrlPattern.exec(text)) !== null) {
    if (!results.includes(match[0])) {
      results.push(match[0])
    }
  }

  return results
}

export function convertBase64ToFile(
  base64Data: string,
  outputFormat: string,
  customFileName?: string
): Base64Result {
  try {
    const config = loadConfig()
    const outputDir = config.base64.defaultOutputDir

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    let cleanBase64 = base64Data.trim()
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1] ?? cleanBase64
    } else if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1] ?? cleanBase64
    }

    cleanBase64 = cleanBase64.replace(/\s/g, '')

    const buffer = Buffer.from(cleanBase64, 'base64')

    const detectedFormat = detectFileFormat(base64Data)
    const finalFormat = outputFormat || detectedFormat || 'bin'

    const timestamp = Date.now()
    const fileName = customFileName || `converted_${timestamp}.${finalFormat}`
    const filePath = join(outputDir, fileName)

    writeFileSync(filePath, buffer)

    return {
      success: true,
      filePath,
      detectedFormat: detectedFormat || undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export interface FileToBase64Result {
  success: boolean
  base64?: string
  dataUrl?: string
  fileName?: string
  mimeType?: string
  size?: number
  error?: string
}

export function convertFileToBase64(buffer: Buffer, fileName: string): FileToBase64Result {
  try {
    const base64 = buffer.toString('base64')

    const ext = extname(fileName).slice(1).toLowerCase()
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'zip': 'application/zip',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return {
      success: true,
      base64,
      dataUrl,
      fileName,
      mimeType,
      size: buffer.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
