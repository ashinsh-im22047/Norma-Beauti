// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const getTableInfo = (id: string) => {
  if (id.startsWith('prod_')) return { table: 'product', idCol: 'productid', nameCol: 'productname', priceCol: 'price', qtyCol: 'availablequantity', descCol: 'productdescription', imgCol: 'imageurl', minCol: 'min_stock' };
  if (id.startsWith('item_')) return { table: 'item', idCol: 'itemid', nameCol: 'itemname', priceCol: 'itemprice', qtyCol: 'itemquantity', descCol: 'itemdescription', imgCol: 'imageurl', minCol: 'min_stock' };
  return null;
};

// --- GET METHOD ---
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const info = getTableInfo(id);
    if (!info) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Fetch main details
    const [mainRows]: any = await db.query(`SELECT * FROM ${info.table} WHERE ${info.idCol} = ?`, [id]);
    if (mainRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const resultData: any = { ...mainRows[0] };

    // If it is an item (gift box), fetch its constituent products safely
    if (id.startsWith('item_')) {
        const [productRows]: any = await db.query(`
          SELECT 
            p.productid,
            p.productname,
            p.productdescription,
            p.imageurl
          FROM itemproducts ip
          JOIN product p ON ip.productid = p.productid
          WHERE ip.itemid = ?
        `, [id]);

        resultData.includedProducts = productRows.map((p: any) => ({
            id: p.productid,
            name: p.productname,
            description: p.productdescription,
            image: p.imageurl
        }));
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error("Fetch Single Item Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const info = getTableInfo(id);
    if (!info) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await db.query(`DELETE FROM ${info.table} WHERE ${info.idCol} = ?`, [id]);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PUT (Update Details)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, price, quantity, description, image, minStock } = body; 
    const info = getTableInfo(id);
    if (!info) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const safeMinStock = minStock ? parseInt(minStock) : 5;

    await db.query(`UPDATE ${info.table} SET ${info.nameCol}=?, ${info.priceCol}=?, ${info.qtyCol}=?, ${info.descCol}=?, ${info.imgCol}=?, ${info.minCol}=? WHERE ${info.idCol}=?`, 
    [name, price, quantity, description, image, safeMinStock, id]);

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// PATCH (Update Status ONLY)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body; 

    if (!id.startsWith('prod_')) {
        return NextResponse.json({ error: "Only products have status" }, { status: 400 });
    }

    await db.query(`UPDATE product SET custom_status = ? WHERE productid = ?`, [status, id]);

    return NextResponse.json({ message: "Status updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}