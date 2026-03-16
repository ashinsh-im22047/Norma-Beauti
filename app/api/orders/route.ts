import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper: Verify User
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch {
    return null;
  }
}

// Helper: Generate Random Unique Order ID
async function generateUniqueOrderId() {
  let isUnique = false;
  let randomId = 0;
  while (!isUnique) {
    randomId = Math.floor(100000 + Math.random() * 900000);
    const [rows]: any = await db.query('SELECT orderid FROM `order` WHERE orderid = ?', [randomId]);
    if (rows.length === 0) isUnique = true;
  }
  return randomId;
}

// --- GET: Fetch Orders ---
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userId]);
    
    if (custRows.length === 0) return NextResponse.json([]);
    
    const customerId = custRows[0].id; 

    const [orders]: any = await db.query(
        `SELECT * FROM \`order\` WHERE customerid = ? ORDER BY orderdate DESC`, 
        [customerId]
    );
    return NextResponse.json(orders);

  } catch (error: any) {
    console.error("GET ORDER ERROR:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// --- POST: Place Order & Clear Cart & Deduct Stock ---
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, total, method, slip, details } = body;

    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userId]);
    if (custRows.length === 0) {
        return NextResponse.json({ error: "Customer profile not found." }, { status: 400 });
    }
    const customerId = custRows[0].id;

    const [cartRows]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerId]);
    const cartId = cartRows.length > 0 ? cartRows[0].cartid : null;

    const newOrderId = await generateUniqueOrderId();

    // 1. Insert Order 
    await db.query(
      `INSERT INTO \`order\` (orderid, customerid, totalamount, paymentmethod, paymentslip, shipping_name, shipping_address, shipping_phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`, 
      [newOrderId, customerId, total, method, slip || null, details.name, details.address, details.phone]
    );

    // 2. Insert Items, Deduct Stock, Remove from Cart
    for (const item of items) {
      if (item.type === 'product') {
        await db.query('INSERT INTO orderedproducts (orderid, productid, quantity, amount) VALUES (?, ?, ?, ?)', [newOrderId, item.id, item.quantity, item.price]);
        
        // --- NEW: Deduct from product inventory ---
        await db.query('UPDATE product SET availablequantity = availablequantity - ? WHERE productid = ?', [item.quantity, item.id]);
        
        if (cartId) await db.query('DELETE FROM cartproducts WHERE cartid = ? AND productid = ?', [cartId, item.id]);
      } else {
        await db.query('INSERT INTO ordereditems (orderid, itemid, quantity, amount) VALUES (?, ?, ?, ?)', [newOrderId, item.id, item.quantity, item.price]);
        
        // --- NEW: Deduct from item inventory ---
        await db.query('UPDATE item SET itemquantity = itemquantity - ? WHERE itemid = ?', [item.quantity, item.id]);
        
        if (cartId) await db.query('DELETE FROM cartitems WHERE cartid = ? AND itemid = ?', [cartId, item.id]);
      }
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: newOrderId });

  } catch (error: any) {
    console.error("ORDER API ERROR:", error.message);
    return NextResponse.json({ error: "Order failed: " + error.message }, { status: 500 });
  }
}

// --- DELETE: Cancel or Delete Order & Refund Stock ---
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const action = searchParams.get('action'); // 'cancel' or 'delete'

  if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  try {
    const [order]: any = await db.query('SELECT status FROM `order` WHERE orderid = ?', [orderId]);
    
    if (order.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === 'delete') {
        await db.query('DELETE FROM orderedproducts WHERE orderid = ?', [orderId]);
        await db.query('DELETE FROM ordereditems WHERE orderid = ?', [orderId]);
        await db.query('DELETE FROM `order` WHERE orderid = ?', [orderId]);
        return NextResponse.json({ message: "Order deleted from history" });
    } else {
        if (order[0].status !== 'Pending') {
            return NextResponse.json({ error: "Cannot cancel processed order." }, { status: 403 });
        }
        
        // --- NEW: If user cancels a pending order, refund the stock! ---
        
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

        // Finally, update status to Cancelled
        await db.query('UPDATE `order` SET status = "Cancelled" WHERE orderid = ?', [orderId]);
        return NextResponse.json({ message: "Order cancelled successfully" });
    }

  } catch (error: any) {
    console.error("Order Action Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}