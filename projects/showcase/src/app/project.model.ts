import { Property } from '@service-soft/ngx-entity/entity';

/**
 * A project of the showcase, with strings and numbers only, so the bundle tests can check that only their fields load.
 */
export class Project {
    @Property.string({ displayName: 'Name', minLength: 3 })
    name!: string;

    @Property.number({ displayName: 'Budget', description: 'In euros', min: 0, required: false })
    budget?: number;
}