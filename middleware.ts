import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // 1. Get the path user is trying to visit
  const path = request.nextUrl.pathname;
  
  // 2. Define which paths are protected
  // This checks if the user is trying to go ANYWHERE inside /admin
  const isAdminRoute = path.startsWith('/admin');

  // 3. Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // --- SECURITY CHECK ---
  if (isAdminRoute) {
    
    // CASE A: User has NO token (Not logged in at all)
    if (!token) {
      // Redirect them to the Login page immediately
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // CASE B: User HAS a token, but let's check if it's valid
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
      const { payload } = await jwtVerify(token, secret);

      // CASE C: User is logged in, but is NOT an Admin (e.g. a customer trying to hack in)
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If we get here, the user is a valid Admin. Let them pass.
      return NextResponse.next();

    } catch (error) {
      // CASE D: Token is fake, expired, or tampered with
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow all other requests (like /login, /register, public pages) to pass
  return NextResponse.next();
}

// Configuration: Tell Next.js to run this middleware ONLY on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};