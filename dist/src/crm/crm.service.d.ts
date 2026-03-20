import { PrismaService } from '../prisma/prisma.service';
export declare class CrmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStages(): Promise<any[]>;
    getFollowups(seminarId?: string, overdueOnly?: string): Promise<any[]>;
}
