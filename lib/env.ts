import { z } from "zod"

const envSchema = z.object({
  TMDB_API_KEYS: z.string().min(1, "TMDB_API_KEYS is required. Add comma-separated keys to .env.local"),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("\n")
    throw new Error(`Environment validation failed:\n${msg}`)
  }
  const keys = parsed.data.TMDB_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
  if (keys.length === 0) throw new Error("TMDB_API_KEYS must contain at least one key")
  return { TMDB_API_KEYS: keys }
}

let _env: { TMDB_API_KEYS: string[] } | null = null

export function getEnv() {
  if (!_env) _env = validateEnv()
  return _env
}
