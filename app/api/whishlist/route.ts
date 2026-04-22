// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

// Helper: Get User ID from Token
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

// Helper: Get or Create Wishlist ID
async function getWishlistId(userid: any, createIfMissing = false) {
  const [custrows]: any = await db.query('SELECT id FROM customer WHERE userid = ?', [userid]);
  if (custrows.length === 0) return null;
  const customerid = custrows[0].id;

  const [wishlists]: any = await db.query('SELECT wishlistid FROM wishlist WHERE customerid = ?', [customerid]);
  
  if (wishlists.length > 0) {
    return wishlists[0].wishlistid;
  } else if (createIfMissing) {
    const newWishlistId = `WISH-${customerid}`;
    await db.query('INSERT INTO wishlist (wishlistid, customerid) VALUES (?, ?)', [newWishlistId, customerid]);
    return newWishlistId;
  }
  return null;
}

// --- GET: Fetch Items to display on the page ---
export async function GET(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wishlistid = await getWishlistId(userid);
    if (!wishlistid) return NextResponse.json({ items: [] }); // Empty wishlist

    // Fetch Products (Includes Variant Columns)
    const [productRows]: any = await db.query(`
      SELECT p.productid as id, 
             COALESCE(wp.custom_name, p.productname) as name, 
             COALESCE(wp.price, p.price) as price, 
             wp.variant_combo as selectedVariantCombo,
             p.imageurl as image, 'product' as type
      FROM wishlistproducts wp 
      JOIN product p ON wp.productid = p.productid 
      WHERE wp.wishlistid = ?`, [wishlistid]);
      
    // --- FIX: Fetch Items (NO Variant Columns to prevent crashes) ---
    const [itemRows]: any = await db.query(`
      SELECT i.itemid as id, 
             i.itemname as name, 
             i.itemprice as price, 
             NULL as selectedVariantCombo,
             i.imageurl as image, 'item' as type
      FROM wishlistitems wi 
      JOIN item i ON wi.itemid = i.itemid 
      WHERE wi.wishlistid = ?`, [wishlistid]);

    return NextResponse.json({ items: [...productRows, ...itemRows] }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error("Wishlist GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// --- POST: Add to Wishlist ---
export async function POST(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Please login first" }, { status: 401 });

    const wishlistid = await getWishlistId(userid, true); // Create if missing
    if (!wishlistid) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { id, type, price, selectedVariantCombo, name } = await req.json();

    // Safely parse variant details for database insertion (Products Only)
    const finalPrice = price !== undefined && price !== null ? parseFloat(price) : null;
    const finalCombo = selectedVariantCombo || null;
    const finalName = name || null;

    if (type === 'product') {
      // Products have variants and custom pricing
      await db.query(
        `INSERT INTO wishlistproducts (wishlistid, productid, price, variant_combo, custom_name) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE price = ?, variant_combo = ?, custom_name = ?`, 
        [wishlistid, String(id), finalPrice, finalCombo, finalName, finalPrice, finalCombo, finalName]
      );
    } else {
      // --- FIX: Items do not use variant columns ---
      await db.query(
        `INSERT IGNORE INTO wishlistitems (wishlistid, itemid) 
         VALUES (?, ?)`, 
        [wishlistid, String(id)]
      );
    }

    return NextResponse.json({ message: "Added to wishlist!" }, { status: 200 });
  } catch (error: any) {
    console.error("Wishlist POST Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// --- DELETE: Remove from Wishlist ---
export async function DELETE(req: Request) {
  try {
    const userid = await getUserId();
    if (!userid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wishlistid = await getWishlistId(userid);
    if (!wishlistid) return NextResponse.json({ error: "Wishlist empty" }, { status: 404 });

    const { id, type } = await req.json();

    if (type === 'product') {
      await db.query('DELETE FROM wishlistproducts WHERE wishlistid = ? AND productid = ?', [wishlistid, String(id)]);
    } else {
      await db.query('DELETE FROM wishlistitems WHERE wishlistid = ? AND itemid = ?', [wishlistid, String(id)]);
    }

    return NextResponse.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("Wishlist DELETE Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}