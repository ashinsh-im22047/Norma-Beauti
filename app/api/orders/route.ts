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

    // 1. Get Customer ID (Schema: customer table uses 'id' as PK, 'userId' as FK)
    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userId]);
    
    if (custRows.length === 0) return NextResponse.json([]);
    
    const customerId = custRows[0].id; // Corrected: Uses 'id' from customer table

    // 2. Fetch Orders
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

// --- POST: Place Order & Clear Cart ---
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, total, method, slip, details } = body;

    // 1. Get Customer ID & Cart ID
    // Schema Check: 
    // - Customer table uses 'id' for primary key and 'userId' for foreign key.
    // - Cart table uses 'cartid' for primary key and 'customerid' (not userid directly based on your screenshot, but let's assume it links via customerid or userid. Standard logic is usually userid. Based on your previous code it was userid. If cart uses customerid, we need to fetch customer first).
    
    // Fetch Customer
    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userId = ?', [userId]);
    if (custRows.length === 0) {
        return NextResponse.json({ error: "Customer profile not found." }, { status: 400 });
    }
    const customerId = custRows[0].id; // Correct: 'id' is PK of customer

    // Fetch Cart (Based on screenshot, cart has 'customerid', so we query by that)
    const [cartRows]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerId]);
    const cartId = cartRows.length > 0 ? cartRows[0].cartid : null; // Correct: 'cartid' is PK of cart

    // 2. Generate Order ID
    const newOrderId = await generateUniqueOrderId();

    // 3. Insert Order 
    await db.query(
      `INSERT INTO \`order\` (orderid, customerid, totalamount, paymentmethod, paymentslip, shipping_name, shipping_address, shipping_phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`, 
      [newOrderId, customerId, total, method, slip || null, details.name, details.address, details.phone]
    );

    // 4. Insert Items & Remove from Cart
    for (const item of items) {
      if (item.type === 'product') {
        // A. Insert into Order
        await db.query(
            'INSERT INTO orderedproducts (orderid, productid, quantity, amount) VALUES (?, ?, ?, ?)', 
            [newOrderId, item.id, item.quantity, item.price] 
        );
        // B. Remove from CartProducts (Uses cartid)
        if (cartId) {
            await db.query('DELETE FROM cartproducts WHERE cartid = ? AND productid = ?', [cartId, item.id]);
        }
      } else {
        // A. Insert into Order
        await db.query(
            'INSERT INTO ordereditems (orderid, itemid, quantity, amount) VALUES (?, ?, ?, ?)', 
            [newOrderId, item.id, item.quantity, item.price] 
        );
        // B. Remove from CartItems (Uses cartid)
        if (cartId) {
            await db.query('DELETE FROM cartitems WHERE cartid = ? AND itemid = ?', [cartId, item.id]);
        }
      }
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: newOrderId });

  } catch (error: any) {
    console.error("ORDER API ERROR:", error.message);
    return NextResponse.json({ error: "Order failed: " + error.message }, { status: 500 });
  }
}

// ... (Existing Imports and Code) ...

// --- DELETE: Cancel or Delete Order ---
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const action = searchParams.get('action'); // 'cancel' or 'delete'

  if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  try {
    const [order]: any = await db.query('SELECT status FROM `order` WHERE orderid = ?', [orderId]);
    
    if (order.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === 'delete') {
        // Hard Delete (Remove from history)
        // Note: You might need to delete related items in orderedproducts/ordereditems first if you don't have CASCADE delete set up in your DB.
        await db.query('DELETE FROM orderedproducts WHERE orderid = ?', [orderId]);
        await db.query('DELETE FROM ordereditems WHERE orderid = ?', [orderId]);
        await db.query('DELETE FROM `order` WHERE orderid = ?', [orderId]);
        return NextResponse.json({ message: "Order deleted from history" });
    } else {
        // Soft Cancel (Update Status)
        if (order[0].status !== 'Pending') {
            return NextResponse.json({ error: "Cannot cancel processed order." }, { status: 403 });
        }
        await db.query('UPDATE `order` SET status = "Cancelled" WHERE orderid = ?', [orderId]);
        return NextResponse.json({ message: "Order cancelled successfully" });
    }

  } catch (error: any) {
    console.error("Order Action Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}