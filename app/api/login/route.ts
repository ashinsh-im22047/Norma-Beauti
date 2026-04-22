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

    // 1. Check User
    const [rows]: any = await db.query(
      'SELECT * FROM user WHERE email = ?', 
      [email] 
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = rows[0];

    // 2. Verify Password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // --- 3. CHECK EMAIL VERIFICATION (New Logic) ---
    // We check the database column. Assuming it is named 'isVerified' or 'is_verified'.
    // Adjust 'user.isVerified' if your DB column name is different (e.g., user.is_verified).
    const isVerified = user.isVerified === 1 || user.isVerified === true;

    if (!isVerified) {
        // SECURITY: We return here immediately. 
        // We do NOT generate a token. We do NOT set a cookie.
        // We return the user object so the frontend knows to show the "Verification Required" dialog.
        return NextResponse.json({ 
            message: "Verification pending",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: false // Frontend uses this to block access
            }
        }, { status: 200 }); 
    }

    // --- 4. Generate Token (Only if Verified) ---
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const tokenRole = user.role.toLowerCase(); 

    const expiry = tokenRole === 'admin' ? '1h' : '7d';
    const maxAge = tokenRole === 'admin' ? 3600 : 604800;

    const token = await new SignJWT({ id: user.id, role: tokenRole }) 
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiry) 
      .sign(secret);

    // 5. Create Response with Cookie
    const response = NextResponse.json({ 
        message: "Login Successful", 
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: true 
        }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}