import { RegistrationsService } from './registrations.service';
export declare class RegistrationsController {
    private readonly registrationsService;
    constructor(registrationsService: RegistrationsService);
    getRegistrations(seminarId?: string, status?: string, job?: string, loanRange?: string, q?: string): Promise<any[]>;
}
