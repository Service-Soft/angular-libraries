import { Component, signal, WritableSignal } from '@angular/core';
import { EntityClass, EntityUtilities } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';

import { Project } from './project.model';

/**
 * The page of a new project, a form from the decorators of Project.
 */
@Component({
    selector: 'app-project-form',
    templateUrl: './project-form.component.html',
    imports: [FormComponent, EntityFormComponent, ButtonComponent]
})
export class ProjectFormComponent {
    protected readonly entity: EntityClass<Project> = Project;

    protected readonly value: WritableSignal<Partial<Project>> = signal(EntityUtilities.resolveDefaults(Project));

    protected readonly saved: WritableSignal<boolean> = signal(false);
}