import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  // Firebase auth is client-side; middleware handles cookie-based session
  // For a production app, you'd verify a Firebase session cookie here.
  // This is a client-side guard via useAuth + redirect in components.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
