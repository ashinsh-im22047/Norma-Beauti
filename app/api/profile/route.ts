import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch the latest user + their customer details
export async function GET() {
  try {
    // We use a LEFT JOIN to get user info AND customer info in one go
    // We order by u.userid DESC to get the latest registered user
    const query = `
      SELECT 
        u.userid, 
        u.email, 
        u.name as original_name,
        c.fullName, 
        c.address, 
        c.phoneNumber, 
        c.dob, 
        c.gender 
      FROM user u 
      LEFT JOIN customer c ON u.userid = c.userid 
      ORDER BY u.userid DESC 
      LIMIT 1
    `;
    
    const [rows]: any = await db.query(query);

    if (rows.length === 0) {
        return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const userData = rows[0];

    // Prepare the data for the frontend
    // If 'fullName' exists in customer table, use it. Otherwise use 'name' from user table.
    const profile = {
        userid: userData.userid,
        name: userData.fullName || userData.original_name,
        email: userData.email,
        phone: userData.phoneNumber || '',
        address: userData.address || '',
        dob: userData.dob || '',
        gender: userData.gender || ''
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update the profile
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userid, name, email, phone, address, dob, gender } = body;

    // 1. Update the base User table (Email)
    await db.query('UPDATE user SET email = ? WHERE userid = ?', [email, userid]);

    // 2. Check if a Customer record already exists for this user
    const [customerCheck]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userid]);

    if (customerCheck.length > 0) {
        // SCENARIO A: Record exists -> UPDATE it
        await db.query(
            'UPDATE customer SET fullName=?, address=?, phoneNumber=?, dob=?, gender=? WHERE userid=?',
            [name, address, phone, dob, gender, userid]
        );
    } else {
        // SCENARIO B: No record -> INSERT new one
        await db.query(
            'INSERT INTO customer (userid, fullName, address, phoneNumber, dob, gender) VALUES (?, ?, ?, ?, ?, ?)',
            [userid, name, address, phone, dob, gender]
        );
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}