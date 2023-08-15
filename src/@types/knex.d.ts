// eslint-disable-next-line
import { Knex } from 'knex'
// ou faça apenas:
// import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      session_id: string
    }
    meals: {
      id: string
      name: string
      date_time: Date
      on_diet: boolean
      user_id: string
    }
  }
}
