import { PrismaService } from '../prisma/prisma.service';
export declare class ReportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPreview(seminarId: string, type: string): Promise<{
        metric: string;
        value: string;
    }[]>;
}
