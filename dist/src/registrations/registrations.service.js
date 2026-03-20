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
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RegistrationsService = class RegistrationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRegistrations(filters) {
        const sid = filters.seminar_id || null;
        const st = filters.status || null;
        const jb = filters.job || null;
        const lr = filters.loan_range || null;
        const search = filters.q || null;
        return this.prisma.$queryRaw `
      SELECT
        r.id::text,
        re.first_name, re.last_name, re.nickname,
        re.email, re.phone, re.job_category,
        rp.channels, rp.loan_amount_range,
        rp.loan_before, rp.credit_banks,
        rp.objective, rp.loan_problems,
        r.reg_status, r.registered_at::text, r.seminar_id
      FROM registrations r
      JOIN registrants re ON re.id = r.registrant_id
      LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
      WHERE
        (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND (${st}::text IS NULL OR r.reg_status = ${st})
        AND (${jb}::text IS NULL OR re.job_category ILIKE '%' || ${jb} || '%')
        AND (${lr}::text IS NULL OR rp.loan_amount_range = ${lr})
        AND (${search}::text IS NULL OR
          re.first_name ILIKE '%' || ${search} || '%' OR
          re.last_name ILIKE '%' || ${search} || '%' OR
          re.email ILIKE '%' || ${search} || '%')
      ORDER BY r.registered_at DESC
      LIMIT 100
    `;
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map