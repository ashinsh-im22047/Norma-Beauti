import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const getTableInfo = (id: string) => {
  if (id.startsWith('prod_')) return { table: 'product', idCol: 'productid', nameCol: 'productname', priceCol: 'price', qtyCol: 'availablequantity', descCol: 'productdescription', imgCol: 'imageurl', minCol: 'min_stock' };
  if (id.startsWith('item_')) return { table: 'item', idCol: 'itemid', nameCol: 'itemname', priceCol: 'itemprice', qtyCol: 'itemquantity', descCol: 'itemdescription', imgCol: 'imageurl', minCol: 'min_stock' };
  return null;
};

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
    const { name, price, quantity, description, image, minStock } = body; // --- NEW: Added minStock
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