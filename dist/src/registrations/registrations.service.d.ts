import { PrismaService } from '../prisma/prisma.service';
interface RegistrationsFilters {
    seminar_id?: string;
    status?: string;
    job?: string;
    loan_range?: string;
    q?: string;
}
export declare class RegistrationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRegistrations(filters: RegistrationsFilters): Promise<any[]>;
}
export {};
