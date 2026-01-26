import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // -------------------------------------------------------------
  // 1. ADMIN PROTECTION (Your Existing Secure Logic)
  // -------------------------------------------------------------
  if (path.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== 'admin') {
        // If not admin, kick them to customer home
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Valid Admin -> Let them pass
      return NextResponse.next();

    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // -------------------------------------------------------------
  // 2. CUSTOMER PROTECTION (New "Gatekeeper" Logic)
  // -------------------------------------------------------------
  
  // Define which customer pages need the "Pass" (Cookie)
  // We include '/' because you want to protect the Home Page too
  const protectedCustomerPaths = ['/', '/profile', '/cart', '/shop'];
  
  const isProtectedCustomerPath = protectedCustomerPaths.some(p => 
    path === p || path.startsWith(p + '/')
  );

  const userSession = request.cookies.get('user_session')?.value;

  // RULE A: If trying to visit a protected page WITHOUT a session -> Go to Login
  if (isProtectedCustomerPath && !userSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RULE B: If user IS logged in, but tries to visit Login/Register -> Go to Home
  // (Prevents them from seeing the login screen again unnecessarily)
  if ((path === '/login' || path === '/register') && userSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow all other traffic
  return NextResponse.next();
}

// -------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------
export const config = {
  // We updated the matcher to watch Admin routes AND Customer routes
  // Excludes images, api, and next.js static files to keep it fast
  matcher: [
    '/admin/:path*', 
    '/', 
    '/profile/:path*', 
    '/cart/:path*', 
    '/shop/:path*',
    '/login',
    '/register'
  ],
};