import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose'; 

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Check User (We accept BOTH 'ADMIN' and 'customer' here)
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

    // 3. Generate Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    
    // Convert DB role to lowercase for the token (middleware prefers lowercase)
    const tokenRole = user.role.toLowerCase(); 

    // Set expiry: 1 hour for Admin, 7 days for others
    const expiry = tokenRole === 'admin' ? '1h' : '7d';
    const maxAge = tokenRole === 'admin' ? 3600 : 604800;

    const token = await new SignJWT({ id: user.id, role: tokenRole }) 
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiry) 
      .sign(secret);

    // 4. Create Response
    const response = NextResponse.json({ 
        message: "Login Successful", 
        user: {
            id: user.id,
            email: user.email,
            // Return the role EXACTLY as it is in the database ('ADMIN') 
            // so the frontend check (role === 'ADMIN') works.
            role: user.role 
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