// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  try {
    if (orderId) {
      const [products]: any = await db.query(`
        SELECT op.productid, op.quantity, op.amount, p.productname as name, p.imageurl as image 
        FROM orderedproducts op JOIN product p ON op.productid = p.productid WHERE op.orderid = ?
      `, [orderId]);
      return NextResponse.json(products);
    } else {
      const [orders]: any = await db.query('SELECT * FROM `order` ORDER BY orderdate DESC');
      return NextResponse.json(orders);
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// --- PUT: Update Order Status & Refund Stock if Cancelled ---
export async function PUT(req: Request) {
  try {
    const { orderId, status } = await req.json();
    
    // 1. Get the current status to prevent "double-refunding"
    const [currentOrder]: any = await db.query('SELECT status FROM `order` WHERE orderid = ?', [orderId]);
    if (currentOrder.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const currentStatus = currentOrder[0].status;

    // 2. Update the status in the database
    await db.query('UPDATE `order` SET status = ? WHERE orderid = ?', [status, orderId]);
    
    // 3. --- If changed to Cancelled/Rejected, Refund the Stock! ---
    if ((status === 'Cancelled' || status === 'Rejected') && currentStatus !== 'Cancelled' && currentStatus !== 'Rejected') {
        // Refund Products
        const [products]: any = await db.query('SELECT productid, quantity FROM orderedproducts WHERE orderid = ?', [orderId]);
        for (const p of products) {
            await db.query('UPDATE product SET availablequantity = availablequantity + ? WHERE productid = ?', [p.quantity, p.productid]);
        }
        // Refund Items (Gift Boxes)
        const [items]: any = await db.query('SELECT itemid, quantity FROM ordereditems WHERE orderid = ?', [orderId]);
        for (const i of items) {
            await db.query('UPDATE item SET itemquantity = itemquantity + ? WHERE itemid = ?', [i.quantity, i.itemid]);
        }
    }

    // 4. --- NEW: SEND AUTO NOTIFICATION TO CUSTOMER ---
    if (status !== currentStatus) {
        try {
            const [orderData]: any = await db.query('SELECT customerid FROM `order` WHERE orderid = ?', [orderId]);
            if (orderData.length > 0) {
                const customerId = orderData[0].customerid;
                let title = `Order Status: ${status}`;
                let message = `Your order #${orderId} is now marked as ${status}.`;
                
                if (status === 'Delivered') message = `Great news! Your order #${orderId} has been successfully delivered.`;
                if (status === 'Processing') message = `We are now processing your order #${orderId}. It will be delivered soon!`;
                if (status === 'Cancelled' || status === 'Rejected') message = `Unfortunately, your order #${orderId} has been ${status.toLowerCase()}.`;

                await db.query(
                    `INSERT INTO notifications (customerid, title, message, type, reference_id, is_read, date) VALUES (?, ?, ?, 'ORDER', ?, 0, NOW())`,
                    [customerId, title, message, orderId]
                );
            }
        } catch(e) { console.error("Notification Error:", e) }
    }

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}