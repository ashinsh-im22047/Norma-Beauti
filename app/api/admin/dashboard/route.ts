import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Today's Sales & Orders
    // Using CURDATE() to only get orders placed today
    const [todayStats]: any = await db.query(`
      SELECT 
        COALESCE(SUM(totalamount), 0) as total_sales, 
        COUNT(orderid) as total_orders 
      FROM \`order\` 
      WHERE DATE(orderdate) = CURDATE()
    `);

    // 2. Pending Orders Count (To show the red badge and glowing effect)
    const [pendingStats]: any = await db.query(`
      SELECT COUNT(orderid) as pending_orders 
      FROM \`order\` 
      WHERE status = 'Pending'
    `);

    // 3. Total Customers
    const [userStats]: any = await db.query(`
      SELECT COUNT(id) as total_users 
      FROM user 
      WHERE role != 'ADMIN' OR role IS NULL
    `);

    // 4. Low Stock Count (Combines Individual Products and Ready-Made Items)
    const [lowStockProd]: any = await db.query(`SELECT COUNT(*) as count FROM product WHERE availablequantity <= min_stock`);
    const [lowStockItem]: any = await db.query(`SELECT COUNT(*) as count FROM item WHERE itemquantity <= min_stock`);
    const lowStockTotal = (lowStockProd[0]?.count || 0) + (lowStockItem[0]?.count || 0);

    return NextResponse.json({
      todaySales: todayStats[0].total_sales,
      todayOrders: todayStats[0].total_orders,
      pendingOrders: pendingStats[0].pending_orders,
      totalUsers: userStats[0].total_users,
      lowStockItems: lowStockTotal
    });

  } catch (error: any) {
    console.error("Dashboard API Error: ", error.message);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}