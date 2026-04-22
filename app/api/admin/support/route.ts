// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

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
      // --- ENHANCEMENT: Allow saving admin reply for complaints ---
      if (admin_reply !== undefined) {
          await db.query('UPDATE complaints SET status = ?, admin_reply = ? WHERE complaintid = ?', [status, admin_reply, id]);
      } else {
          await db.query('UPDATE complaints SET status = ? WHERE complaintid = ?', [status, id]);
      }

      // --- ADDED: NOTIFICATION TRIGGER FOR COMPLAINTS ---
      try {
          const [reqData]: any = await db.query(`SELECT orderid FROM complaints WHERE complaintid = ?`, [id]);
          if (reqData.length > 0) {
              const orderId = reqData[0].orderid;
              const [orderData]: any = await db.query('SELECT customerid FROM `order` WHERE orderid = ?', [orderId]);
              if (orderData.length > 0) {
                  const customerId = orderData[0].customerid;
                  const title = `Complaint Update (Order #${orderId})`;
                  const message = admin_reply ? `Admin replied to your complaint:\n\n"${admin_reply}"` : `The status of your complaint has been changed to ${status}.`;

                  await db.query(
                      `INSERT INTO notifications (customerid, title, message, type, reference_id, is_read, date) VALUES (?, ?, ?, 'COMPLAINT', ?, 0, NOW())`,
                      [customerId, title, message, orderId]
                  );
              }
          }
      } catch(e) { console.error("Notification Error:", e) }

      return NextResponse.json({ message: "Complaint status updated!" });
    } 
    else if (type === 'return') {
      await db.query('UPDATE return_requests SET status = ?, admin_reply = ? WHERE returnid = ?', [status, admin_reply || null, id]);
      
      // --- ADDED: NOTIFICATION TRIGGER FOR RETURNS ---
      try {
          const [reqData]: any = await db.query(`SELECT orderid FROM return_requests WHERE returnid = ?`, [id]);
          if (reqData.length > 0) {
              const orderId = reqData[0].orderid;
              const [orderData]: any = await db.query('SELECT customerid FROM `order` WHERE orderid = ?', [orderId]);
              if (orderData.length > 0) {
                  const customerId = orderData[0].customerid;
                  const title = `Return Request ${status}`;
                  let message = `Your return request for Order #${orderId} has been ${status.toLowerCase()}.`;
                  if (admin_reply) message += `\n\nAdmin Note: "${admin_reply}"`;

                  await db.query(
                      `INSERT INTO notifications (customerid, title, message, type, reference_id, is_read, date) VALUES (?, ?, ?, 'RETURN', ?, 0, NOW())`,
                      [customerId, title, message, orderId]
                  );
              }
          }
      } catch(e) { console.error("Notification Error:", e) }

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

// Delete Bad Reviews Permanently OR Bulk Delete Selected Items
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeQuery = searchParams.get('type');
    const idQuery = searchParams.get('id');

    // Handle individual deletion (Single Review Delete)
    if (typeQuery && idQuery) {
        if (typeQuery === 'review') {
            await db.query('DELETE FROM product_reviews WHERE reviewid = ?', [idQuery]);
            return NextResponse.json({ message: "Review deleted successfully." });
        }
    }

    // Handle bulk deletion from body payload (For Selected Returns, Complaints, Reviews)
    const body = await req.json().catch(() => null);
    if (body && body.type && body.ids && Array.isArray(body.ids)) {
        const { type, ids } = body;
        if (ids.length === 0) return NextResponse.json({ error: "No items to delete" }, { status: 400 });

        // Generate placeholders (?,?,?) for the SQL IN clause based on array length
        const placeholders = ids.map(() => '?').join(',');

        if (type === 'review') {
            await db.query(`DELETE FROM product_reviews WHERE reviewid IN (${placeholders})`, ids);
        } else if (type === 'complaint') {
            await db.query(`DELETE FROM complaints WHERE complaintid IN (${placeholders})`, ids);
        } else if (type === 'return') {
            await db.query(`DELETE FROM return_requests WHERE returnid IN (${placeholders})`, ids);
        } else {
            return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
        }

        return NextResponse.json({ message: "Selected items deleted successfully." });
    }

    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  } catch (error) {
    console.error("Admin Support DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}