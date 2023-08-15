import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.uuid('user_id').notNullable().references('id').inTable('users')
    table.text('name').notNullable()
    table.dateTime('date_time').notNullable().defaultTo(knex.fn.now())
    table.boolean('on_diet')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
