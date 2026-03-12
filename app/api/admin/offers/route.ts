import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch offers along with their connected products and items
    const [offers]: any = await db.query(`
      SELECT o.*, 
        (SELECT GROUP_CONCAT(productid) FROM offeredproducts op WHERE op.offerid = o.offerid) as attached_products,
        (SELECT GROUP_CONCAT(itemid) FROM offereditems oi WHERE oi.offerid = o.offerid) as attached_items
      FROM offer o 
      ORDER BY o.startdate DESC
    `);

    // Parse the concatenated strings into arrays for the frontend
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
    const { offername, discountpercent, startdate, enddate, selectedProducts, selectedItems } = await req.json();
    const offerid = `off_${Date.now()}`;
    const discount = discountpercent ? parseFloat(discountpercent) : null;

    // 1. Insert Offer
    await db.query(
      'INSERT INTO offer (offerid, offername, discountpercent, startdate, enddate) VALUES (?, ?, ?, ?, ?)',
      [offerid, offername, discount, startdate, enddate]
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
    const { offerid, offername, discountpercent, startdate, enddate, selectedProducts, selectedItems } = await req.json();
    const discount = discountpercent ? parseFloat(discountpercent) : null;

    // 1. Update main offer details
    await db.query(
      'UPDATE offer SET offername=?, discountpercent=?, startdate=?, enddate=? WHERE offerid=?',
      [offername, discount, startdate, enddate, offerid]
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