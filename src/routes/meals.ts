import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

const MEALS_TABLE_NAME = 'meals'
const USERS_TABLE_NAME = 'users'

export async function mealsRoutes(app: FastifyInstance) {
  async function getUserId(sessionId: string | undefined): Promise<string> {
    const [user] = await knex(USERS_TABLE_NAME)
      .where('session_id', sessionId)
      .select('id')

    return user.id
  }

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const userId = await getUserId(sessionId)

      const meals = await knex(MEALS_TABLE_NAME)
        .where('user_id', userId)
        .select()

      return { meals }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const meal = await knex(MEALS_TABLE_NAME)
        .where({
          id,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({})
      }
      return {
        meal,
      }
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const userId = await getUserId(sessionId)

      await knex(MEALS_TABLE_NAME)
        .where('user_id', userId)
        .andWhere('id', id)
        .delete()

      reply.status(204)
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const getMealsBodySchema = z.object({
        name: z.string(),
        dateTime: z.date().optional(),
        onDiet: z.boolean(),
      })

      const { id } = getMealsParamsSchema.parse(request.params)
      const { name, dateTime, onDiet } = getMealsBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const userId = await getUserId(sessionId)

      await knex(MEALS_TABLE_NAME)
        .update({ name, date_time: dateTime, on_diet: onDiet })
        .where('user_id', userId)
        .andWhere('id', id)

      const updatedMeal = await knex(MEALS_TABLE_NAME).where('id', id).first()

      return reply.status(201).send({ meal: updatedMeal })
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const userId = await getUserId(sessionId)
      console.log(userId)

      const countOnDiet = await knex(MEALS_TABLE_NAME)
        .where('user_id', userId)
        .andWhere('on_diet', 1)
        .count('id')
        .select()

      const totalMeals = await knex(MEALS_TABLE_NAME)
        .where('user_id', userId)
        .count('id')
        .select()

      const highStreak = await knex
        .select('on_diet', 'date_time')
        .from(MEALS_TABLE_NAME)
        .where('user_id', userId)
        .orderBy('date_time', 'asc')
        .then((rows) => {
          let count = 0
          let result = 0
          for (let i = 0; i < rows.length; i++) {
            const element = rows[i]
            if (!element.on_diet) {
              count = 0
            } else {
              count++
              result = Math.max(result, count)
            }
          }
          return result
        })

      return {
        totalMeals: Number(countOnDiet) / Number(totalMeals),
        totalDietMeals: Number(countOnDiet),
        totalOutMeals: Number(totalMeals) - Number(countOnDiet),
        highStreak,
      }
    },
  )

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      onDiet: z.boolean(),
    })
    const { sessionId } = request.cookies

    const { name, onDiet } = createMealBodySchema.parse(request.body)

    const userId = await getUserId(sessionId)
    if (!userId) {
      return reply.status(400).send({ error: 'user not found' })
    }

    const meal = await knex(MEALS_TABLE_NAME).insert({
      id: randomUUID(),
      name,
      date_time: new Date(),
      on_diet: onDiet,
      user_id: userId,
    })

    return reply.status(201).send({ meal })
  })
}
