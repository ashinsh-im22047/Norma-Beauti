import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch ALL offers applied to Individual Products
    const [productsResult]: any = await db.query(`
      SELECT 
        p.productid as id, 
        p.productname as name, 
        p.price as originalPrice, 
        p.imageurl as image,
        p.productdescription as description, 
        o.offername,
        o.discountpercent,
        o.startdate,
        o.enddate
      FROM offer o
      JOIN offeredproducts op ON o.offerid = op.offerid
      JOIN product p ON op.productid = p.productid
    `);

    // 2. Fetch ALL offers applied to Ready Made Gift Boxes
    const [itemsResult]: any = await db.query(`
      SELECT 
        i.itemid as id, 
        i.itemname as name, 
        i.itemprice as originalPrice, 
        i.imageurl as image,
        i.itemdescription as description, 
        o.offername,
        o.discountpercent,
        o.startdate,
        o.enddate
      FROM offer o
      JOIN offereditems oi ON o.offerid = oi.offerid
      JOIN item i ON oi.itemid = i.itemid
    `);

    // Safely extract the arrays
    const products = Array.isArray(productsResult) ? productsResult : [];
    const items = Array.isArray(itemsResult) ? itemsResult : [];

    const allOffersRaw = [...products, ...items];

    // 3. Timezone-Safe Date Filtering in JavaScript
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison

    const activeOffers = allOffersRaw.filter((item: any) => {
        const startDate = new Date(item.startdate);
        const endDate = new Date(item.enddate);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999); // End of the day

        // Only keep if today is between start and end
        return today >= startDate && today <= endDate;
    }).map((item: any) => {
        const origPrice = parseFloat(item.originalPrice || 0);
        let offerPrice = origPrice;
        
        // Calculate discount if it exists and is greater than 0
        if (item.discountpercent && parseFloat(item.discountpercent) > 0) {
            const discountAmount = origPrice * (parseFloat(item.discountpercent) / 100);
            offerPrice = origPrice - discountAmount;
        }

        return {
            id: item.id,
            name: item.name,
            desc: item.description, // Mapped safely for the frontend!
            image: item.image,
            offername: item.offername,
            discountpercent: item.discountpercent,
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