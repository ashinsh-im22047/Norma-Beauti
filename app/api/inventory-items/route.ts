import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      categoryType, 
      categoryId,   
      name, price, quantity, description, image, minStock // --- NEW: Added minStock
    } = body;

    // Default to 5 if not provided
    const safeMinStock = minStock ? parseInt(minStock) : 5;

    if (categoryType === 'product') {
       const newId = `prod_${Date.now()}`;
       
       await db.query(
         'INSERT INTO product (productid, productname, price, availablequantity, productdescription, imageurl, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, image, safeMinStock]
       );
       
       return NextResponse.json({ message: "Product added", id: newId });
    }

    else if (categoryType === 'item') {
       const newId = `item_${Date.now()}`;
       
       await db.query(
         'INSERT INTO item (itemid, itemname, itemprice, itemquantity, itemdescription, categoryid, imageurl, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, categoryId, image, safeMinStock]
       );
       
       return NextResponse.json({ message: "Item added", id: newId });
    }

    return NextResponse.json({ error: "Invalid Type" }, { status: 400 });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || '';
    
    const isItemCategory = categoryId.toLowerCase().includes('ready') || categoryId.includes('cat_ready'); 

    if (isItemCategory) {
       const [rows]: any = await db.query('SELECT * FROM item WHERE categoryid = ?', [categoryId]);
       
       const formatted = rows.map((r: any) => ({
         id: r.itemid, 
         name: r.itemname, 
         price: r.itemprice, 
         quantity: r.itemquantity, 
         desc: r.itemdescription, 
         image: r.imageurl, 
         minStock: r.min_stock, // --- NEW
         type: 'item'
       }));
       return NextResponse.json(formatted);

    } else {
       const [rows]: any = await db.query('SELECT * FROM product');
       
       const formatted = rows.map((r: any) => ({
         id: r.productid, 
         name: r.productname, 
         price: r.price, 
         quantity: r.availablequantity, 
         desc: r.productdescription, 
         image: r.imageurl,
         status: r.custom_status || 'pending', 
         minStock: r.min_stock, // --- NEW
         type: 'product'
       }));
       return NextResponse.json(formatted);
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}