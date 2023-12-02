import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { ZodError, z } from 'zod'
import crypto, { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const sessionId = request.cookies.sessionId
    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select('*')
    return { transactions }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)
    const sessionId = request.cookies.sessionId

    const transaction = await knex('transactions')
      .where({ session_id: sessionId, id })
      .first()
    return { transaction }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const sessionId = request.cookies.sessionId

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    try {
      console.log('chamou')
      const createSchemaTransactionSchema = z.object({
        title: z.string(),
        amount: z.number(),
        type: z.enum(['debit', 'credit']),
      })

      const { title, amount, type } = createSchemaTransactionSchema.parse(
        request.body,
      )

      let sessionId = request.cookies.sessionId

      if (!sessionId) {
        sessionId = randomUUID()

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        })
      }

      await knex('transactions').insert({
        id: crypto.randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })

      reply.status(201).send()
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send(JSON.stringify(error))
      }
    }
  })
}
