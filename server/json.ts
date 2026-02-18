export interface FormatOptions {
  indent: number
  sortKeys: boolean
}

export interface FormatResult {
  success: boolean
  formatted?: string
  original?: string
  error?: string
}

export function formatJson(input: string, options: FormatOptions = { indent: 2, sortKeys: false }): FormatResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return { success: false, error: 'Input is empty' }
  }

  try {
    const parsed = JSON.parse(trimmed)

    let obj = parsed
    if (options.sortKeys) {
      obj = sortObjectKeys(parsed)
    }

    const formatted = JSON.stringify(obj, null, options.indent)

    return {
      success: true,
      formatted,
      original: trimmed
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Invalid JSON'
    }
  }
}

export function minifyJson(input: string): FormatResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return { success: false, error: 'Input is empty' }
  }

  try {
    const parsed = JSON.parse(trimmed)
    const minified = JSON.stringify(parsed)

    return {
      success: true,
      formatted: minified,
      original: trimmed
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Invalid JSON'
    }
  }
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }

  const sorted: Record<string, unknown> = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
  }
  return sorted
}
