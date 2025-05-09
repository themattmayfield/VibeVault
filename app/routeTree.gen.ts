/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TempRedirectImport } from './routes/temp-redirect'
import { Route as NewLogImport } from './routes/new-log'
import { Route as PublicImport } from './routes/_public'
import { Route as OrganizationImport } from './routes/_organization'
import { Route as PublicIndexImport } from './routes/_public.index'
import { Route as DTestImport } from './routes/d/test'
import { Route as PublicJoinImport } from './routes/_public.join'
import { Route as OrganizationAuthenticatedImport } from './routes/_organization/_authenticated'
import { Route as OrganizationUnauthenticatedSignUpImport } from './routes/_organization/_unauthenticated/sign-up'
import { Route as OrganizationUnauthenticatedSignInImport } from './routes/_organization/_unauthenticated/sign-in'
import { Route as OrganizationUnauthenticatedForgotPasswordImport } from './routes/_organization/_unauthenticated/forgot-password'
import { Route as OrganizationAuthenticatedWelcomeImport } from './routes/_organization/_authenticated/welcome'
import { Route as OrganizationAuthenticatedTrendsImport } from './routes/_organization/_authenticated/trends'
import { Route as OrganizationAuthenticatedLogImport } from './routes/_organization/_authenticated/log'
import { Route as OrganizationAuthenticatedDashboardImport } from './routes/_organization/_authenticated/dashboard'
import { Route as OrganizationAuthenticatedGroupsIndexImport } from './routes/_organization/_authenticated/groups/index'
import { Route as OrganizationAuthenticatedGroupsGroupIdImport } from './routes/_organization/_authenticated/groups/$groupId'
import { Route as OrganizationAuthenticatedOOrgIdAdminImport } from './routes/_organization/_authenticated/o.$orgId/admin'

// Create/Update Routes

const TempRedirectRoute = TempRedirectImport.update({
  id: '/temp-redirect',
  path: '/temp-redirect',
  getParentRoute: () => rootRoute,
} as any)

const NewLogRoute = NewLogImport.update({
  id: '/new-log',
  path: '/new-log',
  getParentRoute: () => rootRoute,
} as any)

const PublicRoute = PublicImport.update({
  id: '/_public',
  getParentRoute: () => rootRoute,
} as any)

const OrganizationRoute = OrganizationImport.update({
  id: '/_organization',
  getParentRoute: () => rootRoute,
} as any)

const PublicIndexRoute = PublicIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => PublicRoute,
} as any)

const DTestRoute = DTestImport.update({
  id: '/d/test',
  path: '/d/test',
  getParentRoute: () => rootRoute,
} as any)

const PublicJoinRoute = PublicJoinImport.update({
  id: '/join',
  path: '/join',
  getParentRoute: () => PublicRoute,
} as any)

const OrganizationAuthenticatedRoute = OrganizationAuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => OrganizationRoute,
} as any)

const OrganizationUnauthenticatedSignUpRoute =
  OrganizationUnauthenticatedSignUpImport.update({
    id: '/_unauthenticated/sign-up',
    path: '/sign-up',
    getParentRoute: () => OrganizationRoute,
  } as any)

const OrganizationUnauthenticatedSignInRoute =
  OrganizationUnauthenticatedSignInImport.update({
    id: '/_unauthenticated/sign-in',
    path: '/sign-in',
    getParentRoute: () => OrganizationRoute,
  } as any)

const OrganizationUnauthenticatedForgotPasswordRoute =
  OrganizationUnauthenticatedForgotPasswordImport.update({
    id: '/_unauthenticated/forgot-password',
    path: '/forgot-password',
    getParentRoute: () => OrganizationRoute,
  } as any)

const OrganizationAuthenticatedWelcomeRoute =
  OrganizationAuthenticatedWelcomeImport.update({
    id: '/welcome',
    path: '/welcome',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedTrendsRoute =
  OrganizationAuthenticatedTrendsImport.update({
    id: '/trends',
    path: '/trends',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedLogRoute =
  OrganizationAuthenticatedLogImport.update({
    id: '/log',
    path: '/log',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedDashboardRoute =
  OrganizationAuthenticatedDashboardImport.update({
    id: '/dashboard',
    path: '/dashboard',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedGroupsIndexRoute =
  OrganizationAuthenticatedGroupsIndexImport.update({
    id: '/groups/',
    path: '/groups/',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedGroupsGroupIdRoute =
  OrganizationAuthenticatedGroupsGroupIdImport.update({
    id: '/groups/$groupId',
    path: '/groups/$groupId',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

const OrganizationAuthenticatedOOrgIdAdminRoute =
  OrganizationAuthenticatedOOrgIdAdminImport.update({
    id: '/o/$orgId/admin',
    path: '/o/$orgId/admin',
    getParentRoute: () => OrganizationAuthenticatedRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_organization': {
      id: '/_organization'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof OrganizationImport
      parentRoute: typeof rootRoute
    }
    '/_public': {
      id: '/_public'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof PublicImport
      parentRoute: typeof rootRoute
    }
    '/new-log': {
      id: '/new-log'
      path: '/new-log'
      fullPath: '/new-log'
      preLoaderRoute: typeof NewLogImport
      parentRoute: typeof rootRoute
    }
    '/temp-redirect': {
      id: '/temp-redirect'
      path: '/temp-redirect'
      fullPath: '/temp-redirect'
      preLoaderRoute: typeof TempRedirectImport
      parentRoute: typeof rootRoute
    }
    '/_organization/_authenticated': {
      id: '/_organization/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof OrganizationAuthenticatedImport
      parentRoute: typeof OrganizationImport
    }
    '/_public/join': {
      id: '/_public/join'
      path: '/join'
      fullPath: '/join'
      preLoaderRoute: typeof PublicJoinImport
      parentRoute: typeof PublicImport
    }
    '/d/test': {
      id: '/d/test'
      path: '/d/test'
      fullPath: '/d/test'
      preLoaderRoute: typeof DTestImport
      parentRoute: typeof rootRoute
    }
    '/_public/': {
      id: '/_public/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof PublicIndexImport
      parentRoute: typeof PublicImport
    }
    '/_organization/_authenticated/dashboard': {
      id: '/_organization/_authenticated/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof OrganizationAuthenticatedDashboardImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_authenticated/log': {
      id: '/_organization/_authenticated/log'
      path: '/log'
      fullPath: '/log'
      preLoaderRoute: typeof OrganizationAuthenticatedLogImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_authenticated/trends': {
      id: '/_organization/_authenticated/trends'
      path: '/trends'
      fullPath: '/trends'
      preLoaderRoute: typeof OrganizationAuthenticatedTrendsImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_authenticated/welcome': {
      id: '/_organization/_authenticated/welcome'
      path: '/welcome'
      fullPath: '/welcome'
      preLoaderRoute: typeof OrganizationAuthenticatedWelcomeImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_unauthenticated/forgot-password': {
      id: '/_organization/_unauthenticated/forgot-password'
      path: '/forgot-password'
      fullPath: '/forgot-password'
      preLoaderRoute: typeof OrganizationUnauthenticatedForgotPasswordImport
      parentRoute: typeof OrganizationImport
    }
    '/_organization/_unauthenticated/sign-in': {
      id: '/_organization/_unauthenticated/sign-in'
      path: '/sign-in'
      fullPath: '/sign-in'
      preLoaderRoute: typeof OrganizationUnauthenticatedSignInImport
      parentRoute: typeof OrganizationImport
    }
    '/_organization/_unauthenticated/sign-up': {
      id: '/_organization/_unauthenticated/sign-up'
      path: '/sign-up'
      fullPath: '/sign-up'
      preLoaderRoute: typeof OrganizationUnauthenticatedSignUpImport
      parentRoute: typeof OrganizationImport
    }
    '/_organization/_authenticated/groups/$groupId': {
      id: '/_organization/_authenticated/groups/$groupId'
      path: '/groups/$groupId'
      fullPath: '/groups/$groupId'
      preLoaderRoute: typeof OrganizationAuthenticatedGroupsGroupIdImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_authenticated/groups/': {
      id: '/_organization/_authenticated/groups/'
      path: '/groups'
      fullPath: '/groups'
      preLoaderRoute: typeof OrganizationAuthenticatedGroupsIndexImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
    '/_organization/_authenticated/o/$orgId/admin': {
      id: '/_organization/_authenticated/o/$orgId/admin'
      path: '/o/$orgId/admin'
      fullPath: '/o/$orgId/admin'
      preLoaderRoute: typeof OrganizationAuthenticatedOOrgIdAdminImport
      parentRoute: typeof OrganizationAuthenticatedImport
    }
  }
}

// Create and export the route tree

interface OrganizationAuthenticatedRouteChildren {
  OrganizationAuthenticatedDashboardRoute: typeof OrganizationAuthenticatedDashboardRoute
  OrganizationAuthenticatedLogRoute: typeof OrganizationAuthenticatedLogRoute
  OrganizationAuthenticatedTrendsRoute: typeof OrganizationAuthenticatedTrendsRoute
  OrganizationAuthenticatedWelcomeRoute: typeof OrganizationAuthenticatedWelcomeRoute
  OrganizationAuthenticatedGroupsGroupIdRoute: typeof OrganizationAuthenticatedGroupsGroupIdRoute
  OrganizationAuthenticatedGroupsIndexRoute: typeof OrganizationAuthenticatedGroupsIndexRoute
  OrganizationAuthenticatedOOrgIdAdminRoute: typeof OrganizationAuthenticatedOOrgIdAdminRoute
}

const OrganizationAuthenticatedRouteChildren: OrganizationAuthenticatedRouteChildren =
  {
    OrganizationAuthenticatedDashboardRoute:
      OrganizationAuthenticatedDashboardRoute,
    OrganizationAuthenticatedLogRoute: OrganizationAuthenticatedLogRoute,
    OrganizationAuthenticatedTrendsRoute: OrganizationAuthenticatedTrendsRoute,
    OrganizationAuthenticatedWelcomeRoute:
      OrganizationAuthenticatedWelcomeRoute,
    OrganizationAuthenticatedGroupsGroupIdRoute:
      OrganizationAuthenticatedGroupsGroupIdRoute,
    OrganizationAuthenticatedGroupsIndexRoute:
      OrganizationAuthenticatedGroupsIndexRoute,
    OrganizationAuthenticatedOOrgIdAdminRoute:
      OrganizationAuthenticatedOOrgIdAdminRoute,
  }

const OrganizationAuthenticatedRouteWithChildren =
  OrganizationAuthenticatedRoute._addFileChildren(
    OrganizationAuthenticatedRouteChildren,
  )

interface OrganizationRouteChildren {
  OrganizationAuthenticatedRoute: typeof OrganizationAuthenticatedRouteWithChildren
  OrganizationUnauthenticatedForgotPasswordRoute: typeof OrganizationUnauthenticatedForgotPasswordRoute
  OrganizationUnauthenticatedSignInRoute: typeof OrganizationUnauthenticatedSignInRoute
  OrganizationUnauthenticatedSignUpRoute: typeof OrganizationUnauthenticatedSignUpRoute
}

const OrganizationRouteChildren: OrganizationRouteChildren = {
  OrganizationAuthenticatedRoute: OrganizationAuthenticatedRouteWithChildren,
  OrganizationUnauthenticatedForgotPasswordRoute:
    OrganizationUnauthenticatedForgotPasswordRoute,
  OrganizationUnauthenticatedSignInRoute:
    OrganizationUnauthenticatedSignInRoute,
  OrganizationUnauthenticatedSignUpRoute:
    OrganizationUnauthenticatedSignUpRoute,
}

const OrganizationRouteWithChildren = OrganizationRoute._addFileChildren(
  OrganizationRouteChildren,
)

interface PublicRouteChildren {
  PublicJoinRoute: typeof PublicJoinRoute
  PublicIndexRoute: typeof PublicIndexRoute
}

const PublicRouteChildren: PublicRouteChildren = {
  PublicJoinRoute: PublicJoinRoute,
  PublicIndexRoute: PublicIndexRoute,
}

const PublicRouteWithChildren =
  PublicRoute._addFileChildren(PublicRouteChildren)

export interface FileRoutesByFullPath {
  '': typeof OrganizationAuthenticatedRouteWithChildren
  '/new-log': typeof NewLogRoute
  '/temp-redirect': typeof TempRedirectRoute
  '/join': typeof PublicJoinRoute
  '/d/test': typeof DTestRoute
  '/': typeof PublicIndexRoute
  '/dashboard': typeof OrganizationAuthenticatedDashboardRoute
  '/log': typeof OrganizationAuthenticatedLogRoute
  '/trends': typeof OrganizationAuthenticatedTrendsRoute
  '/welcome': typeof OrganizationAuthenticatedWelcomeRoute
  '/forgot-password': typeof OrganizationUnauthenticatedForgotPasswordRoute
  '/sign-in': typeof OrganizationUnauthenticatedSignInRoute
  '/sign-up': typeof OrganizationUnauthenticatedSignUpRoute
  '/groups/$groupId': typeof OrganizationAuthenticatedGroupsGroupIdRoute
  '/groups': typeof OrganizationAuthenticatedGroupsIndexRoute
  '/o/$orgId/admin': typeof OrganizationAuthenticatedOOrgIdAdminRoute
}

export interface FileRoutesByTo {
  '': typeof OrganizationAuthenticatedRouteWithChildren
  '/new-log': typeof NewLogRoute
  '/temp-redirect': typeof TempRedirectRoute
  '/join': typeof PublicJoinRoute
  '/d/test': typeof DTestRoute
  '/': typeof PublicIndexRoute
  '/dashboard': typeof OrganizationAuthenticatedDashboardRoute
  '/log': typeof OrganizationAuthenticatedLogRoute
  '/trends': typeof OrganizationAuthenticatedTrendsRoute
  '/welcome': typeof OrganizationAuthenticatedWelcomeRoute
  '/forgot-password': typeof OrganizationUnauthenticatedForgotPasswordRoute
  '/sign-in': typeof OrganizationUnauthenticatedSignInRoute
  '/sign-up': typeof OrganizationUnauthenticatedSignUpRoute
  '/groups/$groupId': typeof OrganizationAuthenticatedGroupsGroupIdRoute
  '/groups': typeof OrganizationAuthenticatedGroupsIndexRoute
  '/o/$orgId/admin': typeof OrganizationAuthenticatedOOrgIdAdminRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/_organization': typeof OrganizationRouteWithChildren
  '/_public': typeof PublicRouteWithChildren
  '/new-log': typeof NewLogRoute
  '/temp-redirect': typeof TempRedirectRoute
  '/_organization/_authenticated': typeof OrganizationAuthenticatedRouteWithChildren
  '/_public/join': typeof PublicJoinRoute
  '/d/test': typeof DTestRoute
  '/_public/': typeof PublicIndexRoute
  '/_organization/_authenticated/dashboard': typeof OrganizationAuthenticatedDashboardRoute
  '/_organization/_authenticated/log': typeof OrganizationAuthenticatedLogRoute
  '/_organization/_authenticated/trends': typeof OrganizationAuthenticatedTrendsRoute
  '/_organization/_authenticated/welcome': typeof OrganizationAuthenticatedWelcomeRoute
  '/_organization/_unauthenticated/forgot-password': typeof OrganizationUnauthenticatedForgotPasswordRoute
  '/_organization/_unauthenticated/sign-in': typeof OrganizationUnauthenticatedSignInRoute
  '/_organization/_unauthenticated/sign-up': typeof OrganizationUnauthenticatedSignUpRoute
  '/_organization/_authenticated/groups/$groupId': typeof OrganizationAuthenticatedGroupsGroupIdRoute
  '/_organization/_authenticated/groups/': typeof OrganizationAuthenticatedGroupsIndexRoute
  '/_organization/_authenticated/o/$orgId/admin': typeof OrganizationAuthenticatedOOrgIdAdminRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | ''
    | '/new-log'
    | '/temp-redirect'
    | '/join'
    | '/d/test'
    | '/'
    | '/dashboard'
    | '/log'
    | '/trends'
    | '/welcome'
    | '/forgot-password'
    | '/sign-in'
    | '/sign-up'
    | '/groups/$groupId'
    | '/groups'
    | '/o/$orgId/admin'
  fileRoutesByTo: FileRoutesByTo
  to:
    | ''
    | '/new-log'
    | '/temp-redirect'
    | '/join'
    | '/d/test'
    | '/'
    | '/dashboard'
    | '/log'
    | '/trends'
    | '/welcome'
    | '/forgot-password'
    | '/sign-in'
    | '/sign-up'
    | '/groups/$groupId'
    | '/groups'
    | '/o/$orgId/admin'
  id:
    | '__root__'
    | '/_organization'
    | '/_public'
    | '/new-log'
    | '/temp-redirect'
    | '/_organization/_authenticated'
    | '/_public/join'
    | '/d/test'
    | '/_public/'
    | '/_organization/_authenticated/dashboard'
    | '/_organization/_authenticated/log'
    | '/_organization/_authenticated/trends'
    | '/_organization/_authenticated/welcome'
    | '/_organization/_unauthenticated/forgot-password'
    | '/_organization/_unauthenticated/sign-in'
    | '/_organization/_unauthenticated/sign-up'
    | '/_organization/_authenticated/groups/$groupId'
    | '/_organization/_authenticated/groups/'
    | '/_organization/_authenticated/o/$orgId/admin'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  OrganizationRoute: typeof OrganizationRouteWithChildren
  PublicRoute: typeof PublicRouteWithChildren
  NewLogRoute: typeof NewLogRoute
  TempRedirectRoute: typeof TempRedirectRoute
  DTestRoute: typeof DTestRoute
}

const rootRouteChildren: RootRouteChildren = {
  OrganizationRoute: OrganizationRouteWithChildren,
  PublicRoute: PublicRouteWithChildren,
  NewLogRoute: NewLogRoute,
  TempRedirectRoute: TempRedirectRoute,
  DTestRoute: DTestRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_organization",
        "/_public",
        "/new-log",
        "/temp-redirect",
        "/d/test"
      ]
    },
    "/_organization": {
      "filePath": "_organization.tsx",
      "children": [
        "/_organization/_authenticated",
        "/_organization/_unauthenticated/forgot-password",
        "/_organization/_unauthenticated/sign-in",
        "/_organization/_unauthenticated/sign-up"
      ]
    },
    "/_public": {
      "filePath": "_public.tsx",
      "children": [
        "/_public/join",
        "/_public/"
      ]
    },
    "/new-log": {
      "filePath": "new-log.tsx"
    },
    "/temp-redirect": {
      "filePath": "temp-redirect.tsx"
    },
    "/_organization/_authenticated": {
      "filePath": "_organization/_authenticated.tsx",
      "parent": "/_organization",
      "children": [
        "/_organization/_authenticated/dashboard",
        "/_organization/_authenticated/log",
        "/_organization/_authenticated/trends",
        "/_organization/_authenticated/welcome",
        "/_organization/_authenticated/groups/$groupId",
        "/_organization/_authenticated/groups/",
        "/_organization/_authenticated/o/$orgId/admin"
      ]
    },
    "/_public/join": {
      "filePath": "_public.join.tsx",
      "parent": "/_public"
    },
    "/d/test": {
      "filePath": "d/test.tsx"
    },
    "/_public/": {
      "filePath": "_public.index.tsx",
      "parent": "/_public"
    },
    "/_organization/_authenticated/dashboard": {
      "filePath": "_organization/_authenticated/dashboard.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_authenticated/log": {
      "filePath": "_organization/_authenticated/log.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_authenticated/trends": {
      "filePath": "_organization/_authenticated/trends.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_authenticated/welcome": {
      "filePath": "_organization/_authenticated/welcome.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_unauthenticated/forgot-password": {
      "filePath": "_organization/_unauthenticated/forgot-password.tsx",
      "parent": "/_organization"
    },
    "/_organization/_unauthenticated/sign-in": {
      "filePath": "_organization/_unauthenticated/sign-in.tsx",
      "parent": "/_organization"
    },
    "/_organization/_unauthenticated/sign-up": {
      "filePath": "_organization/_unauthenticated/sign-up.tsx",
      "parent": "/_organization"
    },
    "/_organization/_authenticated/groups/$groupId": {
      "filePath": "_organization/_authenticated/groups/$groupId.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_authenticated/groups/": {
      "filePath": "_organization/_authenticated/groups/index.tsx",
      "parent": "/_organization/_authenticated"
    },
    "/_organization/_authenticated/o/$orgId/admin": {
      "filePath": "_organization/_authenticated/o.$orgId/admin.tsx",
      "parent": "/_organization/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
