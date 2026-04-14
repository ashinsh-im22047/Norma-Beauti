import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'This Month';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    // 1. Fetch all orders and total customers
    const [orders]: any = await db.query('SELECT orderid, totalamount, status, orderdate FROM `order`');
    const [users]: any = await db.query('SELECT COUNT(*) as total FROM `customer`');
    const totalUsers = users[0].total;

    // 2. Determine Date Range based on Filter
    const now = new Date();
    let startDate = new Date(0); // Default to all time
    let endDate = new Date(); // Default to now

    if (filter === 'Today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (filter === 'This Week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (filter === 'This Month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'Last 3 Months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (filter === 'This Year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (filter === 'Custom Range') {
        if (customStart) startDate = new Date(customStart);
        if (customEnd) {
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999); // Include the whole end day
        }
    }

    // Filter orders by the calculated date range
    const filteredOrders = orders.filter((o: any) => {
        const d = new Date(o.orderdate);
        return d >= startDate && d <= endDate;
    });

    // 3. Calculate KPIs
    const totalSales = filteredOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalamount || 0), 0);
    const totalOrderCount = filteredOrders.length;

    // 4. Calculate Order Status Breakdown
    const statusCounts = { Delivered: 0, Active: 0, Cancelled: 0 };
    filteredOrders.forEach((o: any) => {
        if (o.status === 'Delivered') statusCounts.Delivered++;
        else if (o.status === 'Cancelled' || o.status === 'Rejected') statusCounts.Cancelled++;
        else statusCounts.Active++; // Pending & Processing
    });

    // 5. Calculate Sales Trend (Dynamic Grouping based on time range)
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    const trendMap: any = {};
    filteredOrders.forEach((o: any) => {
        const d = new Date(o.orderdate);
        // If range is > 90 days, group by Month. Otherwise, group by Day.
        const key = daysDiff > 90 
            ? d.toLocaleString('default', { month: 'short', year: 'numeric' }) 
            : d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        
        trendMap[key] = (trendMap[key] || 0) + parseFloat(o.totalamount || 0);
    });

    // Convert Map to Array and keep max 7 items for the UI chart
    const trendData = Object.keys(trendMap).map(k => ({ label: k, value: trendMap[k] }));
    const recentTrend = trendData.slice(-7); // Get the 7 most recent data points

    return NextResponse.json({
        totalSales,
        totalOrderCount,
        totalUsers,
        statusCounts,
        trendData: recentTrend
    });

  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}