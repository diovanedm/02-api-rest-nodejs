import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: `.env.${process.env.NODE_ENV}`, override: true })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  PORT: z.number().default(3333),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('⚠ Invalid enviroments variables!', _env.error.format())

  throw new Error('Invalid enviroments variables.')
}

export const env = _env.data
