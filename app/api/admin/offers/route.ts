// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [offers]: any = await db.query(`
      SELECT o.*, 
        (SELECT GROUP_CONCAT(productid) FROM offeredproducts op WHERE op.offerid = o.offerid) as attached_products,
        (SELECT GROUP_CONCAT(itemid) FROM offereditems oi WHERE oi.offerid = o.offerid) as attached_items
      FROM offer o 
      ORDER BY o.startdate DESC
    `);

    const formattedOffers = offers.map((o: any) => ({
      ...o,
      productCount: o.attached_products ? o.attached_products.split(',').length : 0,
      itemCount: o.attached_items ? o.attached_items.split(',').length : 0,
      selectedProducts: o.attached_products ? o.attached_products.split(',') : [],
      selectedItems: o.attached_items ? o.attached_items.split(',') : []
    }));

    return NextResponse.json(formattedOffers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { 
        offername, startdate, enddate, offer_type, 
        discountpercent, fixed_discount, buy_qty, get_qty, 
        selectedProducts, selectedItems 
    } = await req.json();
    
    const offerid = `off_${Date.now()}`;

    // Clean up data based on type so we don't save irrelevant data
    const dPercent = offer_type === 'PERCENTAGE' && discountpercent ? parseFloat(discountpercent) : null;
    const fDiscount = offer_type === 'FIXED' && fixed_discount ? parseFloat(fixed_discount) : null;
    const bQty = offer_type === 'BOGO' && buy_qty ? parseInt(buy_qty) : null;
    const gQty = offer_type === 'BOGO' && get_qty ? parseInt(get_qty) : null;

    // 1. Insert Offer
    await db.query(
      `INSERT INTO offer 
      (offerid, offername, startdate, enddate, offer_type, discountpercent, fixed_discount, buy_qty, get_qty) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [offerid, offername, startdate, enddate, offer_type, dPercent, fDiscount, bQty, gQty]
    );

    // 2. Attach Products
    for (const pid of selectedProducts) {
      await db.query('INSERT INTO offeredproducts (offerid, productid) VALUES (?, ?)', [offerid, pid]);
    }

    // 3. Attach Items
    for (const iid of selectedItems) {
      await db.query('INSERT INTO offereditems (offerid, itemid) VALUES (?, ?)', [offerid, iid]);
    }

    return NextResponse.json({ message: "Offer created!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { 
        offerid, offername, startdate, enddate, offer_type, 
        discountpercent, fixed_discount, buy_qty, get_qty, 
        selectedProducts, selectedItems 
    } = await req.json();
    
    // Clean up data
    const dPercent = offer_type === 'PERCENTAGE' && discountpercent ? parseFloat(discountpercent) : null;
    const fDiscount = offer_type === 'FIXED' && fixed_discount ? parseFloat(fixed_discount) : null;
    const bQty = offer_type === 'BOGO' && buy_qty ? parseInt(buy_qty) : null;
    const gQty = offer_type === 'BOGO' && get_qty ? parseInt(get_qty) : null;

    // 1. Update main offer details
    await db.query(
      `UPDATE offer SET 
      offername=?, startdate=?, enddate=?, offer_type=?, 
      discountpercent=?, fixed_discount=?, buy_qty=?, get_qty=? 
      WHERE offerid=?`,
      [offername, startdate, enddate, offer_type, dPercent, fDiscount, bQty, gQty, offerid]
    );

    // 2. Clear old attachments
    await db.query('DELETE FROM offeredproducts WHERE offerid=?', [offerid]);
    await db.query('DELETE FROM offereditems WHERE offerid=?', [offerid]);

    // 3. Insert new attachments
    for (const pid of selectedProducts) {
      await db.query('INSERT INTO offeredproducts (offerid, productid) VALUES (?, ?)', [offerid, pid]);
    }
    for (const iid of selectedItems) {
      await db.query('INSERT INTO offereditems (offerid, itemid) VALUES (?, ?)', [offerid, iid]);
    }

    return NextResponse.json({ message: "Offer updated!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  try {
    await db.query('DELETE FROM offeredproducts WHERE offerid=?', [id]);
    await db.query('DELETE FROM offereditems WHERE offerid=?', [id]);
    await db.query('DELETE FROM offer WHERE offerid=?', [id]);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}