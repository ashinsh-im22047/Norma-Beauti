// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE: Remove a specific category
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // 1. Update Type Definition
) {
  try {
    // 2. CRITICAL FIX: Await the params object!
    const { id } = await params; 

    console.log("Attempting to delete ID:", id); // This should now print the real ID (e.g. cat_123)

    if (!id) {
        return NextResponse.json({ error: "ID is missing" }, { status: 400 });
    }

    await db.query('DELETE FROM category WHERE categoryid = ?', [id]);
    
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PUT: Update a specific category
export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // 1. Update Type Definition
) {
  try {
    const { name, description } = await req.json();
    
    // 2. CRITICAL FIX: Await the params object!
    const { id } = await params;

    console.log("Attempting to update ID:", id);

    await db.query(
      'UPDATE category SET categoryname = ?, categorydescription = ? WHERE categoryid = ?',
      [name, description, id]
    );

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Update API Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}