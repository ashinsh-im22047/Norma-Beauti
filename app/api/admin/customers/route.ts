// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch Users + Customer Info (Using exact column names from your screenshots)
    const [customers]: any = await db.query(`
      SELECT 
        c.id AS customer_id, 
        c.fullName AS name, 
        u.email, 
        c.phoneNumber AS phone,
        u.createdAt AS joined_date
      FROM user u 
      LEFT JOIN customer c ON u.id = c.userId 
      WHERE u.role != 'ADMIN' OR u.role IS NULL
      ORDER BY u.createdAt DESC
    `);

    // 2. Fetch all orders so we can attach them to the customers
    const [orders]: any = await db.query(`
      SELECT orderid, customerid, totalamount, status, orderdate 
      FROM \`order\`
      ORDER BY orderdate DESC
    `);

    // 3. Attach order history to each customer
    const customersWithOrders = customers.map((c: any) => ({
      ...c,
      orders: orders.filter((o: any) => o.customerid === c.customer_id)
    }));

    return NextResponse.json(customersWithOrders);

  } catch (error: any) {
    console.error("CUSTOMER API SQL ERROR: ", error.message);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}