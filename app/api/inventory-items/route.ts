// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      categoryType, 
      categoryId,   
      name, price, quantity, description, image, minStock,
      variants, 
      features,
      includedProducts // Array of selected box contents
    } = body;

    // Default to 5 if not provided
    const safeMinStock = minStock ? parseInt(minStock) : 5;
    
    // Safely stringify JSON arrays for the product database
    const safeVariants = variants ? (typeof variants === 'string' ? variants : JSON.stringify(variants)) : '[]';
    const safeFeatures = features ? (typeof features === 'string' ? features : JSON.stringify(features)) : '[]';

    if (categoryType === 'product') {
       const newId = `prod_${Date.now()}`;
       
       // --- ENHANCEMENT: AUTO SET CUSTOM BOX STATUS TO PENDING ---
       await db.query(
         'INSERT INTO product (productid, productname, price, availablequantity, productdescription, imageurl, min_stock, variants, features, custom_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, image, safeMinStock, safeVariants, safeFeatures, 'pending']
       );
       
       return NextResponse.json({ message: "Product added", id: newId });
    }

    else if (categoryType === 'item') {
       const newId = `item_${Date.now()}`;
       
       // 1. Insert the main box details into the 'item' table (NO variants/features here)
       await db.query(
         'INSERT INTO item (itemid, itemname, itemprice, itemquantity, itemdescription, categoryid, imageurl, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
         [newId, name, price, quantity, description, categoryId, image, safeMinStock]
       );

       // 2. If there are selected products for this box, save them into the 'itemproducts' table
       if (includedProducts && Array.isArray(includedProducts) && includedProducts.length > 0) {
           for (const product of includedProducts) {
               await db.query(
                   'INSERT INTO itemproducts (productid, itemid, ptquantity) VALUES (?, ?, ?)',
                   [product.id, newId, product.qty]
               );
           }
       }
       
       return NextResponse.json({ message: "Item added successfully", id: newId });
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
    const categoryId = searchParams.get('categoryId');
    
    // --- FIX: If no category is requested, return ALL inventory from BOTH tables ---
    if (!categoryId) {
        const [productRows]: any = await db.query('SELECT * FROM product');
        const [itemRows]: any = await db.query('SELECT * FROM item');

        const formattedProducts = productRows.map((r: any) => ({
          id: r.productid, 
          name: r.productname, 
          price: r.price, 
          quantity: r.availablequantity, 
          desc: r.productdescription, 
          image: r.imageurl,
          status: r.custom_status || 'pending', 
          minStock: r.min_stock, 
          variants: r.variants, 
          features: r.features, 
          type: 'product'
        }));

        const formattedItems = itemRows.map((r: any) => ({
          id: r.itemid, 
          name: r.itemname, 
          price: r.itemprice, 
          quantity: r.itemquantity, 
          desc: r.itemdescription, 
          image: r.imageurl, 
          minStock: r.min_stock, 
          variants: [], // Items do not have variants
          features: [], // Items do not have features
          type: 'item'
        }));

        // Combine both arrays and return
        return NextResponse.json([...formattedProducts, ...formattedItems]);
    }

    // --- Original Category Logic ---
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
         minStock: r.min_stock, 
         variants: [], 
         features: [], 
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
         minStock: r.min_stock, 
         variants: r.variants, 
         features: r.features, 
         type: 'product'
       }));
       return NextResponse.json(formatted);
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}