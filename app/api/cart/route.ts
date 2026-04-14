import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

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

// --- GET (View Cart) ---
export async function GET(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    if (!cartid) return NextResponse.json({ items: [] });

    // --- SMART FETCH: Grab items AND their attached active offers ---
    const [productRows]: any = await db.query(`
      SELECT p.productid as id, p.productname as name, p.price, p.imageurl as image, cp.productquantity as quantity, p.availablequantity as maxStock, 'product' as type,
      o.offername, o.offer_type, o.discountpercent, o.fixed_discount, o.buy_qty, o.get_qty, o.startdate, o.enddate
      FROM cartproducts cp 
      JOIN product p ON cp.productid = p.productid 
      LEFT JOIN offeredproducts op ON p.productid = op.productid
      LEFT JOIN offer o ON op.offerid = o.offerid
      WHERE cp.cartid = ?`, [cartid]);
      
    const [itemRows]: any = await db.query(`
      SELECT i.itemid as id, i.itemname as name, i.itemprice as price, i.imageurl as image, ci.itemquantity as quantity, i.itemquantity as maxStock, 'item' as type,
      o.offername, o.offer_type, o.discountpercent, o.fixed_discount, o.buy_qty, o.get_qty, o.startdate, o.enddate
      FROM cartitems ci 
      JOIN item i ON ci.itemid = i.itemid 
      LEFT JOIN offereditems oi ON i.itemid = oi.itemid
      LEFT JOIN offer o ON oi.offerid = o.offerid
      WHERE ci.cartid = ?`, [cartid]);

    const rawItems = [...productRows, ...itemRows];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- DYNAMIC OFFER CALCULATOR ---
    const processedItems = rawItems.map(row => {
        let finalPrice = parseFloat(row.price || 0);
        let originalPrice = finalPrice;
        let freeQty = 0;
        let badgeText = null;

        // Check if there is an offer and if it is currently active
        if (row.startdate && row.enddate) {
            const start = new Date(row.startdate); start.setHours(0, 0, 0, 0);
            const end = new Date(row.enddate); end.setHours(23, 59, 59, 999);
            
            if (today >= start && today <= end) {
                if (row.offer_type === 'PERCENTAGE' && row.discountpercent) {
                    finalPrice = originalPrice - (originalPrice * row.discountpercent / 100);
                    badgeText = `${row.discountpercent}% OFF`;
                } 
                else if (row.offer_type === 'FIXED' && row.fixed_discount) {
                    finalPrice = Math.max(0, originalPrice - row.fixed_discount);
                    badgeText = `LKR ${row.fixed_discount} OFF`;
                } 
                else if (row.offer_type === 'BOGO' && row.buy_qty && row.get_qty) {
                    // --- THE BOGO MAGIC ---
                    const bundles = Math.floor(row.quantity / row.buy_qty);
                    freeQty = bundles * row.get_qty;
                    badgeText = `Buy ${row.buy_qty} Get ${row.get_qty} FREE`;
                }
            }
        }

        return {
            id: row.id,
            name: row.name,
            price: finalPrice.toFixed(2), 
            originalPrice: originalPrice.toFixed(2),
            image: row.image,
            quantity: row.quantity,
            maxStock: row.maxStock,
            type: row.type,
            freeQty: freeQty, 
            badgeText: badgeText
        };
    });

    return NextResponse.json({ items: processedItems }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) { 
      console.error(error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 }); 
  }
}

export async function POST(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Please login first" }, { status: 401 });

    const [custrows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userid]);
    if (custrows.length === 0) return NextResponse.json({ error: "Complete profile first" }, { status: 404 });
    const customerid = custrows[0].id;

    const { id, type, quantity } = await req.json();
    const qtyToAdd = quantity ? parseInt(quantity) : 1; 

    let [carts]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerid]);
    let cartid;

    if (carts.length === 0) {
      const [newCart]: any = await db.query('INSERT INTO cart (customerid) VALUES (?)', [customerid]);
      cartid = newCart.insertId;
    } else { cartid = carts[0].cartid; }

    let availableStock = 0;
    let currentCartQty = 0;

    if (type === 'product') {
      const [pStock]: any = await db.query('SELECT availablequantity FROM product WHERE productid = ?', [id]);
      if (pStock.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      availableStock = pStock[0].availablequantity;

      const [cQty]: any = await db.query('SELECT productquantity FROM cartproducts WHERE cartid = ? AND productid = ?', [cartid, id]);
      if (cQty.length > 0) currentCartQty = cQty[0].productquantity;
    } else {
      const [iStock]: any = await db.query('SELECT itemquantity FROM item WHERE itemid = ?', [id]);
      if (iStock.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      availableStock = iStock[0].itemquantity;

      const [cQty]: any = await db.query('SELECT itemquantity FROM cartitems WHERE cartid = ? AND itemid = ?', [cartid, id]);
      if (cQty.length > 0) currentCartQty = cQty[0].itemquantity;
    }

    if (currentCartQty + qtyToAdd > availableStock) {
      return NextResponse.json({ error: `Only ${availableStock} left in stock!` }, { status: 400 });
    }

    if (type === 'product') {
      await db.query(
          `INSERT INTO cartproducts (cartid, productid, productquantity) VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE productquantity = productquantity + ?`, 
          [cartid, id, qtyToAdd, qtyToAdd]
      );
    } else {
      await db.query(
          `INSERT INTO cartitems (cartid, itemid, itemquantity) VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE itemquantity = itemquantity + ?`, 
          [cartid, id, qtyToAdd, qtyToAdd]
      );
    }
    return NextResponse.json({ message: "Success" });
  } catch (error) { 
      console.error(error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 }); 
  }
}

export async function PUT(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    const { id, type, quantity } = await req.json();
    if (quantity < 1) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    let availableStock = 0;
    if (type === 'product') {
      const [pStock]: any = await db.query('SELECT availablequantity FROM product WHERE productid = ?', [id]);
      availableStock = pStock[0].availablequantity;
    } else {
      const [iStock]: any = await db.query('SELECT itemquantity FROM item WHERE itemid = ?', [id]);
      availableStock = iStock[0].itemquantity;
    }

    if (quantity > availableStock) {
      return NextResponse.json({ error: `Only ${availableStock} left in stock!` }, { status: 400 });
    }

    if (type === 'product') await db.query('UPDATE cartproducts SET productquantity = ? WHERE cartid = ? AND productid = ?', [quantity, cartid, id]);
    else await db.query('UPDATE cartitems SET itemquantity = ? WHERE cartid = ? AND itemid = ?', [quantity, cartid, id]);
    
    return NextResponse.json({ message: "Updated" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

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