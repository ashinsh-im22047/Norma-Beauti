// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const body = await req.json();
    // Added 'images' to the destructuring
    const { type, orderId, productId, itemId, message, rating, reason, customerName, images } = body;
    
    // Safely use the name passed from the frontend, or default to "Verified Customer"
    const nameToUse = customerName || 'Verified Customer';

    // Convert images array to JSON string to save in database
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : '[]';

    if (type === 'review') {
        await db.query(
            `INSERT INTO product_reviews (orderid, productid, itemid, customer_name, rating, comment, images) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderId, productId || null, itemId || null, nameToUse, rating, message, imagesJson]
        );
        return NextResponse.json({ message: "Review submitted successfully! Thank you for your feedback." });
    } 
    
    else if (type === 'complaint') {
        await db.query(
            `INSERT INTO complaints (orderid, customer_name, message, images) 
             VALUES (?, ?, ?, ?)`,
            [orderId, nameToUse, message, imagesJson]
        );
        return NextResponse.json({ message: "Complaint filed successfully. Our team will contact you shortly." });
    } 
    
    else if (type === 'return') {
        await db.query(
            `INSERT INTO return_requests (orderid, productid, itemid, customer_name, reason, images) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, productId || null, itemId || null, nameToUse, reason, imagesJson]
        );
        return NextResponse.json({ message: "Return request submitted! An admin will review it soon." });
    }

    return NextResponse.json({ error: "Invalid submission type" }, { status: 400 });

  } catch (error) {
    console.error("Support API Error:", error);
    return NextResponse.json({ error: "A system error occurred. Please try again." }, { status: 500 });
  }
}