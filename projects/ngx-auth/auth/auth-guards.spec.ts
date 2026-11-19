import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CurrentUserProfile } from 'zibri-contract';

import { AnyLevelPermission } from './any-level-permission.model';
import { AuthData } from './auth-data.model';
import { AuthRouteData } from './auth-route-data.model';
import { authInterceptor } from './auth.interceptor';
import { provideAuth } from './auth.provider';
import { AuthService } from './auth.service';
import { loggedInGuard } from './logged-in.guard';
import { notLoggedInGuard } from './not-logged-in.guard';
import { permissionGuard } from './permission.guard';

const API: string = 'https://api.example.com/auth';

/**
 * The permissions of the app of the tests in a tenant.
 */
type Permission = 'invoices.export' | 'invoices.read' | 'members.read';

/**
 * The permissions of the app of the tests by the roles of a user's own.
 */
type PlatformPermission = 'tenants.create' | 'users.read';

/**
 * A route of the app, whose data the permissionGuard reads.
 */
type AppRoute = Route & { data?: AuthRouteData<Permission, PlatformPermission> };

@Service()
class AppAuthService extends AuthService<'admin' | 'user', Permission, PlatformPermission> {}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

// a reader in one tenant, an exporter in the other.
const PROFILE: CurrentUserProfile<Permission, PlatformPermission> = {
    id: 'user-1',
    email: 'ada@example.com',
    memberships: [
        { tenantId: 'tenant-a', permissions: ['invoices.read'] },
        { tenantId: 'tenant-b', permissions: ['invoices.read', 'invoices.export', 'members.read'] }
    ],
    platformPermissions: []
};

// the members of the active tenant, or every user for a platform admin.
const USERS: AnyLevelPermission<Permission, PlatformPermission> = { permission: 'members.read', platformPermission: 'users.read' };

const ROUTES: AppRoute[] = [
    { path: 'login', component: PageComponent, canActivate: [notLoggedInGuard] },
    { path: 'account', component: PageComponent, canActivate: [loggedInGuard] },
    { path: 'export', component: PageComponent, canActivate: [permissionGuard], data: { permission: 'invoices.export' } },
    {
        path: 'tenants/:tenantId/export',
        component: PageComponent,
        canActivate: [permissionGuard],
        data: { permission: 'invoices.export', tenantId: route => route.paramMap.get('tenantId') ?? undefined }
    },
    { path: 'tenants/new', component: PageComponent, canActivate: [permissionGuard], data: { platformPermission: 'tenants.create' } },
    { path: 'unnamed', component: PageComponent, canActivate: [permissionGuard] },
    { path: 'users', component: PageComponent, canActivate: [permissionGuard], data: { anyLevelPermission: USERS } },
    {
        path: 'users/new',
        component: PageComponent,
        canActivate: [permissionGuard],
        data: { anyLevelPermission: USERS, platformPermission: 'tenants.create' }
    },
    { path: '**', component: PageComponent }
];

// @ts-expect-error - a tenant permission is one of the app, never a platform permission
const WRONG_LEVEL: AuthRouteData<Permission, PlatformPermission> = { permission: 'tenants.create' };

// a login of another visit, which the AuthService finds in the browser.
function setup(login?: Partial<AuthData<string, Permission, PlatformPermission>>): [RouterTestingHarness, Router, HttpTestingController] {
    if (login != undefined) {
        const expiresAt: string = new Date(Date.now() + 3_600_000).toISOString();
        localStorage.setItem('authData', JSON.stringify({ strategy: 'cookie', userId: 'user-1', roles: ['user'], expiresAt, ...login }));
    }
    TestBed.configureTestingModule({
        providers: [
            provideRouter(ROUTES),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'cookie', routes: { forbidden: '/forbidden' } })
        ]
    });
    return [new RouterTestingHarness(), TestBed.inject(Router), TestBed.inject(HttpTestingController)];
}

async function create(login?: Partial<AuthData<string, Permission, PlatformPermission>>): Promise<[RouterTestingHarness, Router, HttpTestingController]> {
    const [, router, backend] = setup(login);
    return [await RouterTestingHarness.create(), router, backend];
}

// a visit of its own with the login: where the user ends up when opening the url.
async function resolveUrlAfterNavigation(login: Partial<AuthData<string, Permission, PlatformPermission>>, url: string): Promise<string> {
    TestBed.resetTestingModule();
    localStorage.clear();
    const [harness, router] = await create(login);
    await harness.navigateByUrl(url);
    return router.url;
}

describe('auth guards', () => {
    afterEach(() => {
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('send a user who isn\'t logged in to the login, with the page they wanted', async () => {
        const [harness, router] = await create();

        await harness.navigateByUrl('/account');
        expect(decodeURIComponent(router.url)).toBe('/login?returnUrl=/account');
        await harness.navigateByUrl('/export');
        expect(decodeURIComponent(router.url)).toBe('/login?returnUrl=/export');
        expect(WRONG_LEVEL.permission).toBe('tenants.create');
    });

    test('send a logged in user from the login to afterLogin', async () => {
        const [harness, router] = await create({ user: PROFILE });

        await harness.navigateByUrl('/login');
        expect(router.url).toBe('/');
        await harness.navigateByUrl('/account');
        expect(router.url).toBe('/account');
    });

    test('check a permission in the active tenant, or in the tenant of the route, without asking the server', async () => {
        const [harness, router] = await create({ user: PROFILE, activeTenantId: 'tenant-b' });

        await harness.navigateByUrl('/export');
        expect(router.url).toBe('/export');

        TestBed.inject(AppAuthService).setActiveTenant('tenant-a');
        await harness.navigateByUrl('/account');
        await harness.navigateByUrl('/export');
        expect(router.url).toBe('/forbidden');
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(true);

        await harness.navigateByUrl('/tenants/tenant-b/export');
        expect(router.url).toBe('/tenants/tenant-b/export');
    });

    test('check a platform permission, and let nobody open a route that names no permission', async () => {
        const [harness, router] = await create({ user: PROFILE });

        await harness.navigateByUrl('/tenants/new');
        expect(router.url).toBe('/forbidden');
        await harness.navigateByUrl('/unnamed');
        expect(router.url).toBe('/forbidden');

        TestBed.resetTestingModule();
        localStorage.clear();
        const [creator, creatorRouter] = await create({ user: { ...PROFILE, platformPermissions: ['tenants.create'] } });
        await creator.navigateByUrl('/tenants/new');
        expect(creatorRouter.url).toBe('/tenants/new');
    });

    test('open a route of an any level permission with the permission in the tenant or the platform permission', async () => {
        const platformAdmin: CurrentUserProfile<Permission, PlatformPermission> = { ...PROFILE, platformPermissions: ['users.read'] };
        const cases: [string, Partial<AuthData<string, Permission, PlatformPermission>>, string][] = [
            ['only the permission', { user: PROFILE, activeTenantId: 'tenant-b' }, '/users'],
            ['only the platform permission', { user: platformAdmin, activeTenantId: 'tenant-a' }, '/users'],
            ['both', { user: platformAdmin, activeTenantId: 'tenant-b' }, '/users'],
            ['the platform permission without a tenant', { user: platformAdmin }, '/users'],
            ['neither', { user: { ...PROFILE, memberships: [] } }, '/forbidden'],
            ['the permission in another tenant', { user: PROFILE, activeTenantId: 'tenant-a' }, '/forbidden'],
            ['the permission without an active tenant', { user: PROFILE }, '/forbidden']
        ];
        for (const [name, login, url] of cases) {
            expect(await resolveUrlAfterNavigation(login, '/users'), name).toBe(url);
        }

        // next to a platformPermission, both need to pass
        expect(await resolveUrlAfterNavigation({ user: platformAdmin }, '/users/new')).toBe('/forbidden');
        const creator: CurrentUserProfile<Permission, PlatformPermission> = { ...PROFILE, platformPermissions: ['users.read', 'tenants.create'] };
        expect(await resolveUrlAfterNavigation({ user: creator }, '/users/new')).toBe('/users/new');
    });

    test('load the user first when the login has none yet', async () => {
        const [harness, router, backend] = await create({ activeTenantId: 'tenant-b' });

        const navigated: Promise<unknown> = harness.navigateByUrl('/export');
        (await vi.waitFor(() => backend.expectOne(`${API}/me`))).flush(PROFILE);
        await navigated;

        expect(router.url).toBe('/export');
    });
});