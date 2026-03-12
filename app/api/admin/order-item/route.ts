import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawOrderId = searchParams.get('orderId');
  const orderId = rawOrderId ? rawOrderId.trim() : null;

  if (!orderId) return NextResponse.json([]);

  try {
    console.log(`🔍 Fetching items for Order ID: ${orderId}`);

    // --- 1. Fetch PRODUCTS ---
    const productsQuery = `
      SELECT 
        op.productid, 
        op.productid as id, 
        op.quantity, 
        op.amount as price, 
        COALESCE(p.productname, CONCAT('Product ID: ', op.productid)) as name, 
        p.imageurl as image 
      FROM orderedproducts op
      LEFT JOIN product p ON op.productid = p.productid
      WHERE op.orderid = ?
    `;
    
    const productsResult: any = await db.query(productsQuery, [orderId]);
    const productRows = (Array.isArray(productsResult) && Array.isArray(productsResult[0]))
        ? productsResult[0] 
        : productsResult;

    // --- 2. Fetch ITEMS (Custom Boxes) ---
    const itemsQuery = `
      SELECT 
        oi.itemid,
        oi.itemid as id, 
        oi.quantity, 
        oi.amount as price, 
        COALESCE(i.itemname, CONCAT('Item ID: ', oi.itemid)) as name, 
        i.imageurl as image 
      FROM ordereditems oi
      LEFT JOIN item i ON oi.itemid = i.itemid
      WHERE oi.orderid = ?
    `;

    const itemsResult: any = await db.query(itemsQuery, [orderId]);
    const itemRows = (Array.isArray(itemsResult) && Array.isArray(itemsResult[0]))
        ? itemsResult[0] 
        : itemsResult;

    // --- 3. Combine & Return ---
    const allItems = [
        ...(Array.isArray(productRows) ? productRows : []),
        ...(Array.isArray(itemRows) ? itemRows : [])
    ];

    console.log(`✅ Returning Total: ${allItems.length} items`);
    return NextResponse.json(allItems);

  } catch (error: any) {
    console.error("❌ Fetch Items Error:", error.message);
    return NextResponse.json([]); 
  }
}