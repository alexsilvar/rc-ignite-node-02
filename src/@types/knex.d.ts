// eslint-disable-next-line
import { Knex } from 'knex'
// ou faça apenas:
// import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
    }
    meals: {
      id: string
      name: string
      dateTime: Date
      onDiet: boolean
    }
  }
}
