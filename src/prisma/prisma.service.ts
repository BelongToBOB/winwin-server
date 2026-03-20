import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: any

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(pool as any)
    this.client = new PrismaClient({ adapter })
  }

  async $queryRaw<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<T> {
    return this.client.$queryRaw(query, ...values) as T
  }

  async onModuleInit() {
    await this.client.$connect()
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }
}
