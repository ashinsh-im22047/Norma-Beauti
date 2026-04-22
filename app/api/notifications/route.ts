// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

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

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [custRows]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userId]);
        if (custRows.length === 0) return NextResponse.json([]);
        const customerId = custRows[0].id;

        const [notifications]: any = await db.query(
            'SELECT * FROM notifications WHERE customerid = ? ORDER BY date DESC',
            [customerId]
        );
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [body.id]);
        return NextResponse.json({ success: true });
    } catch(e) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

// --- NEW: DELETE NOTIFICATION ---
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (id) {
            await db.query('DELETE FROM notifications WHERE id = ?', [id]);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    } catch(e) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}