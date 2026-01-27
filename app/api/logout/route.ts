import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Forcefully delete 'user_session' by setting expiry to the past
  response.cookies.set({
    name: 'user_session',
    value: '',
    path: '/',
    expires: new Date(0), // Set to 1970 (expired)
  });

  // Forcefully delete 'token' (used for Admin check) just in case
  response.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    expires: new Date(0),
  });

  return response;
}