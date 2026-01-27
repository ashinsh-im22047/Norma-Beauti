import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get the user's session token
  const token = request.cookies.get('user_session')?.value || '';

  // 1. PUBLIC PATHS: Allow everyone to see these pages
  // We allow '/' (Landing), '/shop' (Products), '/login', and '/register'
  if (path === '/' || path === '/shop' || path === '/login' || path === '/register') {
    
    // Optional: If user is ALREADY logged in and tries to go to Login/Register, send them to Shop
    if (token && (path === '/login' || path === '/register')) {
       return NextResponse.redirect(new URL('/shop', request.url));
    }
    return NextResponse.next();
  }

  // 2. PROTECTED PATHS: Check for Admin, Cart, or Profile
  // If no token, redirect to Login
  if (!token) {
    if (path.startsWith('/admin') || path === '/cart' || path === '/profile') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. ADMIN CHECK (Optional safety)
  // If needed, you can add logic here to ensure non-admins don't visit /admin
  
  return NextResponse.next();
}

// Update Matcher to include the new paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/shop',
    '/cart',
    '/profile',
    '/admin/:path*',
  ],
};