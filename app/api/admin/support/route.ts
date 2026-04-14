import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Fetch all Reviews, Complaints, and Returns
export async function GET() {
  try {
    const [reviews]: any = await db.query('SELECT * FROM product_reviews ORDER BY date DESC');
    const [complaints]: any = await db.query('SELECT * FROM complaints ORDER BY date DESC');
    const [returns]: any = await db.query('SELECT * FROM return_requests ORDER BY date DESC');
    
    return NextResponse.json({ reviews, complaints, returns });
  } catch (error) {
    console.error("Admin Support GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch support data" }, { status: 500 });
  }
}

// Update Complaints, Return Requests, and Hide/Unhide Reviews
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { type, id, status, admin_reply, is_hidden } = body;

    if (type === 'complaint') {
      await db.query('UPDATE complaints SET status = ? WHERE complaintid = ?', [status, id]);
      return NextResponse.json({ message: "Complaint status updated!" });
    } 
    else if (type === 'return') {
      await db.query('UPDATE return_requests SET status = ?, admin_reply = ? WHERE returnid = ?', [status, admin_reply || null, id]);
      return NextResponse.json({ message: `Return request ${status}!` });
    }
    else if (type === 'review') {
      // Toggle the hidden status in the database (0 is visible, 1 is hidden)
      await db.query('UPDATE product_reviews SET is_hidden = ? WHERE reviewid = ?', [is_hidden ? 1 : 0, id]);
      return NextResponse.json({ message: is_hidden ? "Review is now hidden from the public." : "Review is visible again." });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin Support PUT Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

// Delete Bad Reviews Permanently
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (type === 'review') {
      await db.query('DELETE FROM product_reviews WHERE reviewid = ?', [id]);
      return NextResponse.json({ message: "Review deleted successfully." });
    }

    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  } catch (error) {
    console.error("Admin Support DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}