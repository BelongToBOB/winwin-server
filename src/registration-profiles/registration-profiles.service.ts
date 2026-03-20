import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class RegistrationProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async update(registrationId: string, data: {
    loan_before?: boolean
    credit_banks?: string
    loan_amount_range?: string
    channels?: string
    objective?: string
    loan_problems?: string
  }) {
    const { loan_before, credit_banks, loan_amount_range,
            channels, objective, loan_problems } = data
    return this.prisma.$queryRaw`
      UPDATE registration_profiles SET
        loan_before = COALESCE(${loan_before ?? null}, loan_before),
        credit_banks = COALESCE(${credit_banks ?? null}, credit_banks),
        loan_amount_range = COALESCE(${loan_amount_range ?? null}, loan_amount_range),
        channels = COALESCE(${channels ?? null}, channels),
        objective = COALESCE(${objective ?? null}, objective),
        loan_problems = COALESCE(${loan_problems ?? null}, loan_problems)
      WHERE registration_id = ${registrationId}::uuid
      RETURNING *
    `
  }
}
