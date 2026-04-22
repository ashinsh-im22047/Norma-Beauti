// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose'; 

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. DATABASE CHECK: Use "ADMIN" (Uppercase) to match your database
    const [rows]: any = await db.query(
      'SELECT * FROM user WHERE email = ? AND role = ?', 
      [email, 'ADMIN'] 
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    
    // 2. TOKEN CREATION: Use "admin" (Lowercase) to match your middleware
    const token = await new SignJWT({ id: user.id, role: 'admin' }) 
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') 
      .sign(secret);

    const response = NextResponse.json({ message: "Admin Login Successful", role: "admin" });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}