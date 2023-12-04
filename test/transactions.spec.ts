import { exec, execSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('yarn knex migrate:rollback --all')
    execSync('yarn knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salario',
        amount: 6000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salario',
        amount: 6000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.headers['set-cookie']

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Salario',
        amount: 6000,
      }),
    ])
  })

  it('should be able to list a transaction by id', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salario',
        amount: 6000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.headers['set-cookie']

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Boletos',
        amount: 4000,
        type: 'debit',
      })
      .set('Cookie', cookies)

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const { transactions } = listTransactionResponse.body

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactions[0].id}`)
      .set('Cookie', cookies)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        session_id: expect.any(String),
        title: 'Salario',
        amount: 6000,
        created_at: expect.any(String),
      }),
    )
  })

  it('should be able to get summary with correct amount', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salario',
        amount: 6000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.headers['set-cookie']

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Boletos',
        amount: 4000,
        type: 'debit',
      })
      .set('Cookie', cookies)

    const getTransactionSummaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)

    expect(getTransactionSummaryResponse.body).toEqual({
      summary: {
        amount: 2000,
      },
    })
  })
})
