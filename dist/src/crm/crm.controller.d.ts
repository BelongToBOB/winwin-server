import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    getStages(): Promise<any[]>;
    getFollowups(seminarId?: string, overdueOnly?: string): Promise<any[]>;
}
