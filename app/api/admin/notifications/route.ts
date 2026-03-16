import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const notifications: any[] = [];

    // 1. Check Low Stock Individual Products
    const [lowProducts]: any = await db.query('SELECT productid, productname, availablequantity FROM product WHERE availablequantity <= 5');
    const productsArray = Array.isArray(lowProducts) ? lowProducts : [];
    
    productsArray.forEach((p: any) => {
      notifications.push({
        id: `prod_${p.productid}`, // <-- STABLE ID
        type: 'Warning',
        title: 'Low Stock: Product',
        message: `'${p.productname}' is running low (Qty: ${p.availablequantity}).`,
        link: `/admin/inventory/products?category=cat_individual&highlight=${p.productid}` 
      });
    });

    // 2. Check Low Stock Ready-Made Items (Gift Boxes)
    const [lowItems]: any = await db.query('SELECT itemid, itemname, itemquantity FROM item WHERE itemquantity <= 5');
    const itemsArray = Array.isArray(lowItems) ? lowItems : [];
    
    itemsArray.forEach((i: any) => {
      notifications.push({
        id: `item_${i.itemid}`, // <-- STABLE ID
        type: 'Warning',
        title: 'Low Stock: Gift Box',
        message: `'${i.itemname}' is running low (Qty: ${i.itemquantity}).`,
        link: `/admin/inventory/products?category=cat_ready_box&highlight=${i.itemid}`
      });
    });

    // 3. Check Pending Orders
    const [pendingOrders]: any = await db.query("SELECT orderid, totalamount FROM `order` WHERE status = 'Pending'");
    const ordersArray = Array.isArray(pendingOrders) ? pendingOrders : [];
    
    ordersArray.forEach((o: any) => {
      notifications.push({
        id: `order_${o.orderid}`, // <-- STABLE ID
        type: 'Info',
        title: 'New Pending Order',
        message: `Order #${o.orderid} is waiting for processing (LKR ${parseFloat(o.totalamount).toLocaleString()}).`,
        link: `/admin/orders?highlight=${o.orderid}`
      });
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}