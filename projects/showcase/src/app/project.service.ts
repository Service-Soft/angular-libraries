import { Injectable } from '@angular/core';
import { EntityClass } from '@service-soft/ngx-entity/entity';
import { EntityService } from '@service-soft/ngx-entity/service';

import { Project } from './project.model';

/**
 * Reads and writes the projects. The showcase has no backend, so only the page that creates one opens without errors.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService extends EntityService<Project> {
    readonly entity: EntityClass<Project> = Project;
    readonly baseUrl: string = '/api/projects';
}