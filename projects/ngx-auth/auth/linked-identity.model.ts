import { LinkedIdentity as ZibriLinkedIdentity } from 'zibri-contract';

import { LinkedIdentityDetails } from './linked-identity-details.model';

/**
 * An identity linked to the user, as `GET /identities` of zibri lists it: an account at a provider, or a passkey, with
 * the details of it this library shows.
 */
export type LinkedIdentity = ZibriLinkedIdentity<LinkedIdentityDetails>;