"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OverviewService = class OverviewService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(seminarId) {
        const sid = seminarId || null;
        const [metrics] = await this.prisma.$queryRaw `
      SELECT
        COUNT(r.id)::int AS total_registrations,
        COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::int AS attended,
        ROUND(
          COUNT(r.id) FILTER (WHERE r.reg_status = 'attended') * 100.0
          / NULLIF(COUNT(r.id), 0), 1
        )::float AS attendance_rate,
        ROUND(
          COUNT(rp.id) FILTER (WHERE rp.loan_before = true) * 100.0
          / NULLIF(COUNT(rp.id), 0), 1
        )::float AS loan_before_pct,
        COUNT(c.id)::int AS crm_active,
        COUNT(c.id) FILTER (WHERE c.next_followup < NOW())::int AS crm_overdue
      FROM registrations r
      LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
      LEFT JOIN contacts c ON c.registrant_id = r.registrant_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
    `;
        const channels = await this.prisma.$queryRaw `
      SELECT
        TRIM(unnest(string_to_array(rp.channels, ','))) AS name,
        COUNT(*)::int AS count
      FROM registration_profiles rp
      JOIN registrations r ON r.id = rp.registration_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND rp.channels IS NOT NULL
      GROUP BY name ORDER BY count DESC
    `;
        const loanRanges = await this.prisma.$queryRaw `
      SELECT
        rp.loan_amount_range AS range,
        COUNT(*)::int AS count
      FROM registration_profiles rp
      JOIN registrations r ON r.id = rp.registration_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND rp.loan_amount_range IS NOT NULL
      GROUP BY range ORDER BY count DESC
    `;
        const seminars = await this.prisma.$queryRaw `
      SELECT
        ce.seminar_id,
        ce.course_name,
        ce.event_date::text,
        COUNT(r.id)::int AS total,
        COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::int AS attended,
        ce.status
      FROM course_events ce
      LEFT JOIN registrations r ON r.event_id = ce.id
      GROUP BY ce.seminar_id, ce.course_name, ce.event_date, ce.status
      ORDER BY ce.event_date DESC
      LIMIT 10
    `;
        return { ...metrics, channels, loan_ranges: loanRanges, seminars };
    }
};
exports.OverviewService = OverviewService;
exports.OverviewService = OverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OverviewService);
//# sourceMappingURL=overview.service.js.map