export interface JWTDecoded {
  success: boolean
  header?: Record<string, unknown>
  payload?: Record<string, unknown>
  signature?: string
  error?: string
  expired?: boolean
  expiresAt?: string
  issuedAt?: string
}

export function decodeJWT(token: string): JWTDecoded {
  try {
    const parts = token.trim().split('.')

    if (parts.length !== 3) {
      return {
        success: false,
        error: 'Invalid JWT format. Expected 3 parts separated by dots.'
      }
    }

    const decodeBase64Url = (str: string): string => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      const padding = base64.length % 4
      if (padding) {
        base64 += '='.repeat(4 - padding)
      }
      return Buffer.from(base64, 'base64').toString('utf-8')
    }

    const header = JSON.parse(decodeBase64Url(parts[0]))
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    const signature = parts[2]

    let expired = false
    let expiresAt: string | undefined
    let issuedAt: string | undefined

    if (payload.exp) {
      const expDate = new Date((payload.exp as number) * 1000)
      expiresAt = expDate.toLocaleString('ru-RU')
      expired = Date.now() > expDate.getTime()
    }

    if (payload.iat) {
      issuedAt = new Date((payload.iat as number) * 1000).toLocaleString('ru-RU')
    }

    return {
      success: true,
      header,
      payload,
      signature,
      expired,
      expiresAt,
      issuedAt
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode JWT'
    }
  }
}
