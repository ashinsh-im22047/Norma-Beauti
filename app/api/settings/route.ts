import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [minRows]: any = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'delivery_min'");
    const [maxRows]: any = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'delivery_max'");
    
    // Provide safe fallbacks if the database happens to be empty
    const min_delivery_days = minRows.length > 0 ? parseInt(minRows[0].setting_value) : 3;
    const max_delivery_days = maxRows.length > 0 ? parseInt(maxRows[0].setting_value) : 5;

    return NextResponse.json({ min_delivery_days, max_delivery_days });
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ min_delivery_days: 3, max_delivery_days: 5 });
  }
}

export async function POST(req: Request) {
  try {
    const { min_days, max_days } = await req.json();
    
    // Upsert logic for safety
    await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('delivery_min', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [min_days, min_days]);
    await db.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('delivery_max', ?) ON DUPLICATE KEY UPDATE setting_value = ?", [max_days, max_days]);
    
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}