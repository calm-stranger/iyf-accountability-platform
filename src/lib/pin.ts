export async function hashPin(pin: string, userId: string) {
  // Simple client-side hashing using Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + userId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
