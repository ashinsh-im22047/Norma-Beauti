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

    // --- FETCH PRODUCTS (Includes Variant Columns) ---
    const [productRows]: any = await db.query(`
      SELECT p.productid as id, 
             COALESCE(cp.custom_name, p.productname) as name, 
             COALESCE(cp.price, p.price) as price, 
             cp.variant_combo as selectedVariantCombo,
             p.imageurl as image, cp.productquantity as quantity, p.availablequantity as maxStock, 'product' as type,
             p.variants,
             o.offername, o.offer_type, o.discountpercent, o.fixed_discount, o.buy_qty, o.get_qty, o.startdate, o.enddate
      FROM cartproducts cp 
      JOIN product p ON cp.productid = p.productid 
      LEFT JOIN offeredproducts op ON p.productid = op.productid
      LEFT JOIN offer o ON op.offerid = o.offerid
      WHERE cp.cartid = ?`, [cartid]);
      
    // --- FETCH ITEMS (NO Variant Columns) ---
    const [itemRows]: any = await db.query(`
      SELECT i.itemid as id, 
             i.itemname as name, 
             i.itemprice as price, 
             NULL as selectedVariantCombo,
             i.imageurl as image, ci.itemquantity as quantity, i.itemquantity as maxStock, 'item' as type,
             NULL as variants,
             o.offername, o.offer_type, o.discountpercent, o.fixed_discount, o.buy_qty, o.get_qty, o.startdate, o.enddate
      FROM cartitems ci 
      JOIN item i ON ci.itemid = i.itemid 
      LEFT JOIN offereditems oi ON i.itemid = oi.itemid
      LEFT JOIN offer o ON oi.offerid = o.offerid
      WHERE ci.cartid = ?`, [cartid]);

    const rawItems = [...productRows, ...itemRows];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- DYNAMIC OFFER & VARIANT CALCULATOR ---
    const processedItems = rawItems.map(row => {
        let finalPrice = parseFloat(row.price || 0);
        let originalPrice = finalPrice;
        let freeQty = 0;
        let badgeText = null;
        let finalMaxStock = parseInt(row.maxStock, 10) || 0;

        // Extract accurate stock limit based on the variant saved in the cart
        if (row.type === 'product' && row.variants && row.selectedVariantCombo) {
            try {
                const variantsArr = typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants;
                for (const v of variantsArr) {
                    if (v.combo && v.combo.join(' / ') === row.selectedVariantCombo) {
                        finalMaxStock = parseInt(v.quantity, 10) || 0;
                        break;
                    }
                }
            } catch (e) { console.error("Variant parse error", e); }
        }

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
            maxStock: finalMaxStock, 
            type: row.type,
            selectedVariantCombo: row.selectedVariantCombo,
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

    // --- FIX: Extract all possible payload variables for combo/name ---
    const body = await req.json();
    const { id, type, quantity, price, selectedVariantCombo, variant_combo, name, custom_name } = body;
    
    const qtyToAdd = quantity ? parseInt(quantity) : 1; 
    
    const finalPrice = price !== undefined && price !== null ? parseFloat(price) : null;
    const finalCombo = selectedVariantCombo || variant_combo || null;
    const finalName = name || custom_name || null;

    let [carts]: any = await db.query('SELECT cartid FROM cart WHERE customerid = ?', [customerid]);
    let cartid;

    if (carts.length === 0) {
      const [newCart]: any = await db.query('INSERT INTO cart (customerid) VALUES (?)', [customerid]);
      cartid = newCart.insertId;
    } else { cartid = carts[0].cartid; }

    let availableStock = 0;
    let currentCartQty = 0;

    if (type === 'product') {
      const [pStock]: any = await db.query('SELECT availablequantity, variants FROM product WHERE productid = ?', [id]);
      if (pStock.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      availableStock = pStock[0].availablequantity;

      // Validate against the specific variant's stock
      if (finalCombo && pStock[0].variants) {
          try {
              const variantsArr = typeof pStock[0].variants === 'string' ? JSON.parse(pStock[0].variants) : pStock[0].variants;
              for (const v of variantsArr) {
                  if (v.combo && v.combo.join(' / ') === finalCombo) {
                      availableStock = parseInt(v.quantity, 10) || 0;
                      break;
                  }
              }
          } catch(e) {}
      }

      // Find if this EXACT variant combo already exists in the cart
      const [cQty]: any = await db.query('SELECT productquantity FROM cartproducts WHERE cartid = ? AND productid = ? AND IFNULL(variant_combo, "") = IFNULL(?, "")', [cartid, id, finalCombo]);
      if (cQty.length > 0) currentCartQty = cQty[0].productquantity;
      
      if (currentCartQty + qtyToAdd > availableStock) {
        return NextResponse.json({ error: `Only ${availableStock} left in stock for this selection!` }, { status: 400 });
      }

      // --- FIX: Safely update or insert specifically by exact variant string ---
      if (cQty.length > 0) {
          await db.query(
              `UPDATE cartproducts SET productquantity = productquantity + ?, price = ?, custom_name = ? 
               WHERE cartid = ? AND productid = ? AND IFNULL(variant_combo, "") = IFNULL(?, "")`, 
              [qtyToAdd, finalPrice, finalName, cartid, id, finalCombo]
          );
      } else {
          await db.query(
              `INSERT INTO cartproducts (cartid, productid, productquantity, price, variant_combo, custom_name) VALUES (?, ?, ?, ?, ?, ?)`, 
              [cartid, id, qtyToAdd, finalPrice, finalCombo, finalName]
          );
      }

    } else {
      const [iStock]: any = await db.query('SELECT itemquantity FROM item WHERE itemid = ?', [id]);
      if (iStock.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      availableStock = iStock[0].itemquantity;

      const [cQty]: any = await db.query('SELECT itemquantity FROM cartitems WHERE cartid = ? AND itemid = ?', [cartid, id]);
      if (cQty.length > 0) currentCartQty = cQty[0].itemquantity;

      if (currentCartQty + qtyToAdd > availableStock) {
        return NextResponse.json({ error: `Only ${availableStock} left in stock!` }, { status: 400 });
      }

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

// --- FIX: Safely include variant checks for PUT to avoid breaking the cart ---
export async function PUT(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    
    const body = await req.json();
    const { id, type, quantity, selectedVariantCombo, variant_combo } = body;
    const finalCombo = selectedVariantCombo || variant_combo || null;
    
    if (quantity < 1) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    let availableStock = 0;
    if (type === 'product') {
      const [pStock]: any = await db.query('SELECT availablequantity, variants FROM product WHERE productid = ?', [id]);
      availableStock = pStock[0].availablequantity;
      
      if (finalCombo && pStock[0].variants) {
          try {
              const variantsArr = typeof pStock[0].variants === 'string' ? JSON.parse(pStock[0].variants) : pStock[0].variants;
              for (const v of variantsArr) {
                  if (v.combo && v.combo.join(' / ') === finalCombo) {
                      availableStock = parseInt(v.quantity, 10) || 0;
                      break;
                  }
              }
          } catch(e) {}
      }
    } else {
      const [iStock]: any = await db.query('SELECT itemquantity FROM item WHERE itemid = ?', [id]);
      availableStock = iStock[0].itemquantity;
    }

    if (quantity > availableStock) {
      return NextResponse.json({ error: `Only ${availableStock} left in stock!` }, { status: 400 });
    }

    if (type === 'product') {
        await db.query('UPDATE cartproducts SET productquantity = ? WHERE cartid = ? AND productid = ? AND IFNULL(variant_combo, "") = IFNULL(?, "")', [quantity, cartid, id, finalCombo]);
    } else {
        await db.query('UPDATE cartitems SET itemquantity = ? WHERE cartid = ? AND itemid = ?', [quantity, cartid, id]);
    }
    
    return NextResponse.json({ message: "Updated" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

// --- FIX: Safely include variant checks for DELETE to avoid breaking the cart ---
export async function DELETE(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const cartid = await getCartId(userid);
    
    const body = await req.json();
    const { id, type, selectedVariantCombo, variant_combo } = body;
    const finalCombo = selectedVariantCombo || variant_combo || null;

    if (type === 'product') {
        await db.query('DELETE FROM cartproducts WHERE cartid = ? AND productid = ? AND IFNULL(variant_combo, "") = IFNULL(?, "")', [cartid, id, finalCombo]);
    } else {
        await db.query('DELETE FROM cartitems WHERE cartid = ? AND itemid = ?', [cartid, id]);
    }
    
    return NextResponse.json({ message: "Removed" });
  } catch (error) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}