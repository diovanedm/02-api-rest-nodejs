import { afterAll, beforeAll, test } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

test('user can expect create a new transaction', async () => {
  await request(app.server)
    .post('/transactions')
    .send({
      title: 'Salario',
      amount: 6000,
      type: 'credit',
    })
    .expect(201)
})
