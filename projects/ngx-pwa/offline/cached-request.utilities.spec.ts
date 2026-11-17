import { describe, expect, test } from 'vitest';

import { CachedRequest } from './cached-request.model';
import { CachedRequestUtilities } from './cached-request.utilities';

function createRequest(changes: Partial<CachedRequest>): CachedRequest {
    return { id: 'offline-1', method: 'PATCH', url: '/api/todos/5', body: undefined, type: 'todo', idKey: 'id', displayValue: '', ...changes };
}

describe('CachedRequestUtilities', () => {
    test('resolves the id of the changed entity from the last segment of the path', () => {
        expect(CachedRequestUtilities.resolveTargetId(createRequest({ url: '/api/todos/5' }))).toBe('5');
        expect(CachedRequestUtilities.resolveTargetId(createRequest({ url: 'https://example.com/api/todos/15?force=true#top' }))).toBe('15');
        expect(CachedRequestUtilities.resolveTargetId(createRequest({ url: '/api/files/my%20file' }))).toBe('my file');
    });

    test('replaces an offline id in the url and anywhere in the body, keeping the type of a value that is only the id', () => {
        const request: CachedRequest = createRequest({
            url: '/api/todos/offline-1/items?parent=offline-1',
            body: { todoId: 'offline-1', tags: ['offline-1', 'a'], note: 'copy of offline-1', nested: { ids: ['offline-1'] }, count: 2 }
        });

        expect(CachedRequestUtilities.replaceId(request, 'offline-1', 7)).toEqual(createRequest({
            url: '/api/todos/7/items?parent=7',
            body: { todoId: 7, tags: [7, 'a'], note: 'copy of 7', nested: { ids: [7] }, count: 2 }
        }));
        // the request itself stays as it was
        expect(request.url).toBe('/api/todos/offline-1/items?parent=offline-1');
    });

    test('finds an id in the url or the body', () => {
        expect(CachedRequestUtilities.containsId(createRequest({ url: '/api/todos/offline-2' }), 'offline-2')).toBe(true);
        expect(CachedRequestUtilities.containsId(createRequest({ body: { todoId: 'offline-2' } }), 'offline-2')).toBe(true);
        expect(CachedRequestUtilities.containsId(createRequest({ body: { todoId: 'offline-3' } }), 'offline-2')).toBe(false);
    });
});