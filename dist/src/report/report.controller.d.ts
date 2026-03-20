import type { Response } from 'express';
import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getPreview(seminarId: string, type: string): Promise<{
        metric: string;
        value: string;
    }[]>;
    exportReport(seminarId: string, type: string, format: string, res: Response): Promise<void>;
}
