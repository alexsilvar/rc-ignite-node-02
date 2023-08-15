import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'

const TABLE_NAME = 'users'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
    })

    const { name } = createUserBodySchema.parse(request.body)

    const existingUser = await knex(TABLE_NAME).where({ name }).select().first()
    console.log(existingUser)
    if (existingUser) {
      return reply.status(400).send({ error: 'user already exists' })
    }

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex(TABLE_NAME).insert({
      id: randomUUID(),
      name,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
