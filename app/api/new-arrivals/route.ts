// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Select top 4 products, sorted by ID descending (Newest first)
    const [products]: any = await db.query(
      'SELECT * FROM product ORDER BY productid DESC LIMIT 4'
    );
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("New Arrivals Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}