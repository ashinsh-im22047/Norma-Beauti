import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper: Get User ID
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch { return null; }
}

// Helper: Get Cart ID
async function getCartId(userid: any) {
  const [custrows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userid]);
  if (custrows.length === 0) return null;
  const customerid = custrows[0].id;
  const [carts]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerid]);
  return carts.length > 0 ? carts[0].cartid : null;
}

// GET (View Cart)
export async function GET(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    if (!cartid) return NextResponse.json({ items: [] });

    const [productRows]: any = await db.query(`SELECT p.productid as id, p.productname as name, p.price, p.imageurl as image, cp.productquantity as quantity, 'product' as type FROM cartproducts cp JOIN product p ON cp.productid = p.productid WHERE cp.cartid = ?`, [cartid]);
    const [itemRows]: any = await db.query(`SELECT i.itemid as id, i.itemname as name, i.itemprice as price, i.imageurl as image, ci.itemquantity as quantity, 'item' as type FROM cartitems ci JOIN item i ON ci.itemid = i.itemid WHERE ci.cartid = ?`, [cartid]);

    return NextResponse.json({ items: [...productRows, ...itemRows] });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

// POST (Add to Cart)
export async function POST(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Please login first" }, { status: 401 });

    const [custrows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userid]);
    if (custrows.length === 0) return NextResponse.json({ error: "Complete profile first" }, { status: 404 });
    const customerid = custrows[0].id;

    const { id, type } = await req.json();
    let [carts]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerid]);
    let cartid;

    if (carts.length === 0) {
      const [newCart]: any = await db.query('INSERT INTO cart (customerid) VALUES (?)', [customerid]);
      cartid = newCart.insertId;
    } else { cartid = carts[0].cartid; }

    if (type === 'product') {
      await db.query(`INSERT INTO cartproducts (cartid, productid, productquantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE productquantity = productquantity + 1`, [cartid, id]);
    } else {
      await db.query(`INSERT INTO cartitems (cartid, itemid, itemquantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE itemquantity = itemquantity + 1`, [cartid, id]);
    }
    return NextResponse.json({ message: "Success" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

// PUT (Update Quantity)
export async function PUT(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    const { id, type, quantity } = await req.json();
    if (quantity < 1) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    if (type === 'product') await db.query('UPDATE cartproducts SET productquantity = ? WHERE cartid = ? AND productid = ?', [quantity, cartid, id]);
    else await db.query('UPDATE cartitems SET itemquantity = ? WHERE cartid = ? AND itemid = ?', [quantity, cartid, id]);
    return NextResponse.json({ message: "Updated" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

// DELETE (Remove Item)
export async function DELETE(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    const { id, type } = await req.json();

    if (type === 'product') await db.query('DELETE FROM cartproducts WHERE cartid = ? AND productid = ?', [cartid, id]);
    else await db.query('DELETE FROM cartitems WHERE cartid = ? AND itemid = ?', [cartid, id]);
    return NextResponse.json({ message: "Removed" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}