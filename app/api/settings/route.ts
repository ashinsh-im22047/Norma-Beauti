// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [minRows]: any = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'delivery_min'");
    const [maxRows]: any = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'delivery_max'");
    const [feeRows]: any = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'delivery_fee'");
    
    // Provide safe fallbacks if the database happens to be empty
    const min_delivery_days = minRows.length > 0 ? parseInt(minRows[0].setting_value) : 3;
    const max_delivery_days = maxRows.length > 0 ? parseInt(maxRows[0].setting_value) : 5;
    const delivery_fee = feeRows.length > 0 ? parseFloat(feeRows[0].setting_value) : 350; // Default 350 LKR

    return NextResponse.json({ min_delivery_days, max_delivery_days, delivery_fee });
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ min_delivery_days: 3, max_delivery_days: 5, delivery_fee: 350 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // If saving delivery days
    if (body.min_days !== undefined && body.max_days !== undefined) {
        const { min_days, max_days } = body;
        await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('delivery_min', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [min_days, min_days]);
        await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('delivery_max', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [max_days, max_days]);
    }
    
    // If saving delivery fee
    if (body.delivery_fee !== undefined) {
        await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('delivery_fee', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [body.delivery_fee, body.delivery_fee]);
    }
    
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}