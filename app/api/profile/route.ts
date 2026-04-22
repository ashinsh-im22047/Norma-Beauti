// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper: Verify User
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// GET: Fetch Profile
// ------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("Fetching profile for ID:", userId);

    // FIX 1: User table likely uses 'id', not 'userid'
    // FIX 2: Customer table uses 'userid' (from your screenshot)
    // FIX 3: Using 'u.fullName' or 'u.username' (checking both via COALESCE if uncertain, but usually 'username')
    
    // We try to select 'u.id' first to ensure table alias is correct.
    // If your user table has 'username', keep u.username. If it has 'name', change to u.ame.
    const query = `
      SELECT 
        u.email, 
        c.fullName, 
        c.phoneNumber, 
        c.address, 
        c.dob, 
        c.gender 
      FROM user u
      LEFT JOIN customer c ON u.id = c.userid 
      WHERE u.id = ?
    `;

    const [rows]: any = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];

    // Map DB columns to Frontend keys
    const profileData = {
      email: user.email,
      // Priority: Customer FullName -> User Username -> Empty
      name: user.fullName || user.username || '', 
      phone: user.phoneNumber || '', 
      address: user.address || '',
      dob: user.dob || '',
      gender: user.gender || ''
    };

    return NextResponse.json(profileData);

  } catch (error: any) {
    // IMPORTANT: Check your VS Code Terminal for this error message!
    console.error("PROFILE GET SQL ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// PUT: Update Profile
// ------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // 1. Check existing customer record
    // Use 'userid' because that is the column in the CUSTOMER table
    const [existingRows]: any = await db.query('SELECT * FROM customer WHERE userid = ?', [userId]);
    const current = existingRows[0] || {};
    
    // 2. Prepare Data (Merge new with old)
    const newFullName = body.name ?? current.fullName; 
    const newPhone = body.phone ?? current.phoneNumber; 
    const newAddress = body.address ?? current.address;
    const newDob = body.dob ?? current.dob;
    const newGender = body.gender ?? current.gender;

    // 3. Update or Insert
    if (existingRows.length > 0) {
      await db.query(
        `UPDATE customer 
         SET fullName = ?, phoneNumber = ?, address = ?, dob = ?, gender = ? 
         WHERE userid = ?`,
        [newFullName, newPhone, newAddress, newDob, newGender, userId]
      );
    } else {
      await db.query(
        `INSERT INTO customer (userid, fullName, phoneNumber, address, dob, gender) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, newFullName, newPhone, newAddress, newDob, newGender]
      );
    }

    // 4. Update User Email (using u.id)
    if (body.email) {
       await db.query('UPDATE user SET email = ? WHERE id = ?', [body.email, userId]);
    }

    return NextResponse.json({ message: "Profile saved successfully" });

  } catch (error: any) {
    console.error("PROFILE PUT ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}