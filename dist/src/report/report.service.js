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
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportService = class ReportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPreview(seminarId, type) {
        const sid = seminarId || null;
        switch (type) {
            case 'registration_summary':
                return this.prisma.$queryRaw `
          SELECT
            'Total Registrations' AS metric,
            COUNT(r.id)::text AS value
          FROM registrations r
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Attended', COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Pending', COUNT(r.id) FILTER (WHERE r.reg_status = 'pending')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Cancelled', COUNT(r.id) FILTER (WHERE r.reg_status = 'cancelled')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        `;
            case 'loan_profile':
                return this.prisma.$queryRaw `
          SELECT
            COALESCE(rp.loan_amount_range, 'Unknown') AS metric,
            COUNT(*)::text AS value
          FROM registration_profiles rp
          JOIN registrations r ON r.id = rp.registration_id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          GROUP BY rp.loan_amount_range
          ORDER BY count(*) DESC
        `;
            case 'crm_pipeline':
                return this.prisma.$queryRaw `
          SELECT
            c.crm_stage AS metric,
            COUNT(*)::text AS value
          FROM contacts c
          JOIN registrants re ON re.id = c.registrant_id
          LEFT JOIN LATERAL (
            SELECT seminar_id FROM registrations
            WHERE registrant_id = re.id
            ORDER BY registered_at DESC LIMIT 1
          ) r ON true
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          GROUP BY c.crm_stage
          ORDER BY count(*) DESC
        `;
            case 'attendance':
                return this.prisma.$queryRaw `
          SELECT
            ce.course_name AS metric,
            CONCAT(
              COUNT(r.id) FILTER (WHERE r.reg_status = 'attended'),
              ' / ',
              COUNT(r.id)
            ) AS value
          FROM course_events ce
          LEFT JOIN registrations r ON r.event_id = ce.id
          WHERE (${sid}::text IS NULL OR ce.seminar_id = ${sid})
          GROUP BY ce.course_name, ce.event_date
          ORDER BY ce.event_date DESC
        `;
            default:
                return [];
        }
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportService);
//# sourceMappingURL=report.service.js.map