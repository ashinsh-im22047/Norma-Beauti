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
    if (rows.length === 0) {
      isUnique = true;
    }
  }
  return randomId;
}

// ------------------------------------------------------------------
// GET: Fetch User's Orders (Fixes "Unexpected JSON" error)
// ------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Get Customer ID
    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userId]);
    if (custRows.length === 0) {
        return NextResponse.json([]); // Return empty array if no profile
    }
    const customerId = custRows[0].id;

    // 2. Fetch Orders for this customer
    // We select all columns so the frontend can display them
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

// ------------------------------------------------------------------
// POST: Place New Order
// ------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, total, method, slip, details } = body;

    console.log("Placing order for User:", userId); 

    // 1. Get Customer ID
    const [custRows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userId]);
    
    if (custRows.length === 0) {
        return NextResponse.json({ error: "Customer profile not found. Please save your details in the Profile page first." }, { status: 400 });
    }
    const customerId = custRows[0].id;

    // 2. Generate Unique Order ID
    const newOrderId = await generateUniqueOrderId();
    console.log("Generated Unique ID:", newOrderId);

    // 3. Insert Order 
    // CHANGE: Status is now 'Pending' (default)
    await db.query(
      `INSERT INTO \`order\` (
          orderid,
          customerid, 
          totalamount, 
          paymentmethod, 
          paymentslip, 
          shipping_name, 
          shipping_address, 
          shipping_phone, 
          status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`, 
      [
        newOrderId,
        customerId, 
        total, 
        method, 
        slip || null, 
        details.name, 
        details.address, 
        details.phone
      ]
    );

    // 4. Insert Items
    for (const item of items) {
      if (item.type === 'product') {
        await db.query(
            'INSERT INTO orderedproducts (orderid, productid, quantity, amount) VALUES (?, ?, ?, ?)', 
            [newOrderId, item.id, item.quantity, item.price] 
        );
      } else {
        await db.query(
            'INSERT INTO ordereditems (orderid, itemid, quantity, amount) VALUES (?, ?, ?, ?)', 
            [newOrderId, item.id, item.quantity, item.price] 
        );
      }
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: newOrderId });

  } catch (error: any) {
    console.error("ORDER API CRITICAL ERROR:", error.message);
    return NextResponse.json(
        { error: "Order failed: " + error.message }, 
        { status: 500 }
    );
  }
}