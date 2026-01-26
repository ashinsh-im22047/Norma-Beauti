import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');

    let sqlQuery = '';
    let params = [];

    if (queryId) {
        // CORRECTION: Removed 'u.name' because it doesn't exist in your User table
        sqlQuery = `
          SELECT 
            u.id as userid, 
            u.email, 
            c.fullName, 
            c.address, 
            c.phoneNumber, 
            c.dob, 
            c.gender 
          FROM user u 
          LEFT JOIN customer c ON u.id = c.userId 
          WHERE u.id = ?`;
        params.push(queryId);
    } else {
        // Fallback: Latest User
        sqlQuery = `
          SELECT 
            u.id as userid, 
            u.email, 
            c.fullName, 
            c.address, 
            c.phoneNumber, 
            c.dob, 
            c.gender 
          FROM user u 
          LEFT JOIN customer c ON u.id = c.userId 
          ORDER BY u.id DESC LIMIT 1`;
    }

    const [rows]: any = await db.query(sqlQuery, params);

    if (rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = rows[0];

    const profile = {
        userid: userData.userid,
        // If fullName exists, use it. If not, use the part of email before '@' as a placeholder
        name: userData.fullName || userData.email.split('@')[0], 
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        address: userData.address || '',
        dob: userData.dob ? new Date(userData.dob).toISOString().split('T')[0] : '',
        gender: userData.gender || ''
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update Profile
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userid, name, email, phone, address, dob, gender } = body;

    // 1. Update User Table (Email only)
    await db.query('UPDATE user SET email = ? WHERE id = ?', [email, userid]);

    // 2. Check Customer Table
    const [existing]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userid]);

    if (existing.length > 0) {
        // Update
        await db.query(
            'UPDATE customer SET fullName=?, address=?, phoneNumber=?, dob=?, gender=? WHERE userId=?',
            [name, address, phone, dob, gender, userid]
        );
    } else {
        // Create
        await db.query(
            'INSERT INTO customer (userId, fullName, address, phoneNumber, dob, gender) VALUES (?, ?, ?, ?, ?, ?)',
            [userid, name, address, phone, dob, gender]
        );
    }

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}