// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// --- ADD THIS LINE TO FIX THE "GHOST ITEM" ISSUE ---
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM category');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    const newId = `cat_${Date.now()}`; 

    await db.query(
      'INSERT INTO category (categoryid, categoryname, categorydescription) VALUES (?, ?, ?)',
      [newId, name, description]
    );

    return NextResponse.json({ message: "Category created", id: newId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}