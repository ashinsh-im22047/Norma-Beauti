// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Fetch the current delivery estimate (For Checkout Page & Admin)
export async function GET() {
  try {
    const [rows]: any = await db.query('SELECT * FROM system_settings WHERE setting_key IN ("delivery_min", "delivery_max")');
    
    let minDays = 3;
    let maxDays = 8;

    rows.forEach((row: any) => {
      if (row.setting_key === 'delivery_min') minDays = parseInt(row.setting_value);
      if (row.setting_key === 'delivery_max') maxDays = parseInt(row.setting_value);
    });

    return NextResponse.json({ minDays, maxDays });
  } catch (error) {
    console.error("Settings Fetch Error:", error);
    return NextResponse.json({ minDays: 3, maxDays: 8 }); // Fallback
  }
}

// Update the delivery estimate (For Admin Dashboard)
export async function POST(req: Request) {
  try {
    const { minDays, maxDays } = await req.json();

    if (!minDays || !maxDays) {
        return NextResponse.json({ error: "Missing values" }, { status: 400 });
    }

    // Update the values in the database
    await db.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = "delivery_min"', [minDays.toString()]);
    await db.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = "delivery_max"', [maxDays.toString()]);

    return NextResponse.json({ success: true, message: "Delivery estimate updated!" });
  } catch (error) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}