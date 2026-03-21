import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CourseEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        id::text, seminar_id, course_name, course_type,
        event_date::text, venue, delivery_mode,
        max_seats, price::float, status,
        (SELECT COUNT(*)::int FROM registrations WHERE seminar_id = ce.seminar_id) AS total_registrations
      FROM course_events ce
      ORDER BY event_date DESC NULLS LAST
    `
  }

  async findBySeminarId(seminarId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM course_events
      WHERE seminar_id = ${seminarId}
      LIMIT 1
    `
  }

  async create(data: {
    seminar_id: string
    course_name: string
    course_type?: string
    event_date?: string
    venue?: string
    delivery_mode?: string
    max_seats?: number
    price?: number
    status?: string
  }) {
    const { seminar_id, course_name, course_type, event_date,
            venue, delivery_mode, max_seats, price, status } = data
    return this.prisma.$queryRaw`
      INSERT INTO course_events
        (seminar_id, course_name, course_type, event_date, venue,
         delivery_mode, max_seats, price, status)
      VALUES
        (${seminar_id}, ${course_name}, ${course_type},
         ${event_date ?? null}::date, ${venue}, ${delivery_mode},
         ${max_seats ?? null}, ${price ?? null}, ${status ?? 'upcoming'})
      RETURNING *
    `
  }

  async update(id: string, data: Partial<{
    course_name: string
    course_type: string
    event_date: string
    venue: string
    delivery_mode: string
    max_seats: number
    price: number
    status: string
  }>) {
    const { course_name, course_type, event_date, venue,
            delivery_mode, max_seats, price, status } = data
    return this.prisma.$queryRaw`
      UPDATE course_events SET
        course_name = COALESCE(${course_name ?? null}, course_name),
        course_type = COALESCE(${course_type ?? null}, course_type),
        event_date = COALESCE(${event_date ?? null}::date, event_date),
        venue = COALESCE(${venue ?? null}, venue),
        delivery_mode = COALESCE(${delivery_mode ?? null}, delivery_mode),
        max_seats = COALESCE(${max_seats ?? null}, max_seats),
        price = COALESCE(${price ?? null}, price),
        status = COALESCE(${status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM registration_profiles WHERE registration_id IN (
        SELECT id FROM registrations WHERE event_id = ${id}::uuid
      )
    `
    await this.prisma.$queryRaw`
      DELETE FROM payments WHERE registration_id IN (
        SELECT id FROM registrations WHERE event_id = ${id}::uuid
      )
    `
    await this.prisma.$queryRaw`
      DELETE FROM registrations WHERE event_id = ${id}::uuid
    `
    await this.prisma.$queryRaw`
      DELETE FROM course_events WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }
}
