import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(pool)
    this.client = new PrismaClient({ adapter } as any)
  }

  get db() {
    return this.client
  }

  async $queryRaw<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<T> {
    return (this.client as any).$queryRaw(query, ...values)
  }

  async onModuleInit() {
    await (this.client as any).$connect()
  }

  async onModuleDestroy() {
    await (this.client as any).$disconnect()
  }
}
