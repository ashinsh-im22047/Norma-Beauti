import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// --- NEW: FORCE NEXT.JS TO FETCH FRESH DATA EVERY TIME (BYPASS CACHE) ---
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [productsResult]: any = await db.query(`
      SELECT 
        p.productid as id, 
        p.productname as name, 
        p.price as originalPrice, 
        p.imageurl as image,
        p.productdescription as description, 
        p.availablequantity as quantity,
        p.min_stock,
        o.offername,
        o.offer_type,
        o.discountpercent,
        o.fixed_discount,
        o.buy_qty,
        o.get_qty,
        o.startdate,
        o.enddate
      FROM offer o
      JOIN offeredproducts op ON o.offerid = op.offerid
      JOIN product p ON op.productid = p.productid
    `);

    const [itemsResult]: any = await db.query(`
      SELECT 
        i.itemid as id, 
        i.itemname as name, 
        i.itemprice as originalPrice, 
        i.imageurl as image,
        i.itemdescription as description, 
        i.itemquantity as quantity,
        i.min_stock,
        o.offername,
        o.offer_type,
        o.discountpercent,
        o.fixed_discount,
        o.buy_qty,
        o.get_qty,
        o.startdate,
        o.enddate
      FROM offer o
      JOIN offereditems oi ON o.offerid = oi.offerid
      JOIN item i ON oi.itemid = i.itemid
    `);

    const products = Array.isArray(productsResult) ? productsResult : [];
    const items = Array.isArray(itemsResult) ? itemsResult : [];
    const allOffersRaw = [...products, ...items];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOffers = allOffersRaw.filter((item: any) => {
        const startDate = new Date(item.startdate);
        const endDate = new Date(item.enddate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
    }).map((item: any) => {
        const origPrice = parseFloat(item.originalPrice || 0);
        let offerPrice = origPrice;
        
        // --- BULLETPROOF LOGIC ---
        const pct = parseFloat(item.discountpercent);
        const fix = parseFloat(item.fixed_discount);

        if (item.offer_type === 'FIXED' && !isNaN(fix) && fix > 0) {
            offerPrice = Math.max(0, origPrice - fix);
        } else if (item.offer_type === 'PERCENTAGE' && !isNaN(pct) && pct > 0) {
            offerPrice = origPrice - (origPrice * pct / 100);
        } else if (!isNaN(fix) && fix > 0) {
            // Fallback just in case offer_type is wrong
            offerPrice = Math.max(0, origPrice - fix);
        } else if (!isNaN(pct) && pct > 0) {
            offerPrice = origPrice - (origPrice * pct / 100);
        }

        return {
            id: item.id,
            name: item.name,
            desc: item.description, 
            image: item.image,
            quantity: item.quantity,      
            min_stock: item.min_stock,    
            offername: item.offername,
            offer_type: item.offer_type,
            discountpercent: item.discountpercent,
            fixed_discount: item.fixed_discount,
            buy_qty: item.buy_qty,
            get_qty: item.get_qty,
            price: offerPrice.toFixed(2), 
            originalPrice: origPrice.toFixed(2),
            offerPrice: offerPrice.toFixed(2),
            isOffer: true
        };
    });

    return NextResponse.json(activeOffers);
  } catch (error) {
    console.error("Error fetching public offers:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}