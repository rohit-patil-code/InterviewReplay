import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Define paths
    const authPaths = ['/login', '/register']
    const publicPaths = ['/']

    // 1. If user is logged in (has token) and tries to access auth paths, redirect to dashboard
    if (token && authPaths.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 2. If user is NOT logged in and tries to access protected paths (not public, not auth)
    //    Redirect to home page "/" as per requirement
    if (!token && !publicPaths.includes(pathname) && !authPaths.includes(pathname)) {
        // Allow static files, api routes, etc to pass through if needed, strictly redirecting pages for now
        // Simple check: if it's not root, login, or register, it's protected.
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
