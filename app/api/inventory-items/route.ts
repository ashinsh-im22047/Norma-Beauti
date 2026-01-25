import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST: Add new Item or Product based on Category Context
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      categoryType, // 'product' (Individual/Custom) or 'item' (Ready Made)
      categoryId,   // Only needed for Ready Made items
      name, price, quantity, description, image 
    } = body;

    // --- SCENARIO A: Adding to "Individual Products" or "Customizable" ---
    // These go into the PRODUCT table (No categoryID needed here based on your design)
    if (categoryType === 'product') {
       const newId = `prod_${Date.now()}`;
       
       await db.query(
         'INSERT INTO product (productid, productname, price, availablequantity, productdescription, imageurl) VALUES (?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, image]
       );
       
       return NextResponse.json({ message: "Product added", id: newId });
    }

    // --- SCENARIO B: Adding to "Ready Made Gift Boxes" ---
    // These go into the ITEM table (Needs categoryID)
    else if (categoryType === 'item') {
       const newId = `item_${Date.now()}`;
       
       await db.query(
         'INSERT INTO item (itemid, itemname, itemprice, itemquantity, itemdescription, categoryid, imageurl) VALUES (?, ?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, categoryId, image]
       );
       
       return NextResponse.json({ message: "Item added", id: newId });
    }

    return NextResponse.json({ error: "Invalid Type" }, { status: 400 });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// GET: Fetch based on Context
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || '';
    
    // Logic: If the URL has a category ID related to "Ready Made", fetch from ITEM table.
    // Otherwise, fetch from PRODUCT table.
    const isItemCategory = categoryId.toLowerCase().includes('ready') || categoryId.includes('cat_ready'); 

    if (isItemCategory) {
       // Fetch from ITEM table
       const [rows]: any = await db.query('SELECT * FROM item WHERE categoryid = ?', [categoryId]);
       
       // Transform to a common format for frontend
       const formatted = rows.map((r: any) => ({
         id: r.itemid, 
         name: r.itemname, 
         price: r.itemprice, 
         quantity: r.itemquantity, 
         desc: r.itemdescription, 
         image: r.imageurl, 
         type: 'item'
       }));
       return NextResponse.json(formatted);

    } else {
       // Fetch from PRODUCT table (For Individual & Custom)
       // We now include 'custom_status' in the select
       const [rows]: any = await db.query('SELECT * FROM product');
       
       const formatted = rows.map((r: any) => ({
         id: r.productid, 
         name: r.productname, 
         price: r.price, 
         quantity: r.availablequantity, 
         desc: r.productdescription, 
         image: r.imageurl,
         status: r.custom_status || 'pending', // NEW FIELD
         type: 'product'
       }));
       return NextResponse.json(formatted);
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}