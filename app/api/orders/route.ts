// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

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

    // --- STRICT BACKEND VALIDATION FOR VARIANTS ---
    for (const item of items) {
      const itemId = item.id || item.productid || item.itemid;
      const itemName = item.name || item.productname || item.itemname;
      
      if (!itemId) {
          return NextResponse.json({ error: `Invalid item ID for ${itemName || 'unknown product'}` }, { status: 400 });
      }

      const isProduct = item.type === 'product' || String(itemId).toUpperCase().includes('PROD');

      if (isProduct) {
        const [prodRows]: any = await db.query('SELECT availablequantity, variants, productname FROM product WHERE productid = ?', [itemId]);
        
        if (prodRows.length === 0) {
            return NextResponse.json({ error: `Product '${itemName}' (ID: ${itemId}) not found in database.` }, { status: 404 });
        }
        
        let stock = parseInt(prodRows[0].availablequantity, 10) || 0;
        
        if (prodRows[0].variants) {
            try {
                const variantsArr = typeof prodRows[0].variants === 'string' ? JSON.parse(prodRows[0].variants) : (prodRows[0].variants || []);
                for (const v of variantsArr) {
                    if (v.combo) {
                        const comboStr = v.combo.join(' / ');
                        if (item.selectedVariantCombo === comboStr || (itemName && itemName.includes(comboStr))) {
                            stock = parseInt(v.quantity, 10) || 0;
                            break;
                        }
                    }
                }
            } catch (e) {}
        }

        const requiredQty = parseInt(item.quantity, 10) || 0;
        if (requiredQty > stock) {
            return NextResponse.json({ error: `Not enough stock for ${itemName}. Only ${stock} available.` }, { status: 400 });
        }
      } else {
         const [itemRows]: any = await db.query('SELECT itemquantity, itemname FROM item WHERE itemid = ?', [itemId]);
         
         if (itemRows.length === 0) {
             return NextResponse.json({ error: `Item '${itemName}' (ID: ${itemId}) not found in the database.` }, { status: 404 });
         }

         const itemStock = parseInt(itemRows[0].itemquantity, 10) || 0;
         const requiredQty = parseInt(item.quantity, 10) || 0;
         
         if (requiredQty > itemStock) {
             return NextResponse.json({ error: `Not enough stock for ${itemName}. Only ${itemStock} available.` }, { status: 400 });
         }
      }
    }

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
      const itemId = item.id || item.productid || item.itemid;
      const itemName = item.name || item.productname || item.itemname;
      const itemQtyToDeduct = parseInt(item.quantity, 10) || 0;
      const itemPrice = parseFloat(item.price) || 0;
      const isProduct = item.type === 'product' || String(itemId).toUpperCase().includes('PROD');

      if (isProduct) {
        try {
            await db.query('INSERT INTO orderedproducts (orderid, productid, quantity, amount) VALUES (?, ?, ?, ?)', [newOrderId, itemId, itemQtyToDeduct, itemPrice]);
        } catch(e: any) {
            throw new Error(`DB Error (orderedproducts): ${e.message}`);
        }
        
        await db.query('UPDATE product SET availablequantity = GREATEST(0, availablequantity - ?) WHERE productid = ?', [itemQtyToDeduct, itemId]);
        
        const [prodRows]: any = await db.query('SELECT variants FROM product WHERE productid = ?', [itemId]);
        if (prodRows.length > 0 && prodRows[0].variants) {
             try {
                 let variantsArr = typeof prodRows[0].variants === 'string' ? JSON.parse(prodRows[0].variants) : prodRows[0].variants;
                 let variantFound = false;
                 let updatedVariants = variantsArr.map((v: any) => {
                     if (v.combo) {
                         const comboStr = v.combo.join(' / ');
                         if (item.selectedVariantCombo === comboStr || (itemName && itemName.includes(comboStr))) {
                             const currentQty = parseInt(v.quantity, 10) || 0;
                             v.quantity = Math.max(0, currentQty - itemQtyToDeduct).toString();
                             variantFound = true;
                         }
                     }
                     return v;
                 });
                 if (variantFound) {
                    await db.query('UPDATE product SET variants = ? WHERE productid = ?', [JSON.stringify(updatedVariants), itemId]);
                 }
             } catch (e) {}
        }
        
        if (cartId) await db.query('DELETE FROM cartproducts WHERE cartid = ? AND productid = ?', [cartId, itemId]);
      } else {
        
        // --- MULTI-TRY INSERTION TO PREVENT CRASHES ON UNKNOWN COLUMN NAMES ---
        try {
            // Standard approach
            await db.query('INSERT INTO ordereditems (orderid, itemid, quantity, amount) VALUES (?, ?, ?, ?)', [newOrderId, itemId, itemQtyToDeduct, itemPrice]);
        } catch (e1: any) {
            try {
                // Alternative 1
                await db.query('INSERT INTO ordereditems (orderid, itemid, itemquantity, itemprice) VALUES (?, ?, ?, ?)', [newOrderId, itemId, itemQtyToDeduct, itemPrice]);
            } catch (e2: any) {
                try {
                   // Alternative 2 (My previous guess)
                   await db.query('INSERT INTO ordereditems (orderid, itemid, oiqty, oiprice) VALUES (?, ?, ?, ?)', [newOrderId, itemId, itemQtyToDeduct, itemPrice]);
                } catch (e3: any) {
                   // If all fail, throw the exact database error message to the frontend!
                   throw new Error(`DB Column Mismatch in 'ordereditems' table! Error Details: ${e1.message}`);
                }
            }
        }

        await db.query('UPDATE item SET itemquantity = GREATEST(0, itemquantity - ?) WHERE itemid = ?', [itemQtyToDeduct, itemId]);
        if (cartId) await db.query('DELETE FROM cartitems WHERE cartid = ? AND itemid = ?', [cartId, itemId]);
      }
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: newOrderId });

  } catch (error: any) {
    console.error("ORDER API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: Cancel or Delete Order & Refund Stock ---
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const action = searchParams.get('action'); 

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
        
        // Refund Products 
        const [products]: any = await db.query('SELECT * FROM orderedproducts WHERE orderid = ?', [orderId]);
        for (const p of products) {
            const pQty = p.quantity || p.productquantity || 0;
            await db.query('UPDATE product SET availablequantity = availablequantity + ? WHERE productid = ?', [pQty, p.productid]);
        }

        // Refund Items safely regardless of column name
        const [items]: any = await db.query('SELECT * FROM ordereditems WHERE orderid = ?', [orderId]);
        for (const i of items) {
            const iQty = i.quantity || i.itemquantity || i.oiqty || 0;
            await db.query('UPDATE item SET itemquantity = itemquantity + ? WHERE itemid = ?', [iQty, i.itemid]);
        }

        await db.query('UPDATE `order` SET status = "Cancelled" WHERE orderid = ?', [orderId]);
        return NextResponse.json({ message: "Order cancelled successfully" });
    }

  } catch (error: any) {
    console.error("Order Action Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}