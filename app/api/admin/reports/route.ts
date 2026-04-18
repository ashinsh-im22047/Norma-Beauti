import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'This Month';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');
    const categoryFilter = searchParams.get('categoryFilter') || 'All Categories';
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // 1. Fetch Total Users
    const [users]: any = await db.query('SELECT COUNT(*) as total FROM `customer`');
    const totalUsers = users[0].total;

    // 2. Determine Date Range
    const now = new Date();
    let startDateStr = '1970-01-01 00:00:00';
    let endDateStr = '2099-12-31 23:59:59';
    let startDateObj = new Date(0);
    let endDateObj = new Date();

    const formatDate = (d: Date, isEnd = false) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const time = isEnd ? '23:59:59' : '00:00:00';
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`;
    };

    if (filter === 'Today') {
        startDateObj = new Date(now.setHours(0, 0, 0, 0));
        startDateStr = formatDate(startDateObj);
        endDateStr = formatDate(startDateObj, true);
    } else if (filter === 'This Week') {
        const d = new Date();
        startDateObj = new Date(d.setDate(d.getDate() - d.getDay()));
        startDateStr = formatDate(startDateObj);
    } else if (filter === 'This Month') {
        startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
        startDateStr = formatDate(startDateObj);
    } else if (filter === 'Last 3 Months') {
        startDateObj = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        startDateStr = formatDate(startDateObj);
    } else if (filter === 'This Year') {
        startDateObj = new Date(now.getFullYear(), 0, 1);
        startDateStr = formatDate(startDateObj);
    } else if (filter === 'Custom Range') {
        if (customStart) {
            startDateObj = new Date(customStart);
            startDateStr = formatDate(startDateObj);
        }
        if (customEnd) {
            endDateObj = new Date(customEnd);
            endDateStr = formatDate(endDateObj, true);
        }
    }

    // 3. Fetch Orders
    const [filteredOrders]: any = await db.query(
        'SELECT orderid, customerid, totalamount, status, orderdate, shipping_name FROM `order` WHERE orderdate >= ? AND orderdate <= ? ORDER BY orderdate DESC',
        [startDateStr, endDateStr]
    );

    // 4. Calculate KPIs
    const totalSales = filteredOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalamount || 0), 0);
    const totalOrderCount = filteredOrders.length;

    // 5. Status Breakdown
    const statusCounts = { Delivered: 0, Active: 0, Cancelled: 0 };
    filteredOrders.forEach((o: any) => {
        if (o.status === 'Delivered') statusCounts.Delivered++;
        else if (o.status === 'Cancelled' || o.status === 'Rejected') statusCounts.Cancelled++;
        else statusCounts.Active++; 
    });

    // 6. Sales Trend
    const timeDiff = endDateObj.getTime() - startDateObj.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    const trendMap: any = {};
    filteredOrders.forEach((o: any) => {
        const d = new Date(o.orderdate);
        const key = daysDiff > 90 
            ? d.toLocaleString('default', { month: 'short', year: 'numeric' }) 
            : d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        trendMap[key] = (trendMap[key] || 0) + parseFloat(o.totalamount || 0);
    });
    const trendData = Object.keys(trendMap).map(k => ({ label: k, value: trendMap[k] }));
    const recentTrend = trendData.slice(-7); 

    // --- ENHANCEMENT: Fetch categorized sales data with IDs ---
    const [orderProducts]: any = await db.query(`
        SELECT op.orderid, p.productid as id, p.productname as name, p.imageurl as image, op.quantity as qty, op.amount as price, 'Individual Products' as type
        FROM orderedproducts op
        JOIN product p ON op.productid = p.productid
        JOIN \`order\` o ON op.orderid = o.orderid
        WHERE o.orderdate >= ? AND o.orderdate <= ?
    `, [startDateStr, endDateStr]);

    const [orderItems]: any = await db.query(`
        SELECT oi.orderid, i.itemid as id, i.itemname as name, i.imageurl as image, oi.quantity as qty, oi.amount as price, 'Ready Made Gift Boxes' as type
        FROM ordereditems oi
        JOIN item i ON oi.itemid = i.itemid
        JOIN \`order\` o ON oi.orderid = o.orderid
        WHERE o.orderdate >= ? AND o.orderdate <= ?
    `, [startDateStr, endDateStr]);

    // Safely attempt to fetch custom boxes if table exists
    let orderCustomBoxes: any = [];
    try {
        const [res]: any = await db.query(`
            SELECT oc.orderid, 'custom_box' as id, 'Custom Box' as name, '' as image, oc.quantity as qty, oc.price as price, 'Customizable Gift Boxes' as type
            FROM orderedcustomboxes oc
            JOIN \`order\` o ON oc.orderid = o.orderid
            WHERE o.orderdate >= ? AND o.orderdate <= ?
        `, [startDateStr, endDateStr]);
        orderCustomBoxes = res;
    } catch (e) { /* Ignore if table doesn't exist yet */ }

    let combinedSales = [...orderProducts, ...orderItems, ...orderCustomBoxes];

    // Apply Category Filter
    if (categoryFilter !== 'All Categories') {
        combinedSales = combinedSales.filter(s => s.type === categoryFilter);
    }

    const salesMap: any = {};
    combinedSales.forEach((s: any) => {
        const keyName = s.name || 'Unknown';
        if (!salesMap[keyName]) {
            salesMap[keyName] = { id: s.id || 'N/A', name: keyName, image: s.image, qtySold: 0, revenue: 0, type: s.type };
        }
        salesMap[keyName].qtySold += parseInt(s.qty || 0);
        salesMap[keyName].revenue += parseFloat(s.price || 0) * parseInt(s.qty || 0);
    });

    const sortedSales = Object.values(salesMap).sort((a: any, b: any) => b.qtySold - a.qtySold);
    
    // Apply Limit Filter
    const topProducts = sortedSales.slice(0, limit);
    const lowSelling = [...sortedSales].sort((a: any, b: any) => a.qtySold - b.qtySold).slice(0, limit);
    const fullSalesReport = sortedSales;

    // --- RECENT TRANSACTIONS ---
    const recentTransactions = filteredOrders.slice(0, limit).map((o: any) => ({
        id: o.orderid,
        customer: o.shipping_name || 'Guest Customer',
        date: new Date(o.orderdate).toLocaleDateString(),
        amount: parseFloat(o.totalamount || 0),
        status: o.status
    }));

    return NextResponse.json({
        totalSales, totalOrderCount, totalUsers, statusCounts, trendData: recentTrend,
        topProducts, lowSelling, fullSalesReport, recentTransactions 
    });

  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}