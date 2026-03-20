import { PrismaService } from '../prisma/prisma.service';
export declare class OverviewService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(seminarId?: string): Promise<any>;
}
