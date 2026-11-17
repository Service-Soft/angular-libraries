import { describe, expect, test } from 'vitest';

import { CachedRequest } from './cached-request.model';
import { LegacyCachedRequestUtilities } from './legacy-cached-request.utilities';

describe('LegacyCachedRequestUtilities', () => {
    test('converts the requests of the package before, keeping the offline id of a POST and making its html text', () => {
        const stored: string = JSON.stringify([
            {
                request: { method: 'POST', urlWithParams: '/api/todos?draft=true', body: { title: 'Buy milk', id: 'offline 1b2c' } },
                metadata: { idKey: 'id', type: 'todo', displayValue: '<b style="color: green;">POST</b>   /api/todos' }
            },
            {
                // eslint-disable-next-line unicorn/no-null -- a serialized HttpRequest without a body has null
                request: { method: 'DELETE', urlWithParams: '/api/todos/3', body: null },
                metadata: { idKey: 'id', type: 'todo', displayValue: 'Pay rent' }
            },
            {
                // eslint-disable-next-line unicorn/no-null -- a serialized HttpRequest without a body has null
                request: { method: 'GET', urlWithParams: '/api/todos', body: null },
                metadata: { idKey: 'id', type: 'todo', displayValue: '' }
            }
        ]);

        expect(LegacyCachedRequestUtilities.resolveCachedRequests(stored)).toEqual<CachedRequest[]>([
            {
                id: 'offline 1b2c',
                method: 'POST',
                url: '/api/todos?draft=true',
                body: { title: 'Buy milk' },
                type: 'todo',
                idKey: 'id',
                displayValue: 'POST /api/todos'
            },
            {
                id: expect.stringMatching(/^offline-/) as string,
                method: 'DELETE',
                url: '/api/todos/3',
                body: undefined,
                type: 'todo',
                idKey: 'id',
                displayValue: 'Pay rent'
            }
        ]);
    });

    test('leaves anything else alone', () => {
        expect(LegacyCachedRequestUtilities.resolveCachedRequests('{"pending":3}')).toBeUndefined();
        expect(LegacyCachedRequestUtilities.resolveCachedRequests('[{"request":{"method":"POST"}}]')).toBeUndefined();
        expect(LegacyCachedRequestUtilities.resolveCachedRequests('not json')).toBeUndefined();
    });
});