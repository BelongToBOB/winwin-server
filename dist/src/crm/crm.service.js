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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CrmService = class CrmService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStages() {
        return this.prisma.$queryRaw `
      SELECT crm_stage AS stage, COUNT(*)::int AS count
      FROM contacts
      GROUP BY crm_stage
      ORDER BY count DESC
    `;
    }
    async getFollowups(seminarId, overdueOnly) {
        const sid = seminarId || null;
        const overdue = overdueOnly === 'true' ? true : null;
        return this.prisma.$queryRaw `
      SELECT
        c.id::text,
        re.first_name, re.last_name,
        c.crm_stage,
        COALESCE(c.assigned_to, '') AS assigned_to,
        c.last_contacted::text,
        c.next_followup::text,
        COALESCE(i.channel, '') AS channel,
        COALESCE(r.seminar_id, '') AS seminar_id,
        COALESCE(c.notes, '') AS notes
      FROM contacts c
      JOIN registrants re ON re.id = c.registrant_id
      LEFT JOIN LATERAL (
        SELECT seminar_id FROM registrations
        WHERE registrant_id = re.id
        ORDER BY registered_at DESC LIMIT 1
      ) r ON true
      LEFT JOIN LATERAL (
        SELECT channel FROM interactions
        WHERE contact_id = c.id
        ORDER BY interacted_at DESC LIMIT 1
      ) i ON true
      WHERE
        (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND (${overdue}::boolean IS NULL OR (${overdue} = true AND c.next_followup < NOW()))
      ORDER BY c.next_followup ASC NULLS LAST
      LIMIT 100
    `;
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmService);
//# sourceMappingURL=crm.service.js.map