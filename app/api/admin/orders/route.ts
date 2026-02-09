import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch ALL orders (Newest first)
export async function GET() {
  try {
    const [orders]: any = await db.query(`
      SELECT * FROM \`order\` ORDER BY orderdate DESC
    `);
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update Order Status
export async function PUT(req: Request) {
  try {
    const { orderId, status } = await req.json();
    
    // Update the status in the database
    await db.query('UPDATE \`order\` SET status = ? WHERE orderid = ?', [status, orderId]);
    
    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}