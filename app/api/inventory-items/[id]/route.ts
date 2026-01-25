import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to determine which table to use based on ID prefix
const getTableInfo = (id: string) => {
  if (id.startsWith('prod_')) return { table: 'product', idCol: 'productid', nameCol: 'productname', priceCol: 'price', qtyCol: 'availablequantity', descCol: 'productdescription', imgCol: 'imageurl' };
  if (id.startsWith('item_')) return { table: 'item', idCol: 'itemid', nameCol: 'itemname', priceCol: 'itemprice', qtyCol: 'itemquantity', descCol: 'itemdescription', imgCol: 'imageurl' };
  return null;
};

// DELETE: Remove an item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const info = getTableInfo(id);

    if (!info) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await db.query(`DELETE FROM ${info.table} WHERE ${info.idCol} = ?`, [id]);
    
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PUT: Update an item
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, price, quantity, description, image } = body;
    
    const info = getTableInfo(id);

    if (!info) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const query = `UPDATE ${info.table} SET ${info.nameCol}=?, ${info.priceCol}=?, ${info.qtyCol}=?, ${info.descCol}=?, ${info.imgCol}=? WHERE ${info.idCol}=?`;
    
    await db.query(query, [name, price, quantity, description, image, id]);

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}