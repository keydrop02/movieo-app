const PRIVATE_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^192\.0\.(0|2)\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^0\./,
  /^::1$/,
  /^fc/,
  /^fd/,
  /^fe80/i,
  /^localhost$/i,
]

function ipToNumber(ip: string): number | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  const nums = parts.map(Number)
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0
}

export function isPrivateIP(hostname: string): boolean {
  for (const pattern of PRIVATE_PATTERNS) {
    if (pattern.test(hostname)) return true
  }
  const num = ipToNumber(hostname)
  if (num !== null) {
    if (num >= 0x0a000000 && num <= 0x0affffff) return true
    if (num >= 0x7f000000 && num <= 0x7fffffff) return true
    if (num >= 0xa9fe0000 && num <= 0xa9feffff) return true
    if (num >= 0xac100000 && num <= 0xac1fffff) return true
    if (num >= 0xc0a80000 && num <= 0xc0a8ffff) return true
  }
  return false
}
